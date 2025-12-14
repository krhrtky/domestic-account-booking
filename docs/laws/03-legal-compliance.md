# 03. 法務・コンプライアンスルール (Legal Compliance Laws)

## 目的

個人情報保護、著作権、景表法などの法令違反を防ぎ、適法なサービス運営を確保する。

---

## L-LC-001: 個人情報の適切な取り扱い

### ルール

本アプリケーションで取り扱う個人情報は以下に限定し、適切に管理すること：

**取り扱う個人情報:**
- メールアドレス（認証用）
- ユーザー名（表示用）
- 取引明細データ（CSV由来：日付、金額、摘要）

### 禁止事項

- 銀行口座番号・クレジットカード番号の保存
- 位置情報の取得・保存
- 第三者への個人情報提供（分析サービス含む）
- 必要以上の個人情報収集

### 検証方法

**スキーマ検証:**

```typescript
// src/lib/schema-validation.test.ts

describe('L-LC-001: 個人情報の適切な取り扱い', () => {
  describe('Transactionスキーマ', () => {
    it('禁止フィールドが存在しない', () => {
      const schema = getTransactionSchema();
      const forbiddenFields = [
        'accountNumber',
        'cardNumber',
        'cvv',
        'pin',
        'location',
        'latitude',
        'longitude',
        'ipAddress',
      ];

      forbiddenFields.forEach(field => {
        expect(schema.fields).not.toHaveProperty(field);
      });
    });
  });

  describe('Userスキーマ', () => {
    it('必要最小限のフィールドのみ存在', () => {
      const schema = getUserSchema();
      const allowedFields = ['id', 'email', 'name', 'groupId', 'createdAt', 'updatedAt'];

      Object.keys(schema.fields).forEach(field => {
        expect(allowedFields).toContain(field);
      });
    });
  });
});
```

**CSVパーサー検証:**

```typescript
// src/lib/csv-parser.test.ts

describe('L-LC-001: CSV取り込み時の個人情報フィルタリング', () => {
  it('カード番号を含む列は自動除外される', async () => {
    const csvWithCardNumber = `日付,金額,摘要,カード番号
2025-01-15,1000,スーパー,4111111111111111`;

    const result = await parseCSV(csvWithCardNumber);

    expect(result.transactions[0]).not.toHaveProperty('カード番号');
    expect(result.warnings).toContain('機密情報を含む可能性のある列を除外しました: カード番号');
  });

  it('口座番号パターンは自動マスキングされる', async () => {
    const csvWithAccount = `日付,金額,摘要
2025-01-15,1000,振込 1234567`;

    const result = await parseCSV(csvWithAccount);

    expect(result.transactions[0].description).not.toContain('1234567');
    expect(result.transactions[0].description).toMatch(/振込 \*+/);
  });
});
```

---

## L-LC-002: データ保持期間の制限

### ルール

| データ種別 | 保持期間 | 削除方法 |
|-----------|---------|---------|
| 取引明細 | 3年間 | 自動削除 |
| ユーザーアカウント | 退会後30日 | 論理削除→物理削除 |
| ログデータ | 90日間 | 自動ローテーション |

### 検証方法

```typescript
// src/lib/data-retention.test.ts

describe('L-LC-002: データ保持期間の制限', () => {
  it('3年以上前の取引は自動削除対象', async () => {
    const oldTransaction = createTransaction({
      date: new Date('2022-01-01'),
    });

    await insertTransaction(oldTransaction);
    await runRetentionCleanup();

    const result = await findTransaction(oldTransaction.id);
    expect(result).toBeNull();
  });

  it('退会ユーザーは30日後に物理削除', async () => {
    const user = await createUser();
    await deleteUser(user.id); // 論理削除

    // 30日経過をシミュレート
    await advanceTime(31 * 24 * 60 * 60 * 1000);
    await runRetentionCleanup();

    const result = await findUserIncludingDeleted(user.id);
    expect(result).toBeNull();
  });
});
```

---

## L-LC-003: 著作権・商標の遵守

### ルール

1. 外部ライブラリのライセンスを遵守する
2. 商標（銀行名、カード会社名等）を不適切に使用しない
3. アイコン・画像は適切なライセンスのものを使用する

### 禁止事項

- GPL/AGPLライブラリの不適切な使用
- 銀行・カード会社のロゴ画像の無断使用
- ライセンス表記のない外部素材の使用

### 検証方法

```bash
# package.jsonの依存関係ライセンスチェック
npx license-checker --summary --failOn "GPL;AGPL"
```

```typescript
// scripts/check-licenses.ts

import checker from 'license-checker';

const FORBIDDEN_LICENSES = ['GPL', 'AGPL', 'GPL-2.0', 'GPL-3.0', 'AGPL-3.0'];

checker.init({ start: './' }, (err, packages) => {
  const violations = Object.entries(packages).filter(([_, info]) =>
    FORBIDDEN_LICENSES.some(lic => info.licenses?.includes(lic))
  );

  if (violations.length > 0) {
    console.error('L-LC-003 違反: 禁止ライセンスのパッケージが含まれています');
    console.error(violations.map(([name]) => name));
    process.exit(1);
  }
});
```

---

## L-LC-004: 景品表示法への準拠

### ルール

本アプリは無料サービスのため景表法の適用範囲は限定的だが、以下を遵守：

1. 機能の虚偽表示を行わない
2. 「業界No.1」「最高精度」等の優良誤認表現を使用しない
3. 他サービスとの不当な比較広告を行わない

### 禁止表現リスト

| 禁止表現 | 理由 |
|---------|------|
| 「完璧な精算」 | 精度保証不可 |
| 「100%正確」 | 絶対表現 |
| 「業界最高」 | 根拠なき優良誤認 |
| 「〇〇より優れた」 | 比較広告 |

### 検証方法

```typescript
// scripts/check-prohibited-expressions.ts

const PROHIBITED_EXPRESSIONS = [
  /完璧/,
  /100%/,
  /業界.*(1位|No\.?1|最高|トップ)/i,
  /より(優れ|良|すぐれ)/,
  /絶対に/,
  /必ず/,
];

async function checkProhibitedExpressions() {
  const files = await glob('src/**/*.{ts,tsx}');

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    // JSX内のテキストとstring literalを抽出
    const strings = extractStringsFromCode(content);

    for (const str of strings) {
      for (const pattern of PROHIBITED_EXPRESSIONS) {
        if (pattern.test(str)) {
          console.error(`L-LC-004 違反: ${file} に禁止表現 "${str}" が含まれています`);
        }
      }
    }
  }
}
```

---

## CI設定

```yaml
# .github/workflows/legal-compliance.yml

name: Legal Compliance Validation

on: [push, pull_request]

jobs:
  legal-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check licenses
        run: npx license-checker --summary --failOn "GPL;AGPL"

      - name: Run schema validation tests
        run: npm test -- --grep "L-LC-001"

      - name: Run data retention tests
        run: npm test -- --grep "L-LC-002"

      - name: Check prohibited expressions
        run: npx ts-node scripts/check-prohibited-expressions.ts
```

---

## 違反時の対応

1. **個人情報漏洩リスク**: 即座にデプロイ停止、影響範囲調査
2. **ライセンス違反**: 該当パッケージの除去または代替実装
3. **景表法違反**: 該当表現の即時削除、レビュープロセス強化
