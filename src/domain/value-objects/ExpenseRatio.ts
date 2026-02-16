import { InvariantViolationError, InvalidArgumentError } from '../errors/DomainError'
import { Money } from './Money'

export type MemberRole = 'UserA' | 'UserB'

/**
 * 負担割合を表す値オブジェクト
 * 2人の負担割合の合計が100%であることを保証する
 */
export class ExpenseRatio {
  private constructor(
    private readonly _userA: number,
    private readonly _userB: number
  ) {
    if (_userA < 0 || _userA > 100) {
      throw new InvalidArgumentError('負担割合Aは0〜100の範囲で入力してください')
    }
    if (_userB < 0 || _userB > 100) {
      throw new InvalidArgumentError('負担割合Bは0〜100の範囲で入力してください')
    }
    if (_userA + _userB !== 100) {
      throw new InvariantViolationError('負担割合の合計は100%である必要があります')
    }
  }

  /**
   * 負担割合を生成
   */
  static of(userA: number, userB: number): ExpenseRatio {
    return new ExpenseRatio(userA, userB)
  }

  /**
   * 均等割り（50:50）を生成
   */
  static equal(): ExpenseRatio {
    return new ExpenseRatio(50, 50)
  }

  /**
   * ユーザーAの負担割合
   */
  get userA(): number {
    return this._userA
  }

  /**
   * ユーザーBの負担割合
   */
  get userB(): number {
    return this._userB
  }

  /**
   * 指定されたロールの期待負担額を計算
   */
  calculateExpectedAmount(total: Money, role: MemberRole): Money {
    const ratio = role === 'UserA' ? this._userA : this._userB
    return total.multiply(ratio / 100)
  }

  /**
   * 等価性の比較
   */
  equals(other: ExpenseRatio): boolean {
    return this._userA === other._userA && this._userB === other._userB
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `${this._userA}:${this._userB}`
  }
}
