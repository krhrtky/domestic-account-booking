import { Expense } from '../entities'
import { YearMonth } from '../value-objects'

/**
 * 支出リポジトリのインターフェース
 */
export interface IExpenseRepository {
  /**
   * IDで支出を取得
   */
  findById(id: string): Promise<Expense | null>

  /**
   * 世帯IDと年月で支出を取得
   */
  findByHouseholdAndMonth(householdId: string, month: YearMonth): Promise<Expense[]>

  /**
   * 世帯IDで支出を取得（ページネーション対応）
   */
  findByHouseholdId(
    householdId: string,
    options?: {
      month?: YearMonth
      page?: number
      pageSize?: number
    }
  ): Promise<{ expenses: Expense[]; totalCount: number }>

  /**
   * 支出を保存（作成または更新）
   */
  save(expense: Expense): Promise<void>

  /**
   * 複数の支出を一括保存
   */
  saveBatch(expenses: Expense[]): Promise<void>

  /**
   * 支出を削除
   */
  delete(id: string): Promise<void>
}
