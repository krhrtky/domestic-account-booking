# 01. 顧客体験ルール (Customer Experience Laws)

## 目的

誤案内・過剰約束・不適切表現を防ぎ、ユーザーに正確で一貫した体験を提供する。

---

## L-CX-001: 精算金額の正確性

### ルール

精算金額の計算結果は、定義されたロジックに100%準拠すること。

**精算ロジック定義:**

```
Balance_A = PaidBy_A^{Household} - ((PaidBy_A^{Household} + PaidBy_B^{Household}) × Ratio_A)
```

- `Balance_A > 0`: BはAに `Balance_A` を支払う
- `Balance_A < 0`: AはBに `|Balance_A|` を支払う
- `Common`（共通口座）からの支払いは計算から除外する

### 禁止事項

- 端数処理の独自実装（`Math.round()` を使用し、小数点以下は四捨五入）
- 負担割合の合計が100%以外になる状態での計算実行
- 計算結果と表示金額の不一致

### 検証方法

**ユニットテスト（必須）:**

```typescript
// src/lib/settlement.test.ts

describe('L-CX-001: 精算金額の正確性', () => {
  describe('基本計算', () => {
    it('50:50の負担割合で正しく計算される', () => {
      const result = calculateSettlement({
        paidByA: 10000,
        paidByB: 0,
        ratioA: 50,
        ratioB: 50,
      });
      expect(result.balanceA).toBe(5000);
      expect(result.direction).toBe('B_PAYS_A');
    });

    it('60:40の負担割合で正しく計算される', () => {
      const result = calculateSettlement({
        paidByA: 10000,
        paidByB: 0,
        ratioA: 60,
        ratioB: 40,
      });
      expect(result.balanceA).toBe(4000);
      expect(result.direction).toBe('B_PAYS_A');
    });
  });

  describe('エッジケース', () => {
    it('共通口座からの支払いは計算から除外される', () => {
      const result = calculateSettlement({
        paidByA: 5000,
        paidByB: 5000,
        paidByCommon: 10000,
        ratioA: 50,
        ratioB: 50,
      });
      expect(result.balanceA).toBe(0);
    });

    it('負担割合の合計が100%でない場合はエラー', () => {
      expect(() => calculateSettlement({
        paidByA: 10000,
        paidByB: 0,
        ratioA: 60,
        ratioB: 50, // 合計110%
      })).toThrow('負担割合の合計は100%である必要があります');
    });
  });
});
```

**E2Eテスト（必須）:**

```typescript
// e2e/settlement.spec.ts

test('L-CX-001: 精算結果が正確に表示される', async ({ page }) => {
  // テストデータ投入
  await setupTestTransactions([
    { amount: 10000, payer: 'UserA', expenseType: 'Household' },
    { amount: 5000, payer: 'UserB', expenseType: 'Household' },
  ]);

  await page.goto('/settlement');

  // 50:50設定
  const settlementAmount = await page.getByTestId('settlement-amount').textContent();
  expect(settlementAmount).toBe('¥2,500');

  const direction = await page.getByTestId('settlement-direction').textContent();
  expect(direction).toContain('BさんがAさんに支払う');
});
```

---

## L-CX-002: UI表示の一貫性

### ルール

金額・日付・ステータスの表示形式は統一すること。

| 項目 | 形式 | 例 |
|------|------|-----|
| 金額 | `¥{3桁区切り}` | ¥10,000 |
| 日付 | `YYYY年MM月DD日` または `YYYY/MM/DD` | 2025年1月15日 |
| パーセント | `{数値}%` | 60% |

### 禁止事項

- 異なる画面で異なるフォーマットの使用
- 通貨記号なしの金額表示
- ローカライズされていない日付形式（`Jan 15, 2025` など）

### 検証方法

**フォーマットユーティリティテスト:**

```typescript
// src/lib/formatters.test.ts

describe('L-CX-002: UI表示の一貫性', () => {
  describe('金額フォーマット', () => {
    it('正の金額は円記号と3桁区切りで表示', () => {
      expect(formatCurrency(10000)).toBe('¥10,000');
      expect(formatCurrency(1234567)).toBe('¥1,234,567');
    });

    it('負の金額はマイナス記号を先頭に', () => {
      expect(formatCurrency(-5000)).toBe('-¥5,000');
    });

    it('0は ¥0 と表示', () => {
      expect(formatCurrency(0)).toBe('¥0');
    });
  });

  describe('日付フォーマット', () => {
    it('標準形式で表示', () => {
      expect(formatDate(new Date('2025-01-15'))).toBe('2025年1月15日');
    });
  });
});
```

**VRT（Visual Regression Testing）:**

```typescript
// e2e/visual/settlement.spec.ts

test('精算画面のビジュアル一貫性', async ({ page }) => {
  await page.goto('/settlement');
  await expect(page).toHaveScreenshot('settlement-dashboard.png');
});
```

---

## L-CX-003: エラーメッセージの明確性

### ルール

エラーメッセージは以下の要件を満たすこと：

1. **具体的**: 何が問題かを明示
2. **対処可能**: 次にすべきアクションを示す
3. **非技術的**: 技術用語を避け、一般ユーザーが理解できる言葉を使用

### 禁止事項

- 技術的なエラーメッセージの直接表示（例: `TypeError: Cannot read property 'x' of undefined`）
- 曖昧なメッセージ（例: `エラーが発生しました`）
- 英語のみのエラーメッセージ

### エラーメッセージマッピング

| エラー種別 | 技術的原因 | ユーザー向けメッセージ |
|-----------|-----------|----------------------|
| CSV形式エラー | Parse error | CSVファイルの形式が正しくありません。UTF-8形式で保存されたファイルをご利用ください。 |
| 認証エラー | 401 Unauthorized | ログインセッションが切れました。再度ログインしてください。 |
| 権限エラー | 403 Forbidden | この操作を行う権限がありません。グループ設定を確認してください。 |
| サーバーエラー | 500 Internal Error | 一時的な問題が発生しました。しばらく待ってから再度お試しください。 |

### 検証方法

```typescript
// src/lib/error-messages.test.ts

describe('L-CX-003: エラーメッセージの明確性', () => {
  it('技術的エラーはユーザーフレンドリーに変換される', () => {
    expect(getUserMessage(new Error('PARSE_ERROR'))).toBe(
      'CSVファイルの形式が正しくありません。UTF-8形式で保存されたファイルをご利用ください。'
    );
  });

  it('未知のエラーには汎用メッセージを表示', () => {
    expect(getUserMessage(new Error('UNKNOWN'))).toBe(
      '予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。'
    );
  });

  it('すべてのエラーメッセージが日本語である', () => {
    const allMessages = Object.values(ERROR_MESSAGES);
    allMessages.forEach(msg => {
      expect(msg).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
    });
  });
});
```

---

## L-CX-004: 操作フィードバックの即時性

### ルール

ユーザーの操作に対して、以下の時間内にフィードバックを返すこと：

| 操作 | 最大許容時間 | フィードバック |
|------|-------------|---------------|
| ボタンクリック | 100ms | ローディング状態への変化 |
| フォーム送信 | 200ms | 送信中インジケータ |
| API応答待ち | 3秒 | プログレス表示継続 |
| 3秒超過 | - | タイムアウトメッセージ |

### 検証方法

```typescript
// e2e/performance.spec.ts

test('L-CX-004: CSV アップロードボタンは即座にローディング状態になる', async ({ page }) => {
  await page.goto('/transactions/upload');

  const uploadButton = page.getByRole('button', { name: 'アップロード' });

  const startTime = Date.now();
  await uploadButton.click();

  await expect(page.getByTestId('loading-indicator')).toBeVisible();
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(100);
});
```

---

## CI設定

```yaml
# .github/workflows/cx-validation.yml

name: Customer Experience Validation

on: [push, pull_request]

jobs:
  cx-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run CX unit tests
        run: npm test -- --grep "L-CX-"

      - name: Run E2E CX tests
        run: npm run test:e2e -- --grep "L-CX-"

      - name: Visual Regression Tests
        run: npm run test:vrt
```

---

## 違反時の対応

1. **CIでの自動検出**: テスト失敗時はマージをブロック
2. **レビュー時の確認**: PRレビューでCXルール準拠をチェックリスト化
3. **本番検出時**: 即座に修正パッチをリリース
