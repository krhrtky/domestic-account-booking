'use server'

import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'
import { ExpenseType, PayerType } from '@/lib/types'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { getUserGroupId } from '@/lib/db-cache'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS, CACHE_DURATIONS, cachedFetch } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'
import { Decimal } from '@prisma/client/runtime/library'

// Type for transaction row from Prisma query
interface TransactionRow {
  id: string
  groupId: string
  userId: string
  date: Date
  amount: Decimal
  description: string
  payerType: string
  expenseType: string
  sourceFileName: string | null
  uploadedBy: string | null
  payerUserId: string | null
  createdAt: Date
  updatedAt: Date
}

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

  // L-SC-004: CSV upload rate limit - 10 attempts per 1 minute (per user)
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

  // Get group users for payer_name matching
  const groupUsers = await prisma.user.findMany({
    where: { groupId },
    select: { id: true, name: true }
  })

  const usersByName = new Map<string, string>()
  groupUsers.forEach((u: { id: string; name: string }) => {
    usersByName.set(u.name.toLowerCase(), u.id)
  })

  try {
    const transactions = await prisma.transaction.createMany({
      data: parseResult.data.map((t, index) => {
        const rowPayerType = payerTypes?.[index] ?? payerType
        let payerUserId: string | null = null

        // Determine payer_user_id from payer_name if available
        if (rowPayerType !== 'Common' && t.payer_name) {
          const foundUserId = usersByName.get(t.payer_name.toLowerCase())
          if (foundUserId) {
            payerUserId = foundUserId
          }
        }

        return {
          groupId,
          userId: user.id,
          date: new Date(t.date),
          amount: new Decimal(t.amount),
          description: t.description,
          payerType: rowPayerType,
          expenseType: 'Household' as const,
          sourceFileName: t.source_file_name,
          payerUserId
        }
      })
    })

    revalidateTag(CACHE_TAGS.transactions(groupId))
    revalidateTag(CACHE_TAGS.settlementAll(groupId))

    return { success: true, count: transactions.count }
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
      // Get group data with user info
      const groupData = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          userA: { select: { id: true, name: true } },
          userB: { select: { id: true, name: true } }
        }
      })

      if (!groupData) {
        return { error: 'グループが見つかりません' }
      }

      // Build where clause
      const where: any = { groupId }

      if (month) {
        const year = parseInt(month.substring(0, 4), 10)
        const monthNum = parseInt(month.substring(5, 7), 10)
        const startDate = new Date(year, monthNum - 1, 1)
        const endDate = new Date(year, monthNum, 1)

        where.date = {
          gte: startDate,
          lt: endDate
        }
      }

      if (expenseType) {
        where.expenseType = expenseType
      }

      if (payerType) {
        where.payerType = payerType
      }

      try {
        const totalCount = await prisma.transaction.count({ where })

        if (isNaN(totalCount)) {
          return { error: '件数の取得に失敗しました' }
        }
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
        const safePage = Math.min(page, totalPages)
        const offset = (safePage - 1) * pageSize

        const results = await prisma.transaction.findMany({
          where,
          orderBy: [
            { date: 'desc' },
            { id: 'desc' }
          ],
          skip: offset,
          take: pageSize
        })

        const formatLocalDate = (date: Date): string => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const transactions = results.map((row: TransactionRow) => ({
          id: row.id,
          group_id: row.groupId,
          user_id: row.userId,
          date: formatLocalDate(row.date),
          amount: row.amount.toNumber(),
          description: row.description,
          payer_type: row.payerType,
          expense_type: row.expenseType,
          source_file_name: row.sourceFileName,
          uploaded_by: row.uploadedBy,
          payer_user_id: row.payerUserId,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString()
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
            user_a_id: groupData.userAId,
            user_a_name: groupData.userA?.name || 'User A',
            user_b_id: groupData.userBId,
            user_b_name: groupData.userB?.name || null
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
    await prisma.transaction.updateMany({
      where: {
        id: transactionId,
        groupId
      },
      data: {
        expenseType: expenseType
      }
    })

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
    await prisma.transaction.deleteMany({
      where: {
        id: transactionId,
        groupId
      }
    })

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

  // Verify that the payer user belongs to the same group
  if (payerUserId) {
    const payerUser = await prisma.user.findFirst({
      where: {
        id: payerUserId,
        groupId
      }
    })
    if (!payerUser) {
      return { error: 'この支払い元を設定する権限がありません' }
    }
  }

  try {
    await prisma.transaction.updateMany({
      where: {
        id: transactionId,
        groupId
      },
      data: {
        payerUserId: payerUserId ?? null
      }
    })

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
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          userA: { select: { id: true, name: true } },
          userB: { select: { id: true, name: true } }
        }
      })

      if (!group) {
        return { error: 'グループが見つかりません' }
      }

      const year = parseInt(targetMonth.substring(0, 4), 10)
      const monthNum = parseInt(targetMonth.substring(5, 7), 10)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 1)

      const transactionsResult = await prisma.transaction.findMany({
        where: {
          groupId,
          date: {
            gte: startDate,
            lt: endDate
          }
        }
      })

      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const transactions = transactionsResult.map((row: TransactionRow) => ({
        id: row.id,
        group_id: row.groupId,
        user_id: row.userId,
        date: formatLocalDate(row.date),
        amount: row.amount.toNumber(),
        description: row.description,
        payer_type: row.payerType,
        expense_type: row.expenseType,
        source_file_name: row.sourceFileName,
        uploaded_by: row.uploadedBy,
        payer_user_id: row.payerUserId,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString()
      }))

      // Convert group to expected format
      const groupData = {
        id: group.id,
        name: group.name,
        ratio_a: group.ratioA,
        ratio_b: group.ratioB,
        user_a_id: group.userAId,
        user_b_id: group.userBId,
        created_at: group.createdAt.toISOString(),
        updated_at: group.updatedAt.toISOString()
      }

      const { calculateSettlement } = await import('@/lib/settlement')
      const settlement = calculateSettlement(transactions, groupData, targetMonth)

      return {
        success: true as const,
        settlement,
        userAName: group.userA?.name || 'User A',
        userBName: group.userB?.name || null
      }
    },
    ['settlement', groupId, targetMonth],
    {
      revalidate: CACHE_DURATIONS.settlement,
      tags: [CACHE_TAGS.settlement(groupId, targetMonth), CACHE_TAGS.settlementAll(groupId)]
    }
  )
}
