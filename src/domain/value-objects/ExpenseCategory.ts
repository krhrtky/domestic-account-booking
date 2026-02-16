import { InvalidArgumentError } from '../errors/DomainError'

export type ExpenseCategoryType = 'Household' | 'Personal'

/**
 * 費用種別を表す値オブジェクト
 */
export class ExpenseCategory {
  private constructor(private readonly _value: ExpenseCategoryType) {}

  /**
   * 共有費用を生成
   */
  static household(): ExpenseCategory {
    return new ExpenseCategory('Household')
  }

  /**
   * 個人支出を生成
   */
  static personal(): ExpenseCategory {
    return new ExpenseCategory('Personal')
  }

  /**
   * 文字列から生成
   */
  static fromString(value: string): ExpenseCategory {
    if (value === 'Household' || value === 'Personal') {
      return new ExpenseCategory(value)
    }
    throw new InvalidArgumentError(`無効な費用種別: ${value}`)
  }

  /**
   * 共有費用かどうか
   */
  isHousehold(): boolean {
    return this._value === 'Household'
  }

  /**
   * 個人支出かどうか
   */
  isPersonal(): boolean {
    return this._value === 'Personal'
  }

  /**
   * 値を取得
   */
  get value(): ExpenseCategoryType {
    return this._value
  }

  /**
   * 等価性の比較
   */
  equals(other: ExpenseCategory): boolean {
    return this._value === other._value
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value === 'Household' ? '共有費用' : '個人支出'
  }
}
