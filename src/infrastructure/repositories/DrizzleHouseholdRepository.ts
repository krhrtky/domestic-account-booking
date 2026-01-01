import { eq } from 'drizzle-orm'
import { db, type Database } from '@/db/client'
import * as schema from '@/db/schema'
import { Household, Member } from '@/domain/entities'
import type { IHouseholdRepository } from '@/domain/repositories'
import { ExpenseRatio } from '@/domain/value-objects'

/**
 * Drizzle ORMを使用した世帯リポジトリ実装
 */
export class DrizzleHouseholdRepository implements IHouseholdRepository {
  constructor(private readonly database: Database = db) {}

  async findById(id: string): Promise<Household | null> {
    const result = await this.database.query.groups.findFirst({
      where: eq(schema.groups.id, id),
      with: {
        userA: true,
        userB: true,
      },
    })

    if (!result) return null

    return this.toDomain(result)
  }

  async findByMemberId(memberId: string): Promise<Household | null> {
    // まずユーザーのgroupIdを取得
    const user = await this.database.query.users.findFirst({
      where: eq(schema.users.id, memberId),
    })

    if (!user?.groupId) return null

    return this.findById(user.groupId)
  }

  async save(household: Household): Promise<void> {
    await this.database
      .update(schema.groups)
      .set({
        name: household.name,
        ratioA: household.ratio.userA,
        ratioB: household.ratio.userB,
        userBId: household.memberB?.id ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.groups.id, household.id))
  }

  private toDomain(row: GroupWithMembers): Household {
    const memberA = Member.reconstruct(
      row.userA.id,
      row.userA.name,
      row.userA.email,
      'UserA'
    )

    const memberB = row.userB
      ? Member.reconstruct(
          row.userB.id,
          row.userB.name,
          row.userB.email,
          'UserB'
        )
      : null

    return Household.reconstruct(
      row.id,
      row.name,
      ExpenseRatio.of(row.ratioA, row.ratioB),
      memberA,
      memberB
    )
  }
}

type GroupWithMembers = {
  id: string
  name: string
  ratioA: number
  ratioB: number
  userAId: string
  userBId: string | null
  userA: {
    id: string
    name: string
    email: string
  }
  userB: {
    id: string
    name: string
    email: string
  } | null
}

/**
 * シングルトンインスタンス
 */
export const householdRepository = new DrizzleHouseholdRepository()
