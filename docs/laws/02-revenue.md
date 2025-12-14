# 02. 収益・利益ルール (Revenue Laws)

## 目的

無料アプリとしての一貫性を保ち、ユーザーへの誤った課金表示やコスト逸脱を防ぐ。

---

## L-RV-001: 無料サービスの明示

### ルール

本アプリケーションは完全無料サービスであり、以下を厳守すること：

1. 課金機能・決済フローを実装しない
2. 「有料」「プレミアム」「アップグレード」等の課金を示唆する表現を使用しない
3. ユーザーに金銭的負担を求めるUIを表示しない

### 禁止事項

- `Stripe`, `PayPal`, 決済SDK等の導入
- `price`, `payment`, `subscription`, `premium` 等の課金関連変数・関数の定義
- 「Pro版」「有料プラン」等の将来的な課金を示唆するプレースホルダー

### 検証方法

**静的解析（必須）:**

```typescript
// scripts/check-no-payment.ts

import { glob } from 'glob';
import { readFileSync } from 'fs';

const FORBIDDEN_PATTERNS = [
  /stripe/i,
  /paypal/i,
  /payment/i,
  /subscription/i,
  /premium/i,
  /upgrade.*plan/i,
  /pro\s*version/i,
];

const EXCLUDED_PATHS = [
  'docs/laws/', // このルールファイル自体は除外
  'node_modules/',
];

async function checkNoPaymentCode() {
  const files = await glob('src/**/*.{ts,tsx}');
  const violations: string[] = [];

  for (const file of files) {
    if (EXCLUDED_PATHS.some(p => file.includes(p))) continue;

    const content = readFileSync(file, 'utf-8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`${file}: 禁止パターン "${pattern.source}" を検出`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('L-RV-001 違反:');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  console.log('L-RV-001: OK - 課金関連コードは検出されませんでした');
}

checkNoPaymentCode();
```

**package.json依存関係チェック:**

```typescript
// scripts/check-dependencies.ts

import packageJson from '../package.json';

const FORBIDDEN_DEPS = [
  'stripe',
  '@stripe/stripe-js',
  'paypal',
  '@paypal/checkout-server-sdk',
  'braintree',
];

const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const violations = FORBIDDEN_DEPS.filter(dep => dep in allDeps);

if (violations.length > 0) {
  console.error('L-RV-001 違反: 課金関連パッケージが含まれています');
  console.error(violations);
  process.exit(1);
}
```

---

## L-RV-002: インフラコストの制御

### ルール

運用コストを予測可能な範囲に保つため、以下を遵守すること：

1. 外部APIコール回数に上限を設ける
2. ストレージ使用量を監視可能にする
3. 無制限のリソース消費を許可するエンドポイントを作らない

### 制限値

| リソース | 制限 | 根拠 |
|---------|------|------|
| CSVファイルサイズ | 5MB | Vercel Serverless制限 |
| 1CSVあたりの行数 | 10,000行 | メモリ制限 |
| ユーザーあたりの月間トランザクション | 50,000件 | DB容量 |

### 検証方法

```typescript
// src/lib/csv-parser.test.ts

describe('L-RV-002: インフラコストの制御', () => {
  it('CSVファイルサイズが5MBを超える場合はエラー', async () => {
    const largeFile = createMockFile({ sizeInBytes: 6 * 1024 * 1024 });

    await expect(parseCSV(largeFile)).rejects.toThrow(
      'ファイルサイズが上限(5MB)を超えています'
    );
  });

  it('10,000行を超えるCSVはエラー', async () => {
    const manyRowsCSV = createCSVWithRows(10001);

    await expect(parseCSV(manyRowsCSV)).rejects.toThrow(
      '行数が上限(10,000行)を超えています'
    );
  });
});
```

```typescript
// src/app/api/transactions/route.ts のバリデーション

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 10000;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: 'ファイルサイズが上限(5MB)を超えています' },
      { status: 413 }
    );
  }

  // ... 以降の処理
}
```

---

## L-RV-003: 将来の収益化への配慮

### ルール

将来的な収益化の可能性を排除しないが、現時点では以下を遵守：

1. 収益化機能のスタブ・プレースホルダーを作成しない
2. 機能制限のためのフラグを埋め込まない
3. 「今後有料化の可能性」等のユーザーへの示唆を行わない

### 許可事項

- アーキテクチャ設計書への将来拡張の記載（コードではなくドキュメント）
- A/Bテスト基盤の準備（収益化以外の用途に限定）

### 検証方法

```typescript
// scripts/check-no-feature-flags.ts

const SUSPICIOUS_PATTERNS = [
  /isPremium/i,
  /isFreeTier/i,
  /featureFlag.*payment/i,
  /限定機能/,
  /有料化/,
];

// src/**/*.ts, src/**/*.tsx をスキャンし、上記パターンを検出したら警告
```

---

## CI設定

```yaml
# .github/workflows/revenue-validation.yml

name: Revenue Laws Validation

on: [push, pull_request]

jobs:
  revenue-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check no payment code
        run: npx ts-node scripts/check-no-payment.ts

      - name: Check forbidden dependencies
        run: npx ts-node scripts/check-dependencies.ts

      - name: Run cost control tests
        run: npm test -- --grep "L-RV-"
```

---

## 違反時の対応

1. **課金コード検出**: 即座にPRをブロック、理由の説明を求める
2. **コスト制限違反**: 制限値の妥当性を再検討し、必要に応じてルール更新
3. **将来収益化示唆**: ユーザー向けメッセージの場合は即座に削除
