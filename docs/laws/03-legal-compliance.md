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

## L-LC-004: 禁止表現リスト

### ルール

本アプリは無料サービスのため景表法の適用範囲は限定的だが、以下を遵守：

1. 機能の虚偽表示を行わない
2. 優良誤認・有利誤認表現を使用しない
3. 他サービスとの不当な比較広告を行わない
4. 差別的・不適切な表現を使用しない

### 禁止表現カテゴリ

#### A. 優良誤認表現（景表法）

| カテゴリ | 禁止表現例 | 理由 |
|---------|-----------|------|
| 絶対表現 | 完璧、100%、絶対、必ず、確実 | 保証不可能な断定 |
| 最上級表現 | 業界No.1、最高、最強、究極、唯一 | 根拠なき優位性主張 |
| 比較表現 | 〇〇より優れた、他社を超える | 不当な比較広告 |
| 効果保証 | 必ず節約できる、損しない | 効果の断定的保証 |

#### B. 専門領域への踏み込み表現

| カテゴリ | 禁止表現例 | 理由 |
|---------|-----------|------|
| 税務助言 | 節税になる、確定申告に使える、税金が減る | 税理士法抵触の恐れ |
| 投資助言 | 投資判断、資産運用、利益が出る | 金商法抵触の恐れ |
| 法務助言 | 法的に有効、契約として成立 | 弁護士法抵触の恐れ |

#### C. 差別的・不適切表現

| カテゴリ | 禁止表現例 | 理由 |
|---------|-----------|------|
| 性差別 | 主婦向け、男性の稼ぎ、女性の家事 | ジェンダーバイアス |
| 年齢差別 | お年寄り向け、若者向け（限定的使用除く） | エイジズム |
| 経済差別 | 貧乏人、金持ち、低所得者 | 経済的差別 |
| 能力差別 | 頭が悪い、馬鹿でもわかる | 能力主義的差別 |

#### D. 過剰な煽り表現

| カテゴリ | 禁止表現例 | 理由 |
|---------|-----------|------|
| 恐怖訴求 | 損する、危険、今すぐやらないと | 過度な不安喚起 |
| 緊急性煽り | 今だけ、期間限定、急いで | 無料アプリには不適切 |
| 後悔訴求 | 後悔する、もったいない | 過度な心理的圧力 |

### 禁止表現正規表現パターン

```typescript
// scripts/check-prohibited-expressions.ts

const PROHIBITED_EXPRESSIONS = {
  // A. 優良誤認表現
  absolute: [
    /完璧/,
    /100%/,
    /絶対(に)?/,
    /必ず/,
    /確実(に)?/,
    /間違いなく/,
  ],
  superlative: [
    /業界.*(1位|No\.?1|最高|トップ|ナンバーワン)/i,
    /最(高|強|速|安|良)/,
    /究極/,
    /唯一(の)?/,
    /世界初/,
    /日本初/,
  ],
  comparison: [
    /より(優れ|良|すぐれ|安|便利)/,
    /他(社|アプリ).*(超|勝|上)/,
    /〇〇より/,
    /比べて/,
  ],

  // B. 専門領域
  tax: [
    /節税/,
    /確定申告/,
    /税(金|額).*(減|安|得)/,
    /控除/,
  ],
  investment: [
    /投資(判断|助言)/,
    /資産運用/,
    /利益が(出|増)/,
    /儲(か|け)/,
  ],
  legal: [
    /法的(に)?(有効|成立)/,
    /契約として/,
    /法律上/,
  ],

  // C. 差別的表現
  gender: [
    /主婦(向け)?/,
    /(男性|女性)(の|が)(稼|家事)/,
    /嫁(の|が)/,
    /旦那(の|が)/,
  ],
  age: [
    /お年寄り/,
    /老人/,
    /年寄り/,
  ],
  economic: [
    /貧乏/,
    /金持ち/,
    /低所得/,
    /底辺/,
  ],
  ability: [
    /頭(が)?(悪|良)/,
    /馬鹿/,
    /アホ/,
    /バカ/,
  ],

  // D. 過剰な煽り
  fear: [
    /損(する|します)/,
    /危険/,
    /今すぐ/,
    /手遅れ/,
  ],
  urgency: [
    /今だけ/,
    /期間限定/,
    /急(いで|げ)/,
    /早く(しないと)?/,
  ],
  regret: [
    /後悔/,
    /もったいない/,
    /やらないと損/,
  ],
};

async function checkProhibitedExpressions() {
  const files = await glob('src/**/*.{ts,tsx}');
  const violations: { file: string; category: string; expression: string }[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const strings = extractStringsFromCode(content);

    for (const str of strings) {
      for (const [category, patterns] of Object.entries(PROHIBITED_EXPRESSIONS)) {
        for (const pattern of patterns) {
          if (pattern.test(str)) {
            violations.push({ file, category, expression: str });
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('L-LC-004 違反:');
    violations.forEach(v => {
      console.error(`  - ${v.file} [${v.category}]: "${v.expression}"`);
    });
    process.exit(1);
  }
}
```

---

## L-LC-005: 機能の禁止領域

### ルール

本アプリケーションは家計精算に特化し、以下の領域には踏み込まない：

| 禁止領域 | 理由 | 代替案 |
|---------|------|--------|
| 税務計算・申告 | 税理士法 | 「税務は専門家にご相談ください」 |
| 投資助言 | 金融商品取引法 | 機能として実装しない |
| 法的助言 | 弁護士法 | 機能として実装しない |
| 医療・健康助言 | 医師法・薬機法 | 機能として実装しない |
| 自動意思決定 | - | 全ての判断はユーザーが行う |

### 禁止機能

1. **税務関連**
   - 確定申告書類の生成
   - 控除額の計算
   - 税務上の分類判定

2. **投資関連**
   - 投資判断の推奨
   - 資産配分の提案
   - 将来予測の提示

3. **自動判定**
   - 支出タイプの強制自動分類（提案のみ可）
   - 精算金額の自動送金連携
   - ユーザー確認なしの操作

### UI/メッセージでの明示

```typescript
// 許可される表現
const ALLOWED_MESSAGES = [
  '参考値としてご利用ください',
  '正確な金額は各明細をご確認ください',
  '税務・法務については専門家にご相談ください',
];

// 禁止される表現
const FORBIDDEN_MESSAGES = [
  'この金額を確定申告に使用できます',
  '税金が〇〇円節約できます',
  '法的に有効な記録です',
];
```

### 検証方法

```typescript
// scripts/check-forbidden-features.ts

const FORBIDDEN_FEATURE_PATTERNS = [
  // 税務関連コード
  /tax.*calculation/i,
  /deduction.*amount/i,
  /kakutei.*shinkoku/i,
  /確定申告/,

  // 投資関連コード
  /investment.*advice/i,
  /portfolio.*suggest/i,
  /asset.*allocation/i,

  // 自動判定関連
  /auto.*classify(?!.*suggest)/i,
  /force.*categorize/i,
  /without.*confirm/i,
];

async function checkForbiddenFeatures() {
  const files = await glob('src/**/*.{ts,tsx}');

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');

    for (const pattern of FORBIDDEN_FEATURE_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`L-LC-005 違反: ${file} に禁止機能パターンを検出`);
        process.exit(1);
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
