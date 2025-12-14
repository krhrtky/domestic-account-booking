# 08. 業務ルール (Business Rules)

## 目的

家計精算アプリのドメインロジックを明確化し、実装判断の属人化を防ぐ。

---

## L-BR-001: 精算計算ルール

### ルール定義

**採用ロジック（シンプルモデル）:**

```
Balance_A = PaidBy_A^{Household} - ((PaidBy_A^{Household} + PaidBy_B^{Household}) × Ratio_A)
```

| 条件 | 結果 |
|------|------|
| Balance_A > 0 | BがAに Balance_A を支払う |
| Balance_A < 0 | AがBに \|Balance_A\| を支払う |
| Balance_A = 0 | 精算不要 |

### 業務制約

| 制約 | 値 | 根拠 |
|------|-----|------|
| 負担割合の合計 | 100% | 論理的整合性 |
| 負担割合の最小単位 | 1% | UI/UX簡素化 |
| 金額の端数処理 | 四捨五入 | 公平性 |
| 金額の最小単位 | 1円 | 日本円の最小単位 |

### 検証方法

→ L-CX-001, L-OC-002 を参照

---

## L-BR-002: 支払元（Payer）ルール

### 定義

| Payer | 説明 | 精算計算への影響 |
|-------|------|-----------------|
| UserA | ユーザーAの個人財布 | Balance計算に含む |
| UserB | ユーザーBの個人財布 | Balance計算に含む |
| Common | 共通口座 | Balance計算から除外 |

### 業務制約

| 制約 | 内容 |
|------|------|
| Payer選択 | CSV取り込み時に必須選択 |
| Payer変更 | 取り込み後の個別変更は不可（再取り込みで対応） |
| Common口座の原資 | 50:50を前提（設定変更不可） |

### 根拠

共通口座からの支払いは「既に二人の資金プールから出ている」ため、個人間の立替精算計算には含めない。

---

## L-BR-003: 支出タイプ（ExpenseType）ルール

### 定義

| ExpenseType | 説明 | 精算対象 |
|-------------|------|---------|
| Household | 家計・共有の支出 | ✓ 対象 |
| Personal | 個人の支出 | ✗ 対象外 |

### 分類ガイドライン

| カテゴリ | 典型例 | 推奨ExpenseType |
|---------|--------|----------------|
| 食費（共同） | スーパー、外食（二人） | Household |
| 食費（個人） | 個人のランチ、趣味の食材 | Personal |
| 住居費 | 家賃、光熱費、インターネット | Household |
| 日用品 | トイレットペーパー、洗剤 | Household |
| 趣味・娯楽（個人） | 個人の書籍、ゲーム | Personal |
| 趣味・娯楽（共同） | 二人で見る映画、旅行 | Household |
| 医療費（個人） | 個人の通院 | Personal |
| 医療費（共同） | 共同の医薬品 | Household |

### 業務制約

| 制約 | 内容 |
|------|------|
| デフォルト値 | Household（取り込み時） |
| 変更タイミング | 取り込み後いつでも変更可 |
| 変更権限 | グループメンバー全員 |
| 自動分類 | 提案のみ（強制禁止：L-LC-005） |

### 判断に迷う場合

**原則:** ユーザーの判断を優先する。システムは判断を強制しない。

```
迷った場合のフローチャート:
1. 二人で消費/利用するか？ → Yes → Household
2. 片方だけが消費/利用するか？ → Yes → Personal
3. 判断できない → ユーザーに委ねる（デフォルトHousehold）
```

---

## L-BR-004: 月次集計ルール

### 定義

| 項目 | 値 |
|------|-----|
| 集計期間 | 月初〜月末（1日00:00:00 〜 末日23:59:59） |
| タイムゾーン | Asia/Tokyo (JST) |
| 対象データ | 取引日（date）が期間内のもの |

### 業務制約

| 制約 | 内容 |
|------|------|
| 過去月の編集 | 可能（精算結果は再計算される） |
| 未来月のデータ | 登録可能（表示対象外） |
| 集計表示 | 当月から過去12ヶ月 |

### 月またぎの扱い

| シナリオ | 対応 |
|---------|------|
| 1/31の夜に2/1の買い物 | 取引日=2/1として登録 → 2月集計 |
| クレジットカード明細の日付 | 利用日を採用（引き落とし日ではない） |

---

## L-BR-005: グループ管理ルール

### グループ構成

| 項目 | 値 |
|------|-----|
| 最大メンバー数 | 2名 |
| 最小メンバー数 | 1名（招待待ち状態） |
| グループ数/ユーザー | 1（複数グループ不可） |

### 招待フロー

```
1. UserAがグループを作成
2. UserAが招待リンク/コードを発行
3. UserBが招待を受諾
4. グループ成立（2名）
```

### 業務制約

| 制約 | 内容 |
|------|------|
| 招待有効期限 | 7日間 |
| 招待取り消し | 発行者がいつでも可能 |
| グループ脱退 | 可能（データは残る） |
| グループ削除 | 全メンバー脱退で自動削除 |

---

## L-BR-006: CSV取り込みルール

### 対応フォーマット

| 項目 | 要件 |
|------|------|
| 文字コード | UTF-8（BOMあり/なし両対応） |
| 区切り文字 | カンマ（,） |
| ヘッダー行 | 必須 |
| 必須列 | 日付, 金額 |
| 推奨列 | 摘要/メモ |

### 列マッピング

| CSVヘッダー例 | マッピング先 |
|--------------|-------------|
| 日付, 利用日, Date | date |
| 金額, 利用金額, Amount | amount |
| 摘要, 内容, メモ, Description | description |

### 業務制約

| 制約 | 値 | 根拠 |
|------|-----|------|
| ファイルサイズ上限 | 5MB | L-RV-002 |
| 行数上限 | 10,000行 | L-RV-002 |
| 重複検知 | 日付+金額+摘要の一致 | 二重取り込み防止 |
| 重複時の動作 | 警告表示（取り込みは実行） | ユーザー判断優先 |

---

## L-BR-007: 根拠トレーサビリティ（監査要件）

### ユースケース

**UC-001: 精算金額の根拠確認**

```
アクター: ユーザー（AまたはB）
前提条件: 月次精算結果が表示されている
トリガー: 「詳細を見る」をクリック

フロー:
1. システムは精算金額の内訳を表示する
2. 内訳には以下が含まれる:
   - Householdとして計上された全明細一覧
   - 各明細の金額と支払元（Payer）
   - PaidByA合計, PaidByB合計
   - 適用された負担割合
   - 計算式の適用結果
3. ユーザーは任意の明細をクリックして詳細を確認できる

事後条件: ユーザーは精算金額がどの明細から算出されたかを理解できる
```

**UC-002: 過去精算のトレース**

```
アクター: ユーザー
前提条件: 過去の精算結果を確認したい
トリガー: 過去月を選択

フロー:
1. システムはその月の精算結果を表示する
2. 表示内容はUC-001と同等
3. 過去月のデータが編集されている場合、編集履歴を表示可能

事後条件: 過去の精算根拠を確認できる
```

**UC-003: 監査ログの確認（将来拡張）**

```
アクター: システム管理者
前提条件: 監査が必要な状況
トリガー: 監査ログ参照

フロー:
1. 指定期間の全操作ログを取得
2. 各ログには L-TA-004 で定義されたスキーマが適用される
3. 精算結果に影響した操作（明細追加/編集/削除）を抽出可能

事後条件: 精算結果に至るまでの全操作履歴を追跡可能
```

### 実装要件

| 要件 | 内容 |
|------|------|
| 精算結果画面 | 内訳表示ボタンを設置 |
| 内訳表示 | 明細一覧 + 計算過程を表示 |
| データ保持 | 精算時点のスナップショットは不要（リアルタイム再計算） |
| 監査ログ | L-TA-004 に準拠 |

### 検証方法

```typescript
// e2e/traceability.spec.ts

describe('L-BR-007: 根拠トレーサビリティ', () => {
  describe('UC-001: 精算金額の根拠確認', () => {
    it('精算結果から明細一覧を確認できる', async ({ page }) => {
      await page.goto('/settlement?month=2025-01');

      await page.getByRole('button', { name: '詳細を見る' }).click();

      // 内訳が表示される
      await expect(page.getByTestId('breakdown-panel')).toBeVisible();

      // Household明細一覧
      const items = page.getByTestId('household-item');
      await expect(items).toHaveCount(await getHouseholdCount('2025-01'));

      // 合計値
      await expect(page.getByTestId('paid-by-a-total')).toHaveText(/¥[\d,]+/);
      await expect(page.getByTestId('paid-by-b-total')).toHaveText(/¥[\d,]+/);

      // 計算式
      await expect(page.getByTestId('calculation-formula')).toBeVisible();
    });

    it('明細をクリックすると詳細が表示される', async ({ page }) => {
      await page.goto('/settlement?month=2025-01');
      await page.getByRole('button', { name: '詳細を見る' }).click();

      await page.getByTestId('household-item').first().click();

      await expect(page.getByTestId('transaction-detail')).toBeVisible();
      await expect(page.getByTestId('transaction-date')).toBeVisible();
      await expect(page.getByTestId('transaction-amount')).toBeVisible();
      await expect(page.getByTestId('transaction-payer')).toBeVisible();
    });
  });
});
```

---

## CI設定

```yaml
# .github/workflows/business-rules.yml

name: Business Rules Validation

on: [push, pull_request]

jobs:
  business-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run settlement calculation tests
        run: npm test -- --grep "L-BR-001"

      - name: Run expense type tests
        run: npm test -- --grep "L-BR-003"

      - name: Run CSV import tests
        run: npm test -- --grep "L-BR-006"

      - name: Run traceability E2E tests
        run: npm run test:e2e -- --grep "L-BR-007"
```

---

## 違反時の対応

1. **計算ロジック違反**: P1事故として即座に修正
2. **分類ルール違反**: ユーザー判断優先の原則に戻す
3. **トレーサビリティ欠如**: UI改修で対応
