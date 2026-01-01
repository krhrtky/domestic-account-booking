import { MemberRole } from './ExpenseRatio'

export type PayerType = 'UserA' | 'UserB'

/**
 * 支払者を表す値オブジェクト
 * userId と type の2段階判定をカプセル化する
 */
export class Payer {
  private constructor(
    private readonly _userId: string | null,
    private readonly _type: PayerType
  ) {}

  /**
   * ユーザーIDとタイプから生成
   */
  static fromUser(userId: string, type: PayerType): Payer {
    return new Payer(userId, type)
  }

  /**
   * タイプのみから生成（ユーザーIDが不明な場合）
   */
  static fromType(type: PayerType): Payer {
    return new Payer(null, type)
  }

  /**
   * 既存データから復元
   */
  static reconstruct(userId: string | null, type: PayerType): Payer {
    return new Payer(userId, type)
  }

  /**
   * 支払者を特定する
   * userId があればそれを使用、なければ type で判定
   */
  matchesMember(memberId: string, memberRole: MemberRole): boolean {
    if (this._userId) {
      return this._userId === memberId
    }
    return this._type === memberRole
  }

  /**
   * 支払者タイプを取得
   */
  get type(): PayerType {
    return this._type
  }

  /**
   * ユーザーIDを取得
   */
  get userId(): string | null {
    return this._userId
  }

  /**
   * ユーザーIDが設定されているか
   */
  hasUserId(): boolean {
    return this._userId !== null
  }

  /**
   * 等価性の比較
   */
  equals(other: Payer): boolean {
    return this._userId === other._userId && this._type === other._type
  }

  /**
   * 文字列表現
   */
  toString(): string {
    if (this._userId) {
      return `${this._type}(${this._userId})`
    }
    return this._type
  }
}
