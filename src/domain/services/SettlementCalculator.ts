import { Expense } from '../entities'
import { Household } from '../entities'
import { Money, Settlement, YearMonth } from '../value-objects'

/**
 * 精算計算を行うドメインサービス
 */
export class SettlementCalculator {
  /**
   * 精算を計算する
   * @param expenses 対象の支出リスト
   * @param household 世帯情報
   * @param targetMonth 対象月
   * @returns 精算結果
   */
  calculate(
    expenses: Expense[],
    household: Household,
    targetMonth: YearMonth
  ): Settlement {
    // 1. 対象月の共有費用をフィルタ
    const householdExpenses = expenses.filter(
      (e) => e.isHousehold && targetMonth.contains(e.date)
    )

    // 2. ユーザーAの支払額を集計
    const paidByA = householdExpenses
      .filter((e) => e.payer.matchesMember(household.memberA.id, 'UserA'))
      .reduce((sum, e) => sum.add(e.amount), Money.zero())

    // 3. ユーザーBの支払額を集計
    const paidByB = householdExpenses
      .filter(
        (e) =>
          household.memberB &&
          e.payer.matchesMember(household.memberB.id, 'UserB')
      )
      .reduce((sum, e) => sum.add(e.amount), Money.zero())

    // 4. 合計を算出
    const total = paidByA.add(paidByB)

    // 5. 精算額を計算
    const expectedA = household.ratio.calculateExpectedAmount(total, 'UserA')
    const balanceA = Math.round(paidByA.value - expectedA.value)

    return Settlement.create(
      targetMonth,
      total,
      paidByA,
      paidByB,
      balanceA,
      household.ratio
    )
  }
}

/**
 * シングルトンインスタンス
 */
export const settlementCalculator = new SettlementCalculator()
