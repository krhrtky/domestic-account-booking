import { Household } from '../entities'

/**
 * 世帯リポジトリのインターフェース
 */
export interface IHouseholdRepository {
  /**
   * IDで世帯を取得
   */
  findById(id: string): Promise<Household | null>

  /**
   * メンバーIDで世帯を取得
   */
  findByMemberId(memberId: string): Promise<Household | null>

  /**
   * 世帯を保存（作成または更新）
   */
  save(household: Household): Promise<void>
}
