# 07. テスト・監査ルール (Test & Audit Laws)

## 目的

検証の網羅性・追跡可能性を確保し、ルール準拠を客観的に証明できる状態を維持する。

---

## L-TA-001: 評価データセット

### データセット分類

| 分類 | 定義 | 目的 |
|------|------|------|
| **典型ケース** | 正常な利用シナリオ | 基本機能の動作確認 |
| **境界ケース** | 境界値・限界値 | エッジケースの検証 |
| **事故ケース** | 過去のバグ・障害の再現 | リグレッション防止 |
| **グレーケース** | 判断が分かれるシナリオ | ルール明確化の材料 |
| **攻撃ケース** | セキュリティ攻撃シナリオ | 脆弱性検証 |

### 精算ロジック評価データセット

```typescript
// tests/fixtures/settlement-dataset.ts

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
      name: '負担割合合計が100%超（過去バグ）',
      input: { paidByA: 10000, paidByB: 0, ratioA: 60, ratioB: 50 },
      expected: { error: '負担割合の合計は100%である必要があります' },
      reference: 'Issue #XXX',
    },
  ],

  gray: [
    {
      id: 'GRY-001',
      name: '共通口座からの支払いがある場合',
      input: { paidByA: 5000, paidByB: 5000, paidByCommon: 10000, ratioA: 50, ratioB: 50 },
      expected: { balanceA: 0, direction: 'SETTLED' },
      note: 'Common口座は計算から除外される仕様',
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
  ],
};
```

### CSV取り込み評価データセット

```typescript
// tests/fixtures/csv-dataset.ts

export const CSV_DATASET = {
  typical: [
    {
      id: 'CSV-TYP-001',
      name: '標準的なCSV',
      input: `日付,金額,摘要\n2025-01-15,1000,スーパー`,
      expected: { rowCount: 1, errors: [] },
    },
  ],

  boundary: [
    {
      id: 'CSV-BND-001',
      name: '空のCSV',
      input: `日付,金額,摘要\n`,
      expected: { rowCount: 0, warnings: ['データ行がありません'] },
    },
    {
      id: 'CSV-BND-002',
      name: '10000行のCSV',
      input: generateLargeCSV(10000),
      expected: { rowCount: 10000, errors: [] },
    },
  ],

  incident: [
    {
      id: 'CSV-INC-001',
      name: '文字化けCSV（過去バグ）',
      input: readFixture('shift-jis.csv'),
      expected: { error: 'UTF-8形式で保存されたファイルをご利用ください' },
    },
  ],

  attack: [
    {
      id: 'CSV-ATK-001',
      name: 'CSVインジェクション',
      input: `日付,金額,摘要\n2025-01-15,1000,=CMD|calc|`,
      expected: { sanitized: true, descriptionPrefix: "'" },
    },
    {
      id: 'CSV-ATK-002',
      name: 'サイズ超過',
      input: generateLargeCSV(100000),
      expected: { error: '行数が上限(10,000行)を超えています' },
    },
  ],
};
```

---

## L-TA-002: 採点ルーブリック

### 合格基準

| ルール | 合格条件 | 不合格条件 |
|--------|---------|-----------|
| L-CX-001 | 全テストケースで期待値と一致 | 1件でも不一致 |
| L-CX-002 | 全フォーマットが仕様通り | フォーマット違反あり |
| L-SC-001 | 認証バイパス成功率0% | 1件でもバイパス成功 |
| L-SC-002 | インジェクション成功率0% | 1件でも成功 |

### テストカバレッジ基準

| 対象 | 最低カバレッジ | 目標カバレッジ |
|------|--------------|--------------|
| src/lib/settlement.ts | 100% | 100% |
| src/lib/csv-parser.ts | 90% | 100% |
| src/components/** | 70% | 85% |
| 全体 | 80% | 90% |

### 採点シート

```typescript
// scripts/generate-scorecard.ts

interface Scorecard {
  ruleId: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  score: number; // 0-100
  status: 'PASS' | 'FAIL' | 'WARN';
}

function evaluateRule(ruleId: string, testResults: TestResult[]): Scorecard {
  const relevantTests = testResults.filter(t => t.ruleId === ruleId);
  const passed = relevantTests.filter(t => t.status === 'passed').length;
  const failed = relevantTests.filter(t => t.status === 'failed').length;

  const score = (passed / relevantTests.length) * 100;

  return {
    ruleId,
    totalCases: relevantTests.length,
    passedCases: passed,
    failedCases: failed,
    score,
    status: score === 100 ? 'PASS' : score >= 90 ? 'WARN' : 'FAIL',
  };
}
```

---

## L-TA-003: レッドチームシナリオ

### 認証・認可攻撃

```typescript
// tests/redteam/auth-attacks.ts

export const AUTH_ATTACK_SCENARIOS = [
  {
    id: 'RT-AUTH-001',
    name: 'セッショントークン推測',
    attack: async () => {
      for (let i = 0; i < 1000; i++) {
        const guessedToken = generateSequentialToken(i);
        const response = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${guessedToken}` },
        });
        if (response.status !== 401) return { success: true, token: guessedToken };
      }
      return { success: false };
    },
    expectedResult: { success: false },
  },
  {
    id: 'RT-AUTH-002',
    name: 'IDOR（他ユーザーリソースアクセス）',
    attack: async (attackerSession: Session) => {
      const victimTransactionId = 'known-victim-transaction-id';
      const response = await fetch(`/api/transactions/${victimTransactionId}`, {
        headers: { Authorization: `Bearer ${attackerSession.token}` },
      });
      return { success: response.status === 200 };
    },
    expectedResult: { success: false },
  },
  {
    id: 'RT-AUTH-003',
    name: 'JWTなりすまし',
    attack: async () => {
      const forgedToken = createForgedJWT({ userId: 'victim-id' });
      const response = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      return { success: response.status === 200 };
    },
    expectedResult: { success: false },
  },
];
```

### インジェクション攻撃

```typescript
// tests/redteam/injection-attacks.ts

export const INJECTION_ATTACK_SCENARIOS = [
  {
    id: 'RT-INJ-001',
    name: 'SQLインジェクション（検索）',
    attack: async (session: Session) => {
      const maliciousQuery = "'; DROP TABLE transactions; --";
      const response = await fetch(`/api/transactions?search=${encodeURIComponent(maliciousQuery)}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      // テーブルが存在するか確認
      const checkResponse = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      return { success: checkResponse.status !== 200 };
    },
    expectedResult: { success: false },
  },
  {
    id: 'RT-INJ-002',
    name: 'XSS（取引摘要）',
    attack: async (session: Session) => {
      const xssPayload = '<script>alert(document.cookie)</script>';
      await createTransaction(session, { description: xssPayload });

      const html = await fetchTransactionListHTML(session);
      return { success: html.includes('<script>') };
    },
    expectedResult: { success: false },
  },
  {
    id: 'RT-INJ-003',
    name: 'CSVインジェクション',
    attack: async (session: Session) => {
      const csvPayload = `日付,金額,摘要\n2025-01-15,1000,=HYPERLINK("http://evil.com")`;
      const result = await uploadCSV(session, csvPayload);
      const transaction = await getTransaction(session, result.transactionIds[0]);
      return { success: transaction.description.startsWith('=') };
    },
    expectedResult: { success: false },
  },
];
```

### 情報漏洩攻撃

```typescript
// tests/redteam/data-leak-attacks.ts

export const DATA_LEAK_SCENARIOS = [
  {
    id: 'RT-LEAK-001',
    name: 'エラーメッセージからの情報漏洩',
    attack: async () => {
      const response = await fetch('/api/transactions/invalid-id');
      const body = await response.json();
      const leakedInfo = [
        body.stack,
        body.query,
        body.dbError,
      ].filter(Boolean);
      return { success: leakedInfo.length > 0, leaked: leakedInfo };
    },
    expectedResult: { success: false },
  },
  {
    id: 'RT-LEAK-002',
    name: 'レスポンスヘッダーからの情報漏洩',
    attack: async () => {
      const response = await fetch('/api/health');
      const sensitiveHeaders = [
        response.headers.get('X-Powered-By'),
        response.headers.get('Server'),
      ].filter(Boolean);
      return { success: sensitiveHeaders.length > 0, headers: sensitiveHeaders };
    },
    expectedResult: { success: false },
  },
];
```

---

## L-TA-004: 監査ログ設計

### ログスキーマ

```typescript
// src/lib/audit-log.ts

interface AuditLogEntry {
  // 識別情報
  id: string;                    // ログエントリID (UUID)
  timestamp: string;             // ISO8601形式
  traceId: string;               // リクエストトレースID

  // アクター情報
  actor: {
    type: 'user' | 'system' | 'agent';
    id: string | null;           // ユーザーID（未認証はnull）
    ip: string;                  // マスキング済みIP
    userAgent: string;
  };

  // アクション情報
  action: {
    type: string;                // 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'AUTH'
    resource: string;            // 'transaction' | 'user' | 'group' | 'settlement'
    resourceId: string | null;
    endpoint: string;            // '/api/transactions'
    method: string;              // 'GET' | 'POST' | 'PUT' | 'DELETE'
  };

  // 入力情報
  input: {
    body: Record<string, unknown>;  // 機密フィールドはマスキング
    query: Record<string, string>;
    files: { name: string; size: number }[];
  };

  // 出力情報
  output: {
    statusCode: number;
    success: boolean;
    errorCode: string | null;
    errorMessage: string | null;  // 技術詳細は含めない
  };

  // 根拠・判断情報
  context: {
    ruleApplied: string[];       // 適用されたルールID ['L-CX-001', 'L-SC-001']
    decisionReason: string | null;
    modelVersion: string | null; // AI使用時のモデルバージョン
  };

  // メタ情報
  meta: {
    environment: 'development' | 'staging' | 'production';
    appVersion: string;
    duration: number;            // 処理時間（ms）
  };
}
```

### ログ出力ルール

| イベント | ログレベル | 必須フィールド |
|---------|-----------|---------------|
| 認証成功 | INFO | actor, action, output |
| 認証失敗 | WARN | actor, action, output, context |
| データ作成 | INFO | 全フィールド |
| データ更新 | INFO | 全フィールド + 変更前後の差分 |
| データ削除 | WARN | 全フィールド |
| 権限エラー | WARN | actor, action, output, context |
| セキュリティイベント | ERROR | 全フィールド |
| システムエラー | ERROR | 全フィールド（スタックトレース除く） |

### マスキングルール

```typescript
// src/lib/audit-log-masking.ts

const MASKING_RULES = {
  // 完全マスキング
  password: () => '[REDACTED]',
  token: () => '[REDACTED]',
  secret: () => '[REDACTED]',

  // 部分マスキング
  email: (v: string) => v.replace(/^(.{1,2}).*@/, '$1***@'),
  ip: (v: string) => v.replace(/\.\d+$/, '.xxx'),
  cardNumber: (v: string) => v.replace(/\d{12}(\d{4})/, '************$1'),

  // 条件付きマスキング
  amount: (v: number, context: Context) =>
    context.actor.id === context.resourceOwner ? v : '[HIDDEN]',
};
```

### 検証方法

```typescript
// src/lib/audit-log.test.ts

describe('L-TA-004: 監査ログ設計', () => {
  describe('ログスキーマ', () => {
    it('必須フィールドが全て含まれる', async () => {
      const log = await createAuditLog({
        action: { type: 'CREATE', resource: 'transaction' },
      });

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('actor');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('output');
    });

    it('タイムスタンプはISO8601形式', async () => {
      const log = await createAuditLog({});
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('マスキング', () => {
    it('パスワードは完全マスキング', async () => {
      const log = await createAuditLog({
        input: { body: { password: 'secret123' } },
      });

      expect(log.input.body.password).toBe('[REDACTED]');
    });

    it('メールは部分マスキング', async () => {
      const log = await createAuditLog({
        input: { body: { email: 'user@example.com' } },
      });

      expect(log.input.body.email).toBe('us***@example.com');
    });
  });

  describe('追跡可能性', () => {
    it('同一リクエストのログは同じtraceIdを持つ', async () => {
      const logs = await performRequestAndGetLogs();

      const traceIds = [...new Set(logs.map(l => l.traceId))];
      expect(traceIds).toHaveLength(1);
    });
  });
});
```

---

## L-TA-005: 評価データセットの要件検証

### ルール

評価データセット自体が要件を満たしているかを検証し、テストの信頼性を担保する。

### データセット要件

| 要件ID | 要件 | 検証方法 |
|--------|------|---------|
| DS-001 | 全カテゴリ（典型/境界/事故/グレー/攻撃）が存在する | カテゴリカウント検証 |
| DS-002 | 各カテゴリに最低3ケース以上存在する | ケースカウント検証 |
| DS-003 | 全ケースにユニークIDが付与されている | ID重複チェック |
| DS-004 | 全ケースに期待結果（expected）が定義されている | スキーマ検証 |
| DS-005 | 事故ケースには参照Issue/PRが記載されている | reference必須チェック |
| DS-006 | グレーケースにはnote（判断根拠）が記載されている | note必須チェック |
| DS-007 | 入力値と期待結果の型が一致している | 型整合性チェック |
| DS-008 | 期待結果がルール定義と整合している | ルール照合 |

### データセットスキーマ

```typescript
// tests/fixtures/dataset-schema.ts

import { z } from 'zod';

const BaseTestCaseSchema = z.object({
  id: z.string().regex(/^[A-Z]{3}-\d{3}$/),
  name: z.string().min(1),
  input: z.record(z.unknown()),
  expected: z.union([
    z.object({ error: z.string() }),
    z.record(z.unknown()),
  ]),
});

const TypicalCaseSchema = BaseTestCaseSchema;

const BoundaryCaseSchema = BaseTestCaseSchema;

const IncidentCaseSchema = BaseTestCaseSchema.extend({
  reference: z.string().regex(/^(Issue|PR) #\d+$/),
});

const GrayCaseSchema = BaseTestCaseSchema.extend({
  note: z.string().min(10),
});

const AttackCaseSchema = BaseTestCaseSchema;

export const DatasetSchema = z.object({
  typical: z.array(TypicalCaseSchema).min(3),
  boundary: z.array(BoundaryCaseSchema).min(3),
  incident: z.array(IncidentCaseSchema).min(1),
  gray: z.array(GrayCaseSchema).min(1),
  attack: z.array(AttackCaseSchema).min(3),
});
```

### 検証方法

```typescript
// tests/dataset-validation.test.ts

import { SETTLEMENT_DATASET } from './fixtures/settlement-dataset';
import { CSV_DATASET } from './fixtures/csv-dataset';
import { DatasetSchema } from './fixtures/dataset-schema';

describe('L-TA-005: 評価データセットの要件検証', () => {
  describe('DS-001: 全カテゴリの存在', () => {
    it('精算データセットに全カテゴリが存在する', () => {
      expect(SETTLEMENT_DATASET).toHaveProperty('typical');
      expect(SETTLEMENT_DATASET).toHaveProperty('boundary');
      expect(SETTLEMENT_DATASET).toHaveProperty('incident');
      expect(SETTLEMENT_DATASET).toHaveProperty('gray');
      expect(SETTLEMENT_DATASET).toHaveProperty('attack');
    });
  });

  describe('DS-002: 最低ケース数', () => {
    it('各カテゴリに最低3ケース以上（incident/grayは1以上）', () => {
      expect(SETTLEMENT_DATASET.typical.length).toBeGreaterThanOrEqual(3);
      expect(SETTLEMENT_DATASET.boundary.length).toBeGreaterThanOrEqual(3);
      expect(SETTLEMENT_DATASET.incident.length).toBeGreaterThanOrEqual(1);
      expect(SETTLEMENT_DATASET.gray.length).toBeGreaterThanOrEqual(1);
      expect(SETTLEMENT_DATASET.attack.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DS-003: ユニークID', () => {
    it('全ケースのIDが重複していない', () => {
      const allCases = [
        ...SETTLEMENT_DATASET.typical,
        ...SETTLEMENT_DATASET.boundary,
        ...SETTLEMENT_DATASET.incident,
        ...SETTLEMENT_DATASET.gray,
        ...SETTLEMENT_DATASET.attack,
      ];

      const ids = allCases.map(c => c.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('DS-004: 期待結果の存在', () => {
    it('全ケースにexpectedが定義されている', () => {
      const allCases = [
        ...SETTLEMENT_DATASET.typical,
        ...SETTLEMENT_DATASET.boundary,
        ...SETTLEMENT_DATASET.incident,
        ...SETTLEMENT_DATASET.gray,
        ...SETTLEMENT_DATASET.attack,
      ];

      allCases.forEach(testCase => {
        expect(testCase).toHaveProperty('expected');
        expect(testCase.expected).not.toBeUndefined();
      });
    });
  });

  describe('DS-005: 事故ケースの参照', () => {
    it('事故ケースにreferenceが記載されている', () => {
      SETTLEMENT_DATASET.incident.forEach(testCase => {
        expect(testCase).toHaveProperty('reference');
        expect(testCase.reference).toMatch(/^(Issue|PR) #\d+$/);
      });
    });
  });

  describe('DS-006: グレーケースのnote', () => {
    it('グレーケースにnoteが記載されている', () => {
      SETTLEMENT_DATASET.gray.forEach(testCase => {
        expect(testCase).toHaveProperty('note');
        expect(testCase.note.length).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('DS-007: スキーマ検証', () => {
    it('精算データセットがスキーマに適合する', () => {
      const result = DatasetSchema.safeParse(SETTLEMENT_DATASET);
      expect(result.success).toBe(true);
    });

    it('CSVデータセットがスキーマに適合する', () => {
      const result = DatasetSchema.safeParse(CSV_DATASET);
      expect(result.success).toBe(true);
    });
  });

  describe('DS-008: ルール整合性', () => {
    it('精算計算の期待結果がL-CX-001のロジックと一致する', () => {
      SETTLEMENT_DATASET.typical.forEach(testCase => {
        if ('error' in testCase.expected) return;

        const { paidByA, paidByB, ratioA } = testCase.input as {
          paidByA: number;
          paidByB: number;
          ratioA: number;
        };

        const expectedBalanceA = paidByA - ((paidByA + paidByB) * ratioA / 100);
        const roundedExpected = Math.round(expectedBalanceA);

        expect(testCase.expected.balanceA).toBe(roundedExpected);
      });
    });
  });
});
```

### データセット品質レポート

```typescript
// scripts/dataset-quality-report.ts

interface QualityReport {
  datasetName: string;
  totalCases: number;
  byCategory: Record<string, number>;
  issues: string[];
  score: number;
}

async function generateQualityReport(dataset: unknown): Promise<QualityReport> {
  const issues: string[] = [];

  // 各検証を実行
  const result = DatasetSchema.safeParse(dataset);
  if (!result.success) {
    issues.push(...result.error.errors.map(e => e.message));
  }

  // ID重複チェック
  // reference/noteチェック
  // ルール整合性チェック

  return {
    datasetName: 'settlement',
    totalCases: countCases(dataset),
    byCategory: countByCategory(dataset),
    issues,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 10),
  };
}
```

---

## CI設定

```yaml
# .github/workflows/test-audit.yml

name: Test & Audit Validation

on: [push, pull_request]

jobs:
  test-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run evaluation dataset tests
        run: npm test -- --grep "DATASET"

      - name: Generate scorecard
        run: npx ts-node scripts/generate-scorecard.ts

      - name: Run red team scenarios
        run: npm run test:redteam

      - name: Validate audit log schema
        run: npm test -- --grep "L-TA-004"

      - name: Check test coverage thresholds
        run: npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## 違反時の対応

1. **評価データセット不足**: テストケース追加、カバレッジ向上
2. **採点基準未達**: リリースブロック、修正必須
3. **レッドチーム成功**: P0/P1として即座に対応
4. **ログ欠損**: 監査機能の緊急修正
