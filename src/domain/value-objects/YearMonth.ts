import { InvalidArgumentError } from '../errors/DomainError'

/**
 * 年月を表す値オブジェクト
 */
export class YearMonth {
  private static readonly FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/

  private constructor(
    private readonly _year: number,
    private readonly _month: number
  ) {}

  /**
   * 年と月から生成
   */
  static of(year: number, month: number): YearMonth {
    if (month < 1 || month > 12) {
      throw new InvalidArgumentError('月は1〜12の範囲で入力してください')
    }
    if (year < 1900 || year > 2100) {
      throw new InvalidArgumentError('年は1900〜2100の範囲で入力してください')
    }
    return new YearMonth(year, month)
  }

  /**
   * YYYY-MM 形式の文字列から生成
   */
  static parse(value: string): YearMonth {
    if (!YearMonth.FORMAT.test(value)) {
      throw new InvalidArgumentError(
        '月の形式が正しくありません。YYYY-MM形式で入力してください（例: 2025-01）'
      )
    }
    const [year, month] = value.split('-').map(Number)
    return new YearMonth(year, month)
  }

  /**
   * 現在の年月を取得
   */
  static now(): YearMonth {
    const now = new Date()
    return new YearMonth(now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * 年を取得
   */
  get year(): number {
    return this._year
  }

  /**
   * 月を取得
   */
  get month(): number {
    return this._month
  }

  /**
   * 指定した日付がこの年月に含まれるかどうか
   */
  contains(date: Date | string): boolean {
    const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10)
    return dateStr.startsWith(this.toString())
  }

  /**
   * YYYY-MM 形式の文字列に変換
   */
  toString(): string {
    return `${this._year}-${String(this._month).padStart(2, '0')}`
  }

  /**
   * 等価性の比較
   */
  equals(other: YearMonth): boolean {
    return this._year === other._year && this._month === other._month
  }

  /**
   * 次の月を取得
   */
  next(): YearMonth {
    if (this._month === 12) {
      return new YearMonth(this._year + 1, 1)
    }
    return new YearMonth(this._year, this._month + 1)
  }

  /**
   * 前の月を取得
   */
  previous(): YearMonth {
    if (this._month === 1) {
      return new YearMonth(this._year - 1, 12)
    }
    return new YearMonth(this._year, this._month - 1)
  }
}
