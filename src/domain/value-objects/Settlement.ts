import { ExpenseRatio } from './ExpenseRatio'
import { Money } from './Money'
import { YearMonth } from './YearMonth'

export interface PaymentInstruction {
  from: 'A' | 'B'
  to: 'A' | 'B'
  amount: Money
}

/**
 * 精算結果を表す値オブジェクト
 */
export class Settlement {
  private constructor(
    private readonly _month: YearMonth,
    private readonly _totalHousehold: Money,
    private readonly _paidByA: Money,
    private readonly _paidByB: Money,
    private readonly _balanceA: number, // 符号付き（正=受取、負=支払い）
    private readonly _ratio: ExpenseRatio
  ) {}

  /**
   * 精算結果を生成
   */
  static create(
    month: YearMonth,
    total: Money,
    paidByA: Money,
    paidByB: Money,
    balanceA: number,
    ratio: ExpenseRatio
  ): Settlement {
    return new Settlement(month, total, paidByA, paidByB, balanceA, ratio)
  }

  /**
   * 精算の支払指示を取得
   * @returns 支払指示。精算不要の場合は null
   */
  getPaymentInstruction(): PaymentInstruction | null {
    if (this._balanceA > 0) {
      // Aが多く払った → BがAに支払う
      return { from: 'B', to: 'A', amount: Money.of(this._balanceA) }
    } else if (this._balanceA < 0) {
      // Aが少なく払った → AがBに支払う
      return { from: 'A', to: 'B', amount: Money.of(-this._balanceA) }
    }
    return null // 精算不要
  }

  /**
   * 対象月を取得
   */
  get month(): YearMonth {
    return this._month
  }

  /**
   * 共有費用の合計を取得
   */
  get totalHousehold(): Money {
    return this._totalHousehold
  }

  /**
   * ユーザーAの支払額を取得
   */
  get paidByA(): Money {
    return this._paidByA
  }

  /**
   * ユーザーBの支払額を取得
   */
  get paidByB(): Money {
    return this._paidByB
  }

  /**
   * ユーザーAの精算額（符号付き）を取得
   */
  get balanceA(): number {
    return this._balanceA
  }

  /**
   * 負担割合を取得
   */
  get ratio(): ExpenseRatio {
    return this._ratio
  }

  /**
   * DTOに変換（API レスポンス用）
   */
  toDTO(): {
    month: string
    total_household: number
    paid_by_a_household: number
    paid_by_b_household: number
    balance_a: number
    ratio_a: number
    ratio_b: number
  } {
    return {
      month: this._month.toString(),
      total_household: this._totalHousehold.value,
      paid_by_a_household: this._paidByA.value,
      paid_by_b_household: this._paidByB.value,
      balance_a: this._balanceA,
      ratio_a: this._ratio.userA,
      ratio_b: this._ratio.userB,
    }
  }
}
