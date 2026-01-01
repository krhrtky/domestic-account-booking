import { and, eq, like, sql, desc, count } from 'drizzle-orm'
import { db, type Database } from '@/db/client'
import * as schema from '@/db/schema'
import { Expense, type DataSource } from '@/domain/entities'
import type { IExpenseRepository } from '@/domain/repositories'
import { ExpenseCategory, Money, Payer, YearMonth } from '@/domain/value-objects'

/**
 * Drizzle ORMを使用した支出リポジトリ実装
 */
export class DrizzleExpenseRepository implements IExpenseRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: string): Promise<Expense | null> {
    const result = await this.database.query.transactions.findFirst({
      where: eq(schema.transactions.id, id),
    })

    if (!result) return null

    return this.toDomain(result)
  }

  async findByHouseholdAndMonth(
    householdId: string,
    month: YearMonth
  ): Promise<Expense[]> {
    const results = await this.database.query.transactions.findMany({
      where: and(
        eq(schema.transactions.groupId, householdId),
        like(schema.transactions.date, `${month.toString()}%`)
      ),
      orderBy: [desc(schema.transactions.date)],
    })

    return results.map((row) => this.toDomain(row))
  }

  async findByHouseholdId(
    householdId: string,
    options: {
      month?: YearMonth
      page?: number
      pageSize?: number
    } = {}
  ): Promise<{ expenses: Expense[]; totalCount: number }> {
    const { month, page = 1, pageSize = 50 } = options

    const conditions = [eq(schema.transactions.groupId, householdId)]
    if (month) {
      conditions.push(like(schema.transactions.date, `${month.toString()}%`))
    }

    const whereClause = and(...conditions)

    // 総件数を取得
    const [countResult] = await this.database
      .select({ count: count() })
      .from(schema.transactions)
      .where(whereClause)

    const totalCount = countResult?.count ?? 0

    // ページネーションを適用してデータを取得
    const results = await this.database.query.transactions.findMany({
      where: whereClause,
      orderBy: [desc(schema.transactions.date)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    return {
      expenses: results.map((row) => this.toDomain(row)),
      totalCount,
    }
  }

  async save(expense: Expense): Promise<void> {
    const existing = await this.findById(expense.id)

    if (existing) {
      await this.database
        .update(schema.transactions)
        .set({
          expenseType: expense.category.value,
          actualPayerType: expense.payer.type,
          actualPayerUserId: expense.payer.userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.transactions.id, expense.id))
    } else {
      await this.database.insert(schema.transactions).values({
        id: expense.id,
        groupId: expense.householdId,
        userId: expense.recordedBy,
        date: expense.date,
        amount: expense.amount.value.toString(),
        description: expense.description,
        payerType: expense.payer.type,
        payerUserId: expense.payer.userId,
        actualPayerType: expense.payer.type,
        actualPayerUserId: expense.payer.userId,
        expenseType: expense.category.value,
        sourceFileName: expense.source?.fileName,
        uploadedBy: expense.source?.uploadedBy,
      })
    }
  }

  async saveBatch(expenses: Expense[]): Promise<void> {
    if (expenses.length === 0) return

    const values = expenses.map((expense) => ({
      id: expense.id,
      groupId: expense.householdId,
      userId: expense.recordedBy,
      date: expense.date,
      amount: expense.amount.value.toString(),
      description: expense.description,
      payerType: expense.payer.type,
      payerUserId: expense.payer.userId,
      actualPayerType: expense.payer.type,
      actualPayerUserId: expense.payer.userId,
      expenseType: expense.category.value,
      sourceFileName: expense.source?.fileName,
      uploadedBy: expense.source?.uploadedBy,
    }))

    await this.database.insert(schema.transactions).values(values)
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(schema.transactions)
      .where(eq(schema.transactions.id, id))
  }

  private toDomain(row: TransactionRow): Expense {
    const source: DataSource | null =
      row.sourceFileName && row.uploadedBy
        ? { fileName: row.sourceFileName, uploadedBy: row.uploadedBy }
        : null

    return Expense.reconstruct(
      row.id,
      row.groupId,
      row.date,
      Money.of(row.amount),
      row.description,
      ExpenseCategory.fromString(row.expenseType),
      Payer.reconstruct(row.actualPayerUserId, row.actualPayerType as 'UserA' | 'UserB'),
      row.userId,
      source
    )
  }
}

type TransactionRow = {
  id: string
  groupId: string
  userId: string
  date: string
  amount: string
  description: string
  payerType: string
  payerUserId: string | null
  actualPayerType: string
  actualPayerUserId: string | null
  expenseType: string
  sourceFileName: string | null
  uploadedBy: string | null
}

/**
 * シングルトンインスタンス
 */
export const expenseRepository = new DrizzleExpenseRepository()
