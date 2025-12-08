'use server'

import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'
import { ExpenseType, PayerType } from '@/lib/types'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { getUserGroupId } from '@/lib/db-cache'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

const UploadCSVSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1).max(255),
  payerType: z.enum(['UserA', 'UserB', 'Common'])
})

const UpdateExpenseTypeSchema = z.object({
  transactionId: z.string().uuid(),
  expenseType: z.enum(['Household', 'Personal'])
})

const GetTransactionsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  expenseType: z.enum(['Household', 'Personal']).optional(),
  payerType: z.enum(['UserA', 'UserB', 'Common']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(10).max(50).optional()
})

export async function uploadCSV(
  csvContent: string,
  fileName: string,
  payerType: PayerType
) {
  const user = await requireAuth()

  const parsed = UploadCSVSchema.safeParse({ csvContent, fileName, payerType })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  const parseResult = await parseCSV(csvContent, fileName)
  if (!parseResult.success) {
    return { error: parseResult.errors.join(', ') }
  }

  const values = parseResult.data.map((t, index) => {
    const offset = index * 8
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
  }).join(', ')

  const params = parseResult.data.flatMap(t => [
    groupId,
    user.id,
    t.date,
    t.amount,
    t.description,
    payerType,
    'Household' as ExpenseType,
    t.source_file_name
  ])

  try {
    const result = await query(
      `INSERT INTO transactions
        (group_id, user_id, date, amount, description, payer_type, expense_type, source_file_name)
       VALUES ${values}
       RETURNING id`,
      params
    )

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true, count: result.rows.length }
  } catch (error) {
    return { error: 'Failed to save transactions' }
  }
}

export async function getTransactions(filters?: {
  month?: string
  expenseType?: ExpenseType
  payerType?: PayerType
  page?: number
  pageSize?: number
}) {
  const user = await requireAuth()

  if (filters) {
    const parsed = GetTransactionsSchema.safeParse(filters)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 25

  const conditions: string[] = ['group_id = $1']
  const params: (string | number)[] = [groupId]
  let paramIndex = 2

  if (filters?.month) {
    const year = filters.month.substring(0, 4)
    const month = filters.month.substring(5, 7)
    const monthNum = parseInt(month, 10)
    const nextMonth = monthNum === 12
      ? '01'
      : String(monthNum + 1).padStart(2, '0')
    const nextYear = monthNum === 12
      ? String(parseInt(year, 10) + 1)
      : year

    conditions.push(`date >= $${paramIndex}`)
    params.push(`${year}-${month}-01`)
    paramIndex++

    conditions.push(`date < $${paramIndex}`)
    params.push(`${nextYear}-${nextMonth}-01`)
    paramIndex++
  }

  if (filters?.expenseType) {
    conditions.push(`expense_type = $${paramIndex}`)
    params.push(filters.expenseType)
    paramIndex++
  }

  if (filters?.payerType) {
    conditions.push(`payer_type = $${paramIndex}`)
    params.push(filters.payerType)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  try {
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}`,
      params
    )

    const totalCount = parseInt(countResult.rows[0].total, 10)
    if (isNaN(totalCount)) {
      return { error: 'Invalid count result' }
    }
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const safePage = Math.min(page, totalPages)
    const offset = (safePage - 1) * pageSize

    const result = await query(
      `SELECT * FROM transactions
       WHERE ${whereClause}
       ORDER BY date DESC, id DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    )

    return {
      success: true,
      transactions: result.rows,
      pagination: {
        totalCount,
        totalPages,
        currentPage: safePage,
        pageSize
      }
    }
  } catch (error) {
    return { error: 'Failed to fetch transactions' }
  }
}

export async function updateTransactionExpenseType(
  transactionId: string,
  expenseType: ExpenseType
) {
  const user = await requireAuth()

  const parsed = UpdateExpenseTypeSchema.safeParse({ transactionId, expenseType })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  try {
    await query(
      'UPDATE transactions SET expense_type = $1 WHERE id = $2 AND group_id = $3',
      [expenseType, transactionId, groupId]
    )

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(transactionId: string) {
  const user = await requireAuth()

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  try {
    await query(
      'DELETE FROM transactions WHERE id = $1 AND group_id = $2',
      [transactionId, groupId]
    )

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete transaction' }
  }
}

const GetSettlementDataSchema = z.object({
  targetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Expected YYYY-MM')
})

export async function getSettlementData(targetMonth: string) {
  const user = await requireAuth()

  const parsed = GetSettlementDataSchema.safeParse({ targetMonth })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.targetMonth?.[0] || 'Invalid month format' }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  const groupResult = await query(
    'SELECT * FROM groups WHERE id = $1',
    [groupId]
  )

  if (groupResult.rows.length === 0) {
    return { error: 'Group not found' }
  }

  const group = groupResult.rows[0]

  const year = targetMonth.substring(0, 4)
  const month = targetMonth.substring(5, 7)
  const monthNum = parseInt(month, 10)
  const nextMonth = monthNum === 12
    ? '01'
    : String(monthNum + 1).padStart(2, '0')
  const nextYear = monthNum === 12
    ? String(parseInt(year, 10) + 1)
    : year

  const transactionsResult = await query(
    `SELECT * FROM transactions
     WHERE group_id = $1
       AND date >= $2
       AND date < $3`,
    [groupId, `${year}-${month}-01`, `${nextYear}-${nextMonth}-01`]
  )

  const transactions = transactionsResult.rows

  const usersResult = await query<{ id: string; name: string }>(
    'SELECT id, name FROM users WHERE group_id = $1',
    [groupId]
  )

  const userAData = usersResult.rows.find(u => u.id === group.user_a_id)
  const userBData = usersResult.rows.find(u => u.id === group.user_b_id)

  const { calculateSettlement } = await import('@/lib/settlement')
  const settlement = calculateSettlement(transactions, group, targetMonth)

  return {
    success: true,
    settlement,
    userAName: userAData?.name || 'User A',
    userBName: userBData?.name || null
  }
}
