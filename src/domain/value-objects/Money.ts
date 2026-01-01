import { InvalidArgumentError } from '../errors/DomainError'

/**
 * 金額を表す値オブジェクト
 * 不変性を保証し、金額に関する操作をカプセル化する
 */
export class Money {
  private constructor(private readonly _amount: number) {
    if (!Number.isFinite(_amount)) {
      throw new InvalidArgumentError('金額は有効な数値である必要があります')
    }
    if (_amount < 0) {
      throw new InvalidArgumentError('金額は0以上である必要があります')
    }
  }

  /**
   * 数値または文字列から Money を生成
   */
  static of(amount: number | string): Money {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    if (Number.isNaN(value)) {
      throw new InvalidArgumentError('金額を数値に変換できません')
    }
    return new Money(value)
  }

  /**
   * 0円を生成
   */
  static zero(): Money {
    return new Money(0)
  }

  /**
   * 加算
   */
  add(other: Money): Money {
    return new Money(this._amount + other._amount)
  }

  /**
   * 減算（結果が負になる場合は負の Money を返す）
   */
  subtract(other: Money): Money {
    return new Money(Math.abs(this._amount - other._amount))
  }

  /**
   * 減算（符号付き、精算計算用）
   */
  subtractSigned(other: Money): number {
    return this._amount - other._amount
  }

  /**
   * 乗算
   */
  multiply(factor: number): Money {
    return new Money(this._amount * factor)
  }

  /**
   * 整数に丸め
   */
  round(): Money {
    return new Money(Math.round(this._amount))
  }

  /**
   * 金額の値を取得
   */
  get value(): number {
    return this._amount
  }

  /**
   * 等価性の比較
   */
  equals(other: Money): boolean {
    return this._amount === other._amount
  }

  /**
   * 0かどうか
   */
  isZero(): boolean {
    return this._amount === 0
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `¥${this._amount.toLocaleString()}`
  }
}
