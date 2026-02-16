import { MemberRole } from '../value-objects'

/**
 * 世帯メンバーを表すエンティティ
 */
export class Member {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private readonly _email: string,
    private _role: MemberRole
  ) {}

  /**
   * 新規メンバーを生成
   */
  static create(id: string, name: string, email: string, role: MemberRole): Member {
    return new Member(id, name, email, role)
  }

  /**
   * 永続化データから復元
   */
  static reconstruct(id: string, name: string, email: string, role: MemberRole): Member {
    return new Member(id, name, email, role)
  }

  /**
   * IDを取得
   */
  get id(): string {
    return this._id
  }

  /**
   * 名前を取得
   */
  get name(): string {
    return this._name
  }

  /**
   * メールアドレスを取得
   */
  get email(): string {
    return this._email
  }

  /**
   * ロールを取得
   */
  get role(): MemberRole {
    return this._role
  }

  /**
   * UserA かどうか
   */
  isUserA(): boolean {
    return this._role === 'UserA'
  }

  /**
   * UserB かどうか
   */
  isUserB(): boolean {
    return this._role === 'UserB'
  }

  /**
   * 等価性の比較（IDベース）
   */
  equals(other: Member): boolean {
    return this._id === other._id
  }
}
