'use server'

import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'
import { ExpenseType, PayerType } from '@/lib/types'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { getUserGroupId } from '@/lib/db-cache'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS, CACHE_DURATIONS, cachedFetch } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'

const UploadCSVSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1).max(255),
  payerType: z.enum(['UserA', 'UserB', 'Common']),
  payerTypes: z.array(z.enum(['UserA', 'UserB', 'Common'])).optional()
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
  payerType: PayerType,
  payerTypes?: PayerType[]
) {
  const user = await requireAuth()

  const rateLimitResult = checkRateLimit(user.id, {
    maxAttempts: 10,
    windowMs: 60 * 1000
  }, 'csv-upload')

  if (!rateLimitResult.allowed) {
    return {
      error: `CSV取り込みの試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
    }
  }

  const parsed = UploadCSVSchema.safeParse({ csvContent, fileName, payerType, payerTypes })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'グループに所属していません' }
  }

  const parseResult = await parseCSV(csvContent, fileName)
  if (!parseResult.success) {
    return { error: parseResult.errors.join(', ') }
  }

  const groupResult = await query<{ user_a_id: string; user_b_id: string | null }>(
    'SELECT user_a_id, user_b_id FROM groups WHERE id = $1',
    [groupId]
  )

  if (groupResult.rows.length === 0) {
    return { error: 'グループが見つかりません' }
  }

  const group = groupResult.rows[0]

  const usersResult = await query<{ id: string; name: string }>(
    'SELECT id, name FROM users WHERE group_id = $1',
    [groupId]
  )

  const usersByName = new Map<string, string>()
  usersResult.rows.forEach(u => {
    usersByName.set(u.name.toLowerCase(), u.id)
  })

  const values = parseResult.data.map((t, index) => {
    const offset = index * 9
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
  }).join(', ')

  const params = parseResult.data.flatMap((t, index) => {
    const rowPayerType = payerTypes?.[index] ?? payerType
    let payerUserId: string | null = null
    if (rowPayerType !== 'Common' && t.payer_name) {
      const foundUserId = usersByName.get(t.payer_name.toLowerCase())
      if (foundUserId) {
        payerUserId = foundUserId
      }
    }

    return [
      groupId,
      user.id,
      t.date,
      t.amount,
      t.description,
      rowPayerType,
      'Household' as ExpenseType,
      t.source_file_name,
      payerUserId
    ]
  })

  try {
    const result = await query(
      `INSERT INTO transactions
        (group_id, user_id, date, amount, description, payer_type, expense_type, source_file_name, payer_user_id)
       VALUES ${values}
       RETURNING id`,
      params
    )

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true, count: result.rows.length }
  } catch (error) {
    return { error: '取引の保存に失敗しました' }
  }
}

export async function getTransactions(filters?: {
  month?: string
  expenseType?: ExpenseType
  payerType?: PayerType
  page?: number
  pageSize?: number
}): Promise<
  | { error: { payerType?: string[]; month?: string[]; expenseType?: string[]; page?: string[]; pageSize?: string[] } }
  | { error: string }
  | {
      success: true;
      transactions: any[];
      pagination: { totalCount: number; totalPages: number; currentPage: number; pageSize: number };
      group: {
        user_a_id: string;
        user_a_name: string;
        user_b_id: string | null;
        user_b_name: string | null;
      };
    }
> {
  const user = await requireAuth()

  if (filters) {
    const parsed = GetTransactionsSchema.safeParse(filters)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'グループに所属していません' }
  }

  const month = filters?.month ?? ''
  const expenseType = filters?.expenseType ?? ''
  const payerType = filters?.payerType ?? ''
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 25

  return cachedFetch(
    async () => {
      const groupResult = await query<{
        user_a_id: string;
        user_b_id: string | null;
      }>(
        'SELECT user_a_id, user_b_id FROM groups WHERE id = $1',
        [groupId]
      )

      if (groupResult.rows.length === 0) {
        return { error: 'グループが見つかりません' }
      }

      const groupData = groupResult.rows[0]

      const usersResult = await query<{ id: string; name: string }>(
        'SELECT id, name FROM users WHERE group_id = $1',
        [groupId]
      )

      const userAData = usersResult.rows.find(u => u.id === groupData.user_a_id)
      const userBData = usersResult.rows.find(u => u.id === groupData.user_b_id)

      const conditions: string[] = ['group_id = $1']
      const params: (string | number)[] = [groupId]
      let paramIndex = 2

      if (month) {
        const year = month.substring(0, 4)
        const monthStr = month.substring(5, 7)
        const monthNum = parseInt(monthStr, 10)
        const nextMonth = monthNum === 12
          ? '01'
          : String(monthNum + 1).padStart(2, '0')
        const nextYear = monthNum === 12
          ? String(parseInt(year, 10) + 1)
          : year

        conditions.push(`date >= $${paramIndex}`)
        params.push(`${year}-${monthStr}-01`)
        paramIndex++

        conditions.push(`date < $${paramIndex}`)
        params.push(`${nextYear}-${nextMonth}-01`)
        paramIndex++
      }

      if (expenseType) {
        conditions.push(`expense_type = $${paramIndex}`)
        params.push(expenseType)
        paramIndex++
      }

      if (payerType) {
        conditions.push(`payer_type = $${paramIndex}`)
        params.push(payerType)
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
          return { error: '件数の取得に失敗しました' }
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

        const transactions = result.rows.map(row => ({
          ...row,
          date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
          amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
          created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
          updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
        }))

        return {
          success: true as const,
          transactions,
          pagination: {
            totalCount,
            totalPages,
            currentPage: safePage,
            pageSize
          },
          group: {
            user_a_id: groupData.user_a_id,
            user_a_name: userAData?.name || 'User A',
            user_b_id: groupData.user_b_id,
            user_b_name: userBData?.name || null
          }
        }
      } catch (error) {
        return { error: '取引の取得に失敗しました' }
      }
    },
    ['transactions', groupId, month, expenseType, payerType, String(page), String(pageSize)],
    {
      revalidate: CACHE_DURATIONS.transactions,
      tags: [CACHE_TAGS.transactions(groupId)]
    }
  )
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
    return { error: 'グループに所属していません' }
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
    return { error: '取引の更新に失敗しました' }
  }
}

export async function deleteTransaction(transactionId: string) {
  const user = await requireAuth()

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'グループに所属していません' }
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
    return { error: '取引の削除に失敗しました' }
  }
}

const UpdatePayerSchema = z.object({
  transactionId: z.string().uuid(),
  payerUserId: z.string().uuid().nullable()
})

export async function updateTransactionPayer(
  transactionId: string,
  payerUserId?: string | null
): Promise<{ success: true } | { error: string | Record<string, string[]> }> {
  const user = await requireAuth()

  const parsed = UpdatePayerSchema.safeParse({ transactionId, payerUserId: payerUserId ?? null })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'グループに所属していません' }
  }

  if (payerUserId) {
    const userCheck = await query<{ id: string }>(
      'SELECT id FROM users WHERE id = $1 AND group_id = $2',
      [payerUserId, groupId]
    )
    if (userCheck.rows.length === 0) {
      return { error: 'この支払い元を設定する権限がありません' }
    }
  }

  try {
    await query(
      'UPDATE transactions SET payer_user_id = $1 WHERE id = $2 AND group_id = $3',
      [payerUserId ?? null, transactionId, groupId]
    )

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true }
  } catch (error) {
    return { error: '支払い元の更新に失敗しました' }
  }
}

const GetSettlementDataSchema = z.object({
  targetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '月の形式が不正です（YYYY-MM形式で入力してください）')
})

export async function getSettlementData(targetMonth: string): Promise<
  | { error: string }
  | { success: true; settlement: any; userAName: string; userBName: string | null }
> {
  const user = await requireAuth()

  const parsed = GetSettlementDataSchema.safeParse({ targetMonth })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.targetMonth?.[0] || '月の形式が不正です' }
  }

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'グループに所属していません' }
  }

  return cachedFetch(
    async () => {
      const groupResult = await query(
        'SELECT * FROM groups WHERE id = $1',
        [groupId]
      )

      if (groupResult.rows.length === 0) {
        return { error: 'グループが見つかりません' }
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

      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const transactions = transactionsResult.rows.map(row => ({
        ...row,
        date: row.date instanceof Date ? formatLocalDate(row.date) : row.date,
        amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
      }))

      const usersResult = await query<{ id: string; name: string }>(
        'SELECT id, name FROM users WHERE group_id = $1',
        [groupId]
      )

      const userAData = usersResult.rows.find(u => u.id === group.user_a_id)
      const userBData = usersResult.rows.find(u => u.id === group.user_b_id)

      const { calculateSettlement } = await import('@/lib/settlement')
      const settlement = calculateSettlement(transactions, group, targetMonth)

      return {
        success: true as const,
        settlement,
        userAName: userAData?.name || 'User A',
        userBName: userBData?.name || null
      }
    },
    ['settlement', groupId, targetMonth],
    {
      revalidate: CACHE_DURATIONS.settlement,
      tags: [CACHE_TAGS.settlement(groupId, targetMonth), CACHE_TAGS.settlementAll(groupId)]
    }
  )
}
