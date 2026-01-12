# Spec & Acceptance (最終版)

## 1. ユーザー判断結果

**選択オプション:**

- **表示範囲**: Option C「支出全体を可視化」
- **配置場所**: Option 2-A「精算サマリーに追加」

**仕様方針:**
各ユーザーの「総支出額」（Household + Personal）を表示し、内訳をドリルダウン可能にする。

---

## 2. 機能要件

### 2.1 スコープ

**追加機能:**

- 各ユーザーの総支出額表示（Household + Personal）
- 内訳のドリルダウン表示（Household支払額 / Personal支出額）
- Personal支出の月次集計

**非スコープ:**

- Personal支出の精算計算（L-BR-003: Personal=精算対象外）
- 新規画面・ページ追加
- 取引一覧画面の変更

### 2.2 ユーザーストーリー

```gherkin
Feature: 個人支出の可視化

  As a グループメンバー
  I want to 各ユーザーの総支出と内訳を確認したい
  So that 家計精算と個人支出を正しく理解できる

  Scenario: 総支出額と内訳を確認
    Given ユーザーがダッシュボードを表示している
    When 精算サマリーの「個人の支出」セクションを確認する
    Then UserAの総支出額が表示される
    And UserBの総支出額が表示される
    And 各ユーザーの内訳（Household/Personal）を展開できる

  Scenario: Personal支出が精算対象外であることを理解
    Given ユーザーが内訳を展開している
    When Personal支出の項目を確認する
    Then 「精算対象外」のラベルが表示される
    And ツールチップで説明が提供される
```

---

## 3. 受け入れ条件

### AC-001: 総支出額の表示

**法令参照**: L-CX-002, L-BR-003

**条件:**

```yaml
Given: ユーザーがダッシュボードを表示
When: 精算サマリーの「個人の支出」セクションを確認
Then:
  - UserAの総支出額が表示される（Household + Personal）
  - UserBの総支出額が表示される（Household + Personal）
  - 金額フォーマットは L-CX-002 に準拠（¥X,XXX形式）
  - ユーザー名が正しく表示される
```

**検証方法**: E2E test
**テストケースID**: DASH-001

---

### AC-002: 内訳のドリルダウン表示

**法令参照**: L-CX-002, L-BR-003

**条件:**

```yaml
Given: ユーザーが「個人の支出」セクションを表示
When: ユーザー名または展開ボタンをクリック
Then:
  - 内訳パネルが展開される
  - Household支払額が表示される
  - Personal支出額が表示される
  - 各項目の金額フォーマットは L-CX-002 に準拠
  - Personal支出に「精算対象外」ラベルが表示される
```

**検証方法**: E2E test
**テストケースID**: DASH-002

---

### AC-003: Personal支出の説明明示

**法令参照**: L-BR-003, L-CX-003, L-LC-004

**条件:**

```yaml
Given: ユーザーが内訳パネルを展開
When: Personal支出項目のツールチップにホバー
Then:
  - 「個人で消費した支出です。精算計算には含まれません。」が表示される
  - L-LC-004 禁止表現を含まない
  - 簡潔で理解しやすい日本語
```

**検証方法**: E2E test
**テストケースID**: DASH-003

---

### AC-004: 過去月の正しい集計

**法令参照**: L-BR-004

**条件:**

```yaml
Given: ユーザーが過去月（例: 2024-12）を選択
When: 精算サマリーを表示
Then:
  - 選択月のHousehold支払額が正しく集計される
  - 選択月のPersonal支出額が正しく集計される
  - 月またぎの扱いは L-BR-004 に準拠
```

**検証方法**: Integration test
**テストケースID**: DASH-004

---

### AC-005: データ不在時の表示

**法令参照**: L-CX-003

**条件:**

```yaml
Given: 選択月に取引が0件
When: 精算サマリーを表示
Then:
  - 総支出額が ¥0 と表示される
  - 内訳も全て ¥0 と表示される
  - エラーメッセージは表示されない
```

**検証方法**: E2E test
**テストケースID**: DASH-005

---

## 4. データモデル

### 4.1 Settlement型の拡張

**現在:**

```typescript
export interface Settlement {
  month: string;
  total_household: number;
  paid_by_a_household: number;
  paid_by_b_household: number;
  balance_a: number;
  ratio_a: number;
  ratio_b: number;
}
```

**拡張後:**

```typescript
export interface Settlement {
  month: string;
  // Household（既存）
  total_household: number;
  paid_by_a_household: number;
  paid_by_b_household: number;
  balance_a: number;
  ratio_a: number;
  ratio_b: number;
  // Personal（新規）
  paid_by_a_personal: number;
  paid_by_b_personal: number;
}
```

**計算フィールド（フロントエンドで算出）:**

```typescript
interface UserExpenseBreakdown {
  total: number; // household + personal
  household: number; // from Settlement
  personal: number; // from Settlement
}
```

### 4.2 サンプルデータ

**典型ケース1: Household支出のみ**

```json
{
  "month": "2025-01",
  "total_household": 100000,
  "paid_by_a_household": 60000,
  "paid_by_b_household": 40000,
  "balance_a": 10000,
  "ratio_a": 50,
  "ratio_b": 50,
  "paid_by_a_personal": 0,
  "paid_by_b_personal": 0
}
```

**典型ケース2: Household + Personal**

```json
{
  "month": "2025-01",
  "total_household": 100000,
  "paid_by_a_household": 60000,
  "paid_by_b_household": 40000,
  "balance_a": 10000,
  "ratio_a": 50,
  "ratio_b": 50,
  "paid_by_a_personal": 15000,
  "paid_by_b_personal": 8000
}
```

**境界ケース: Personal支出のみ**

```json
{
  "month": "2025-01",
  "total_household": 0,
  "paid_by_a_household": 0,
  "paid_by_b_household": 0,
  "balance_a": 0,
  "ratio_a": 50,
  "ratio_b": 50,
  "paid_by_a_personal": 20000,
  "paid_by_b_personal": 15000
}
```

---

## 5. API仕様

### 5.1 エンドポイント

既存API関数 `getSettlementData(targetMonth)` を拡張

**変更内容:**

- Personal支出の集計クエリを追加
- `Settlement`型の拡張フィールドを返却

**リクエスト:**

```typescript
// 変更なし
await getSettlementData(targetMonth: string)
```

**レスポンス:**

```typescript
{
  settlement: {
    month: "2025-01",
    total_household: 100000,
    paid_by_a_household: 60000,
    paid_by_b_household: 40000,
    balance_a: 10000,
    ratio_a: 50,
    ratio_b: 50,
    paid_by_a_personal: 15000,  // 新規
    paid_by_b_personal: 8000     // 新規
  },
  userAName: "Taro",
  userBName: "Hanako"
}
```

### 5.2 データ取得ロジック

**Personal支出の集計SQL:**

```sql
-- UserAのPersonal支出
SELECT COALESCE(SUM(amount), 0) as paid_by_a_personal
FROM transactions
WHERE group_id = $1
  AND DATE_TRUNC('month', date) = $2
  AND actual_payer_user_id = $3
  AND expense_type = 'Personal';

-- UserBのPersonal支出（同様）
```

**Laws準拠:**

- L-BR-003: `expense_type = 'Personal'` のみを集計
- L-BR-004: `DATE_TRUNC('month', date)` で月次集計

---

## 6. UI仕様

### 6.1 コンポーネント構造

**配置:**
`SettlementSummary.tsx` の「個人の支払い」セクションを以下に置き換え:

```tsx
<section className="settlement-personal-expenses">
  <h3>個人の支出</h3>

  {/* UserA */}
  <div className="user-expense-card">
    <button onClick={() => toggleBreakdown("userA")}>
      <div className="user-info">
        <p className="user-name">{userAName}</p>
        <p className="total-amount">{formatCurrency(totalA)}</p>
        <ChevronIcon expanded={breakdownVisible.userA} />
      </div>
    </button>

    {breakdownVisible.userA && (
      <div className="expense-breakdown">
        <div className="breakdown-item">
          <span>家計支出</span>
          <span>{formatCurrency(settlement.paid_by_a_household)}</span>
        </div>
        <div className="breakdown-item">
          <span>
            個人支出
            <Tooltip text="個人で消費した支出です。精算計算には含まれません。" />
            <Badge variant="info">精算対象外</Badge>
          </span>
          <span>{formatCurrency(settlement.paid_by_a_personal)}</span>
        </div>
      </div>
    )}
  </div>

  {/* UserB（同様の構造） */}
  <div className="user-expense-card">{/* ... */}</div>
</section>
```

### 6.2 デザイン仕様

**カードスタイル:**

- Border: `border-gray-200`
- Padding: `p-4`
- Hover: `hover:bg-gray-50` (クリック可能を示唆)
- Transition: `transition-all duration-200`

**展開アニメーション:**

- Height: `max-h-0` → `max-h-[200px]`
- Opacity: `opacity-0` → `opacity-100`
- Duration: `200ms`

**Badge:**

- 背景色: `bg-blue-50`
- 文字色: `text-blue-700`
- サイズ: `text-xs px-2 py-1`

**Tooltip:**

- 配置: `bottom` または `top`（画面端を考慮）
- 最大幅: `max-w-xs`
- 背景: `bg-gray-900/90`

### 6.3 L-LC-004準拠の文言

**使用文言:**

- ✓ 「個人の支出」
- ✓ 「家計支出」
- ✓ 「個人支出」
- ✓ 「精算対象外」
- ✓ 「個人で消費した支出です。精算計算には含まれません。」

**禁止表現（使用しない）:**

- ✗ 「損する」「もったいない」
- ✗ 「今すぐ確認」「急いで」
- ✗ 「完璧」「絶対」
- ✗ 「主婦向け」等の差別表現

---

## 7. 非機能要件

### 7.1 セキュリティ要件

| 項目       | 要件                           | Law参照  |
| ---------- | ------------------------------ | -------- |
| 認証       | ログイン必須                   | L-SC-001 |
| 認可       | グループメンバーのみアクセス可 | L-SC-001 |
| レート制限 | 100 req/min                    | L-SC-004 |
| CSRF       | トークン検証（既存実装）       | L-SC-005 |

### 7.2 パフォーマンス要件

| 項目                   | 目標値                      | Law参照  |
| ---------------------- | --------------------------- | -------- |
| クリックフィードバック | 100ms以内にローディング表示 | L-CX-004 |
| データ取得             | 3秒以内にレスポンス         | L-CX-004 |
| アニメーション         | 60fps維持                   | -        |

### 7.3 キャッシュ戦略

**変更なし:**

- 既存の `CACHE_TAGS.settlement` を使用
- `revalidateTag()` で月次データ更新時に無効化

---

## 8. テスト要件（L-TA-001準拠）

### 8.1 典型ケース（Typical）

| ID      | 概要                   | 検証内容                     |
| ------- | ---------------------- | ---------------------------- |
| TYP-001 | Household支出のみ      | Personal=0で総支出=Household |
| TYP-002 | Household+Personal両方 | 総支出=Household+Personal    |
| TYP-003 | Personal支出のみ       | Household=0、総支出=Personal |

### 8.2 境界ケース（Boundary）

| ID      | 概要                   | 検証内容               |
| ------- | ---------------------- | ---------------------- |
| BND-001 | 支出0件                | 全て¥0表示、エラーなし |
| BND-002 | 片方のみPersonal支出   | もう片方はPersonal=0   |
| BND-003 | 上限値（10,000,000円） | 正しくフォーマット     |

### 8.3 事故ケース（Incident）

| ID      | 概要                             | 検証内容                        |
| ------- | -------------------------------- | ------------------------------- |
| INC-001 | Personal支出が精算計算に含まれる | balance_aにPersonalが影響しない |

### 8.4 グレーケース（Gray）

| ID      | 概要                      | 検証内容             |
| ------- | ------------------------- | -------------------- |
| GRY-001 | expense_type未設定        | Personal=0として扱う |
| GRY-002 | actual_payer_user_id=null | 集計から除外         |

### 8.5 攻撃ケース（Attack）

| ID      | 概要                     | 検証内容                   |
| ------- | ------------------------ | -------------------------- |
| ATK-001 | 他グループデータアクセス | 403エラー                  |
| ATK-002 | 不正な月形式             | 400エラー+明確なメッセージ |
| ATK-003 | レート制限超過           | 429エラー                  |

---

## 9. Laws準拠マトリクス

| Law ID   | 適用内容                   | 実装箇所                      | 検証方法         |
| -------- | -------------------------- | ----------------------------- | ---------------- |
| L-BR-003 | Personal支出は精算対象外   | getSettlementData（集計分離） | Unit test        |
| L-BR-004 | 月次集計ルール             | SQL（DATE_TRUNC）             | Integration test |
| L-CX-002 | 金額表示フォーマット統一   | formatCurrency()              | E2E test         |
| L-CX-003 | エラーメッセージの明確性   | API応答                       | E2E test         |
| L-CX-004 | フィードバック即応性       | UI状態管理                    | E2E test         |
| L-LC-004 | 禁止表現の回避             | UI文言                        | Manual review    |
| L-AS-001 | レスポンス標準フォーマット | API応答                       | Integration test |
| L-SC-001 | 認証・認可                 | getSettlementData             | E2E test         |
| L-SC-004 | レート制限                 | Middleware                    | E2E test         |
| L-TA-001 | 評価データセットカテゴリ   | テストスイート                | Test coverage    |

---

## 10. 実装タスク分解

### Phase 1: データ層（優先度: High）

1. **Settlement型拡張**
   - `src/types/settlement.ts` に `paid_by_a_personal`, `paid_by_b_personal` 追加
   - **ファイル**: `src/types/settlement.ts`

2. **Personal支出集計SQL**
   - `getSettlementData` 内にPersonal支出集計クエリ追加
   - **ファイル**: `src/app/dashboard/actions.ts`
   - **Laws**: L-BR-003, L-BR-004

3. **データ取得関数更新**
   - 既存クエリと並列実行
   - エラーハンドリング追加
   - **ファイル**: `src/app/dashboard/actions.ts`

### Phase 2: UI層（優先度: High）

4. **SettlementSummary.tsx更新**
   - 総支出計算ロジック追加
   - 内訳パネルコンポーネント実装
   - ドリルダウン状態管理（useState）
   - **ファイル**: `src/components/SettlementSummary.tsx`
   - **Laws**: L-CX-002, L-LC-004

5. **スタイリング**
   - カードデザイン
   - 展開アニメーション
   - Badgeコンポーネント
   - **ファイル**: `src/components/SettlementSummary.tsx`

6. **Tooltipコンポーネント**
   - 既存または新規作成
   - **ファイル**: `src/components/Tooltip.tsx` (必要に応じて)

### Phase 3: テスト（優先度: High）

7. **Unit test**
   - Personal支出集計ロジック
   - **ファイル**: `src/app/dashboard/actions.test.ts`
   - **Laws**: L-TA-001

8. **Integration test**
   - getSettlementData全体
   - **ファイル**: `src/app/dashboard/actions.integration.test.ts`

9. **E2E test**
   - DASH-001〜DASH-005
   - **ファイル**: `e2e/dashboard.spec.ts`
   - **Laws**: L-TA-001, L-TA-003

---

## 11. Laws問題チェック

### 確認済みLaws

- ✓ L-BR-003: Personal支出は精算対象外（仕様に明記、テストで検証）
- ✓ L-BR-004: 月次集計ルール適用
- ✓ L-CX-002: UI表示の一貫性（金額フォーマット）
- ✓ L-CX-003: エラーメッセージの明確性
- ✓ L-CX-004: フィードバック即応性
- ✓ L-LC-004: 禁止表現の回避
- ✓ L-AS-001: レスポンス標準フォーマット
- ✓ L-SC-001: 認証・認可
- ✓ L-SC-004: レート制限
- ✓ L-TA-001: 評価データセットカテゴリ

### Laws衝突・不在

**検出なし**

---

## 12. リスク分析

### 技術リスク

| リスク                           | 影響度 | 発生確率 | 対策                                    |
| -------------------------------- | ------ | -------- | --------------------------------------- |
| Personal支出が精算計算に混入     | 高     | 低       | L-BR-003準拠テスト（INC-001）で検証     |
| パフォーマンス劣化（追加クエリ） | 中     | 低       | 並列クエリ実行、インデックス確認        |
| expense_type未設定レガシーデータ | 中     | 中       | GRY-001でテスト、デフォルト値=Household |

### UXリスク

| リスク                     | 影響度 | 発生確率 | 対策                        |
| -------------------------- | ------ | -------- | --------------------------- |
| ドリルダウンが見つけにくい | 低     | 中       | Chevronアイコンで視覚的示唆 |
| Personal支出の意味が不明瞭 | 中     | 高       | Tooltip+Badgeで説明         |

---

## 13. 成果物チェックリスト

- [x] ユーザーストーリー定義
- [x] 受け入れ条件（AC-001〜AC-005）
- [x] データモデル設計
- [x] API仕様
- [x] UI仕様（コンポーネント構造+デザイン）
- [x] Laws準拠マトリクス
- [x] テスト要件（L-TA-001準拠）
- [x] 実装タスク分解
- [x] リスク分析

---

## 14. 次フェーズへの引き継ぎ

**Delivery Agent (DA) への指示:**

1. 上記「実装タスク分解」に従って実装
2. Laws準拠マトリクスを遵守
3. テストケースTYP-001〜ATK-003を全て実装
4. コミット前に `npm run lint` と `npm run type-check` 実行

**重要事項:**

- Personal支出は精算計算に**絶対に**含めない（L-BR-003）
- UI文言は必ずL-LC-004をチェック
- E2Eテストで AC-001〜AC-005 を全て検証

---

**仕様策定完了: 2026-01-12**
