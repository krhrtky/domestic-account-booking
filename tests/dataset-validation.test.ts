import { describe, it, expect } from 'vitest'
import { SETTLEMENT_DATASET } from './fixtures/settlement-dataset'
import { DatasetSchema } from './fixtures/dataset-schema'

describe('L-TA-005: 評価データセットの要件検証', () => {
  describe('DS-001: 全カテゴリの存在', () => {
    it('精算データセットに全カテゴリが存在する', () => {
      expect(SETTLEMENT_DATASET).toHaveProperty('typical')
      expect(SETTLEMENT_DATASET).toHaveProperty('boundary')
      expect(SETTLEMENT_DATASET).toHaveProperty('incident')
      expect(SETTLEMENT_DATASET).toHaveProperty('gray')
      expect(SETTLEMENT_DATASET).toHaveProperty('attack')
    })
  })

  describe('DS-002: 最低ケース数', () => {
    it('各カテゴリに最低3ケース以上（incident/grayは1以上）', () => {
      expect(SETTLEMENT_DATASET.typical.length).toBeGreaterThanOrEqual(3)
      expect(SETTLEMENT_DATASET.boundary.length).toBeGreaterThanOrEqual(3)
      expect(SETTLEMENT_DATASET.incident.length).toBeGreaterThanOrEqual(1)
      expect(SETTLEMENT_DATASET.gray.length).toBeGreaterThanOrEqual(1)
      expect(SETTLEMENT_DATASET.attack.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('DS-003: ユニークID', () => {
    it('全ケースのIDが重複していない', () => {
      const allCases = [
        ...SETTLEMENT_DATASET.typical,
        ...SETTLEMENT_DATASET.boundary,
        ...SETTLEMENT_DATASET.incident,
        ...SETTLEMENT_DATASET.gray,
        ...SETTLEMENT_DATASET.attack,
      ]

      const ids = allCases.map((c) => c.id)
      const uniqueIds = [...new Set(ids)]

      expect(ids.length).toBe(uniqueIds.length)
    })
  })

  describe('DS-004: 期待結果の存在', () => {
    it('全ケースにexpectedが定義されている', () => {
      const allCases = [
        ...SETTLEMENT_DATASET.typical,
        ...SETTLEMENT_DATASET.boundary,
        ...SETTLEMENT_DATASET.incident,
        ...SETTLEMENT_DATASET.gray,
        ...SETTLEMENT_DATASET.attack,
      ]

      allCases.forEach((testCase) => {
        expect(testCase).toHaveProperty('expected')
        expect(testCase.expected).not.toBeUndefined()
      })
    })
  })

  describe('DS-005: 事故ケースの参照', () => {
    it('事故ケースにreferenceが記載されている', () => {
      SETTLEMENT_DATASET.incident.forEach((testCase) => {
        expect(testCase).toHaveProperty('reference')
        expect((testCase as any).reference).toMatch(/^(Issue|PR) #\d+$/)
      })
    })
  })

  describe('DS-006: グレーケースのnote', () => {
    it('グレーケースにnoteが記載されている', () => {
      SETTLEMENT_DATASET.gray.forEach((testCase) => {
        expect(testCase).toHaveProperty('note')
        expect((testCase as any).note.length).toBeGreaterThanOrEqual(10)
      })
    })
  })

  describe('DS-007: スキーマ検証', () => {
    it('精算データセットがスキーマに適合する', () => {
      const result = DatasetSchema.safeParse(SETTLEMENT_DATASET)
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors)
      }
      expect(result.success).toBe(true)
    })
  })

  describe('DS-008: ルール整合性', () => {
    it('精算計算の期待結果がL-BR-001のロジックと一致する', () => {
      SETTLEMENT_DATASET.typical.forEach((testCase) => {
        if ('error' in testCase.expected) return

        const { paidByA, paidByB, ratioA } = testCase.input as {
          paidByA: number
          paidByB: number
          ratioA: number
        }

        const expectedBalanceA = paidByA - ((paidByA + paidByB) * ratioA) / 100
        const roundedExpected = Math.round(expectedBalanceA)

        expect((testCase.expected as any).balanceA).toBe(roundedExpected)
      })
    })
  })
})
