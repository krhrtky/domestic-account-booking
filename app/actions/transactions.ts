'use server'

import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'
import { ExpenseType, PayerType } from '@/lib/types'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'

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
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional()
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

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  const groupId = currentUserResult.rows[0].group_id

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

    return { success: true, count: result.rows.length }
  } catch (error) {
    return { error: 'Failed to save transactions' }
  }
}

export async function getTransactions(filters?: {
  month?: string
  expenseType?: ExpenseType
  payerType?: PayerType
  cursor?: string
  limit?: number
}) {
  const user = await requireAuth()

  if (filters) {
    const parsed = GetTransactionsSchema.safeParse(filters)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }
  }

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  const groupId = currentUserResult.rows[0].group_id
  const pageLimit = filters?.limit ?? 50

  const conditions: string[] = ['group_id = $1']
  const params: any[] = [groupId]
  let paramIndex = 2

  if (filters?.cursor) {
    const cursorParts = filters.cursor.split('|')
    if (cursorParts.length !== 2) {
      return { error: 'Invalid cursor format' }
    }
    const [cursorDate, cursorId] = cursorParts

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cursorDate)) {
      return { error: 'Invalid cursor date format' }
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursorId)) {
      return { error: 'Invalid cursor ID format' }
    }

    conditions.push(`(date < $${paramIndex} OR (date = $${paramIndex} AND id < $${paramIndex + 1}))`)
    params.push(cursorDate, cursorId)
    paramIndex += 2
  }

  if (filters?.month) {
    const year = filters.month.substring(0, 4)
    const month = filters.month.substring(5, 7)
    const nextMonth = parseInt(month) === 12
      ? '01'
      : String(parseInt(month) + 1).padStart(2, '0')
    const nextYear = parseInt(month) === 12
      ? String(parseInt(year) + 1)
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
    const result = await query(
      `SELECT * FROM transactions
       WHERE ${whereClause}
       ORDER BY date DESC, id DESC
       LIMIT $${paramIndex}`,
      [...params, pageLimit]
    )

    const data = result.rows
    const hasMore = data.length === pageLimit
    const nextCursor = hasMore && data.length > 0
      ? `${data[data.length - 1].date}|${data[data.length - 1].id}`
      : null

    return {
      success: true,
      transactions: data,
      nextCursor,
      hasMore
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

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  try {
    await query(
      'UPDATE transactions SET expense_type = $1 WHERE id = $2 AND group_id = $3',
      [expenseType, transactionId, currentUserResult.rows[0].group_id]
    )

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(transactionId: string) {
  const user = await requireAuth()

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  try {
    await query(
      'DELETE FROM transactions WHERE id = $1 AND group_id = $2',
      [transactionId, currentUserResult.rows[0].group_id]
    )

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

  const currentUserResult = await query<{ group_id: string | null; name: string }>(
    'SELECT group_id, name FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  const groupId = currentUserResult.rows[0].group_id

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
  const nextMonth = parseInt(month) === 12
    ? '01'
    : String(parseInt(month) + 1).padStart(2, '0')
  const nextYear = parseInt(month) === 12
    ? String(parseInt(year) + 1)
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
