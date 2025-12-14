# 05. 組織の一貫性ルール (Organizational Consistency Laws)

## 目的

判断の属人化を防ぎ、開発プロセス全体で一貫した基準を維持する。

---

## L-OC-001: コーディング規約の統一

### ルール

すべてのコードは以下の規約に従うこと：

1. **ESLint + Prettier** による自動フォーマット
2. **TypeScript strict mode** の有効化
3. **命名規則** の統一

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `SettlementDashboard` |
| 関数・変数 | camelCase | `calculateSettlement` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| 型・インターフェース | PascalCase | `Transaction`, `UserGroup` |
| ファイル（コンポーネント） | PascalCase.tsx | `TransactionList.tsx` |
| ファイル（ユーティリティ） | kebab-case.ts | `csv-parser.ts` |

### 検証方法

```json
// .eslintrc.json

{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE", "PascalCase"]
      },
      {
        "selector": "function",
        "format": ["camelCase", "PascalCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

```yaml
# pre-commitフック
# .husky/pre-commit

#!/bin/sh
npm run lint
npm run type-check
```

---

## L-OC-002: 精算ロジックの単一実装

### ルール

精算計算ロジックは `src/lib/settlement.ts` に集約し、他の場所での再実装を禁止する。

### 禁止事項

- フロントエンドでの独自計算ロジック実装
- APIハンドラ内での計算ロジック直接記述
- テストでの計算結果ハードコーディング（ロジック検証目的を除く）

### 正規実装

```typescript
// src/lib/settlement.ts

export interface SettlementInput {
  paidByA: number;
  paidByB: number;
  ratioA: number;
  ratioB: number;
}

export interface SettlementResult {
  balanceA: number;
  direction: 'A_PAYS_B' | 'B_PAYS_A' | 'SETTLED';
  amount: number;
}

export function calculateSettlement(input: SettlementInput): SettlementResult {
  if (input.ratioA + input.ratioB !== 100) {
    throw new Error('負担割合の合計は100%である必要があります');
  }

  const totalHousehold = input.paidByA + input.paidByB;
  const balanceA = input.paidByA - (totalHousehold * input.ratioA / 100);

  return {
    balanceA: Math.round(balanceA),
    direction: balanceA > 0 ? 'B_PAYS_A' : balanceA < 0 ? 'A_PAYS_B' : 'SETTLED',
    amount: Math.abs(Math.round(balanceA)),
  };
}
```

### 検証方法

```typescript
// scripts/check-settlement-implementation.ts

import { glob } from 'glob';
import { readFileSync } from 'fs';

const SETTLEMENT_LOGIC_FILE = 'src/lib/settlement.ts';

const CALCULATION_PATTERNS = [
  /paidBy[AB]\s*-\s*\(.*ratio/i,
  /totalHousehold\s*\*\s*ratio/i,
  /balance[AB]\s*=\s*(?!.*calculateSettlement)/,
];

async function checkSingleImplementation() {
  const files = await glob('src/**/*.{ts,tsx}');
  const violations: string[] = [];

  for (const file of files) {
    if (file === SETTLEMENT_LOGIC_FILE) continue;
    if (file.includes('.test.')) continue;

    const content = readFileSync(file, 'utf-8');

    for (const pattern of CALCULATION_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`${file}: 精算ロジックの重複実装の可能性`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('L-OC-002 違反:');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }
}
```

---

## L-OC-003: エラーハンドリングの統一

### ルール

エラー処理は統一されたパターンを使用すること：

1. **カスタムエラークラス** を使用
2. **エラーコード** を必ず付与
3. **エラーログ** は集約ロガーを使用

### エラー分類

| エラーコード | 分類 | HTTPステータス |
|-------------|------|---------------|
| E_AUTH_* | 認証エラー | 401 |
| E_PERM_* | 権限エラー | 403 |
| E_NOT_FOUND_* | リソース不在 | 404 |
| E_VALIDATION_* | 入力検証エラー | 400 |
| E_INTERNAL_* | 内部エラー | 500 |

### 正規実装

```typescript
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  AUTH_INVALID_CREDENTIALS: () =>
    new AppError('E_AUTH_001', 'メールアドレスまたはパスワードが正しくありません', 401),

  PERM_GROUP_ACCESS_DENIED: () =>
    new AppError('E_PERM_001', 'このグループにアクセスする権限がありません', 403),

  VALIDATION_INVALID_RATIO: () =>
    new AppError('E_VALIDATION_001', '負担割合の合計は100%である必要があります', 400),

  NOT_FOUND_TRANSACTION: (id: string) =>
    new AppError('E_NOT_FOUND_001', `トランザクション ${id} が見つかりません`, 404),
};
```

### 検証方法

```typescript
// src/lib/errors.test.ts

describe('L-OC-003: エラーハンドリングの統一', () => {
  it('すべてのエラーにコードが付与されている', () => {
    Object.values(Errors).forEach(errorFactory => {
      const error = errorFactory('test-id');
      expect(error.code).toMatch(/^E_[A-Z]+_\d{3}$/);
    });
  });

  it('エラーコードとステータスコードの対応が正しい', () => {
    const error401 = Errors.AUTH_INVALID_CREDENTIALS();
    expect(error401.code).toMatch(/^E_AUTH_/);
    expect(error401.statusCode).toBe(401);

    const error403 = Errors.PERM_GROUP_ACCESS_DENIED();
    expect(error403.code).toMatch(/^E_PERM_/);
    expect(error403.statusCode).toBe(403);
  });
});
```

---

## L-OC-004: ドキュメント同期の強制

### ルール

1. 公開APIの変更時は必ずドキュメントを更新する
2. ビジネスロジックの変更時はREQUIREMENTS.mdとの整合性を確認する
3. 型定義とドキュメントの乖離を防ぐ

### 検証方法

```typescript
// scripts/check-doc-sync.ts

import { readFileSync } from 'fs';
import { parse } from '@typescript-eslint/parser';

async function checkDocSync() {
  const requirements = readFileSync('REQUIREMENTS.md', 'utf-8');
  const settlementCode = readFileSync('src/lib/settlement.ts', 'utf-8');

  // REQUIREMENTS.mdの精算ロジック定義
  const docFormula = requirements.match(/Balance_A\s*=\s*([^$]+)/);

  // コードの実装を解析
  const ast = parse(settlementCode, { sourceType: 'module' });

  // ロジックの整合性チェック（簡易版）
  if (!settlementCode.includes('paidByA') || !settlementCode.includes('ratioA')) {
    console.error('L-OC-004 違反: 実装がREQUIREMENTS.mdの定義と乖離している可能性');
    process.exit(1);
  }
}
```

---

## L-OC-005: ルールドキュメントの保護

### ルール

**このドキュメント（docs/laws/配下）はCoding Agentによる編集を禁止する。**

1. ルールの追加・変更・削除はユーザー（人間）のみが行う
2. ルール間の衝突が発見された場合は即座にユーザーに報告する
3. ルールが存在しないケースが発生した場合も即座に報告する

### Agent向け指示

```markdown
## Coding Agent禁則事項

docs/laws/ 配下のファイルを編集することは禁止されています。

以下の状況が発生した場合は、実装を中断しユーザーに報告してください：

1. **ルール衝突**: 複数のルールが矛盾する指示を与える場合
   - 例: L-CX-001が「端数は四捨五入」、L-RV-002が「端数は切り捨て」を要求

2. **ルール不在**: 判断が必要だがルールが定義されていない場合
   - 例: 新機能追加時のセキュリティ要件が未定義

3. **ルール適用不能**: ルールの条件が現在の実装に適用できない場合
   - 例: 使用ライブラリの仕様上、ルール準拠が不可能

報告形式:
```
⚠️ ルール問題検出

種別: [衝突|不在|適用不能]
該当ルール: L-XX-NNN
状況: [具体的な説明]
影響: [実装への影響]
提案: [可能であれば解決案]
```
```

### 検証方法

```yaml
# .github/workflows/protect-laws.yml

name: Protect Laws Documents

on:
  pull_request:
    paths:
      - 'docs/laws/**'

jobs:
  check-author:
    runs-on: ubuntu-latest
    steps:
      - name: Check if author is human
        run: |
          AUTHOR="${{ github.event.pull_request.user.login }}"
          # Botアカウントからの変更は拒否
          if [[ "$AUTHOR" == *"bot"* ]] || [[ "$AUTHOR" == *"agent"* ]]; then
            echo "Error: docs/laws/ への変更はCoding Agentには許可されていません"
            exit 1
          fi

      - name: Require manual approval
        run: |
          echo "docs/laws/ への変更は手動レビューが必須です"
```

---

## CI設定

```yaml
# .github/workflows/consistency.yml

name: Organizational Consistency Validation

on: [push, pull_request]

jobs:
  consistency-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Lint check
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Check single settlement implementation
        run: npx ts-node scripts/check-settlement-implementation.ts

      - name: Check error handling patterns
        run: npm test -- --grep "L-OC-003"

      - name: Check doc sync
        run: npx ts-node scripts/check-doc-sync.ts
```

---

## 違反時の対応

1. **コーディング規約違反**: PRでの自動修正提案、マージブロック
2. **ロジック重複**: 集約実装への移行、重複コード削除
3. **エラーパターン不統一**: 統一パターンへのリファクタリング
4. **ドキュメント乖離**: PRブロック、同期完了後にマージ許可
