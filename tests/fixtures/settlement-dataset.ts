export const SETTLEMENT_DATASET = {
  typical: [
    {
      id: 'TYP-001',
      name: '基本的な50:50精算',
      input: { paidByA: 10000, paidByB: 0, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 5000, direction: 'B_PAYS_A' },
    },
    {
      id: 'TYP-002',
      name: '60:40の負担割合',
      input: { paidByA: 10000, paidByB: 0, ratioA: 60, ratioB: 40 },
      expected: { balanceA: 4000, direction: 'B_PAYS_A' },
    },
    {
      id: 'TYP-003',
      name: '両者が支払い済み',
      input: { paidByA: 8000, paidByB: 2000, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 3000, direction: 'B_PAYS_A' },
    },
  ],

  boundary: [
    {
      id: 'BND-001',
      name: '支払額が0',
      input: { paidByA: 0, paidByB: 0, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 0, direction: 'SETTLED' },
    },
    {
      id: 'BND-002',
      name: '端数が発生（四捨五入）',
      input: { paidByA: 1000, paidByB: 0, ratioA: 33, ratioB: 67 },
      expected: { balanceA: 670, direction: 'B_PAYS_A' },
    },
    {
      id: 'BND-003',
      name: '最大金額',
      input: { paidByA: 999999999, paidByB: 0, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 500000000, direction: 'B_PAYS_A' },
    },
  ],

  incident: [
    {
      id: 'INC-001',
      name: '負担割合合計が100%超（過去バグ想定）',
      input: { paidByA: 10000, paidByB: 0, ratioA: 60, ratioB: 50 },
      expected: { error: '負担割合の合計は100%である必要があります' },
      reference: 'Issue #1',
    },
  ],

  gray: [
    {
      id: 'GRY-001',
      name: '同額支払いの場合',
      input: { paidByA: 5000, paidByB: 5000, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 0, direction: 'SETTLED' },
      note: '同額支払い時はバランスがゼロになる',
    },
  ],

  attack: [
    {
      id: 'ATK-001',
      name: '負の金額インジェクション',
      input: { paidByA: -10000, paidByB: 0, ratioA: 50, ratioB: 50 },
      expected: { error: '金額は0以上である必要があります' },
    },
    {
      id: 'ATK-002',
      name: '極端に大きな割合',
      input: { paidByA: 10000, paidByB: 0, ratioA: 1000000, ratioB: 50 },
      expected: { error: '負担割合の合計は100%である必要があります' },
    },
    {
      id: 'ATK-003',
      name: '割合範囲外（負の値）',
      input: { paidByA: 10000, paidByB: 0, ratioA: -50, ratioB: 150 },
      expected: { error: '負担割合Aは0〜100の範囲で入力してください' },
    },
  ],
}
