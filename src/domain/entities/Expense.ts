import { ExpenseCategory, Money, Payer } from '../value-objects'

export interface DataSource {
  fileName: string
  uploadedBy: string
}

/**
 * 支出を表すエンティティ
 */
export class Expense {
  private constructor(
    private readonly _id: string,
    private readonly _householdId: string,
    private readonly _date: string, // YYYY-MM-DD
    private readonly _amount: Money,
    private readonly _description: string,
    private _category: ExpenseCategory,
    private _payer: Payer,
    private readonly _recordedBy: string,
    private readonly _source: DataSource | null
  ) {}

  /**
   * 新規支出を生成
   */
  static create(
    id: string,
    householdId: string,
    date: string,
    amount: Money,
    description: string,
    category: ExpenseCategory,
    payer: Payer,
    recordedBy: string,
    source: DataSource | null = null
  ): Expense {
    return new Expense(
      id,
      householdId,
      date,
      amount,
      description,
      category,
      payer,
      recordedBy,
      source
    )
  }

  /**
   * 永続化データから復元
   */
  static reconstruct(
    id: string,
    householdId: string,
    date: string,
    amount: Money,
    description: string,
    category: ExpenseCategory,
    payer: Payer,
    recordedBy: string,
    source: DataSource | null
  ): Expense {
    return new Expense(
      id,
      householdId,
      date,
      amount,
      description,
      category,
      payer,
      recordedBy,
      source
    )
  }

  /**
   * 費用種別を変更
   */
  changeCategory(category: ExpenseCategory): void {
    this._category = category
  }

  /**
   * 支払者を変更
   */
  changePayer(payer: Payer): void {
    this._payer = payer
  }

  /**
   * IDを取得
   */
  get id(): string {
    return this._id
  }

  /**
   * 世帯IDを取得
   */
  get householdId(): string {
    return this._householdId
  }

  /**
   * 日付を取得
   */
  get date(): string {
    return this._date
  }

  /**
   * 金額を取得
   */
  get amount(): Money {
    return this._amount
  }

  /**
   * 説明を取得
   */
  get description(): string {
    return this._description
  }

  /**
   * 費用種別を取得
   */
  get category(): ExpenseCategory {
    return this._category
  }

  /**
   * 支払者を取得
   */
  get payer(): Payer {
    return this._payer
  }

  /**
   * 記録者IDを取得
   */
  get recordedBy(): string {
    return this._recordedBy
  }

  /**
   * データソースを取得
   */
  get source(): DataSource | null {
    return this._source
  }

  /**
   * 共有費用かどうか
   */
  get isHousehold(): boolean {
    return this._category.isHousehold()
  }

  /**
   * 等価性の比較（IDベース）
   */
  equals(other: Expense): boolean {
    return this._id === other._id
  }
}
