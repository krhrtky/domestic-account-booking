import { InvariantViolationError } from '../errors/DomainError'
import { ExpenseRatio } from '../value-objects'
import { Member } from './Member'
import { Expense } from './Expense'

/**
 * 世帯を表す集約ルート
 */
export class Household {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _ratio: ExpenseRatio,
    private readonly _memberA: Member,
    private _memberB: Member | null
  ) {
    // 不変条件: memberA と memberB は異なる
    if (_memberB && _memberA.id === _memberB.id) {
      throw new InvariantViolationError('メンバーAとメンバーBは異なるユーザーである必要があります')
    }
  }

  /**
   * 新規世帯を生成
   */
  static create(id: string, memberA: Member, name: string = 'Household'): Household {
    return new Household(id, name, ExpenseRatio.equal(), memberA, null)
  }

  /**
   * 永続化データから復元
   */
  static reconstruct(
    id: string,
    name: string,
    ratio: ExpenseRatio,
    memberA: Member,
    memberB: Member | null
  ): Household {
    return new Household(id, name, ratio, memberA, memberB)
  }

  /**
   * 負担割合を更新
   */
  updateRatio(ratio: ExpenseRatio): void {
    this._ratio = ratio
  }

  /**
   * メンバーBを設定
   */
  setMemberB(member: Member): void {
    if (this._memberA.id === member.id) {
      throw new InvariantViolationError('メンバーAとメンバーBは異なるユーザーである必要があります')
    }
    this._memberB = member
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
   * 負担割合を取得
   */
  get ratio(): ExpenseRatio {
    return this._ratio
  }

  /**
   * メンバーAを取得
   */
  get memberA(): Member {
    return this._memberA
  }

  /**
   * メンバーBを取得
   */
  get memberB(): Member | null {
    return this._memberB
  }

  /**
   * 2人揃っているか
   */
  isComplete(): boolean {
    return this._memberB !== null
  }

  /**
   * 指定したIDのメンバーを取得
   */
  getMemberById(memberId: string): Member | null {
    if (this._memberA.id === memberId) {
      return this._memberA
    }
    if (this._memberB?.id === memberId) {
      return this._memberB
    }
    return null
  }

  /**
   * 指定したIDがメンバーかどうか
   */
  isMember(memberId: string): boolean {
    return this.getMemberById(memberId) !== null
  }

  /**
   * 等価性の比較（IDベース）
   */
  equals(other: Household): boolean {
    return this._id === other._id
  }
}
