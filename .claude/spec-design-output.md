# 仕様書: /dashboard/transactions フィルター機能修正

## メタ情報

- **ワークフローID**: wf-transaction-filter-fix-20260112
- **Laws適用**: 有効
- **作成日**: 2026-01-12
- **対象画面**: /dashboard/transactions
- **影響範囲**: フィルター機能(支払者フィルター)

## 1. GAP分析

### ユーザーストーリー

ユーザーは一覧の「支払者」によって、一覧をフィルターできる

### 現状の問題

**問題箇所:** `app/actions/transactions.ts` Line 422

```typescript
if (payerType) {
  conditions.push(eq(transactionsTable.payerType, payerType));
  // ↑ 誤り: payerType を使用
}
```

**正しい実装:**

```typescript
if (payerType) {
  conditions.push(eq(transactionsTable.actualPayerType, payerType));
  // ↑ 正しい: actualPayerType を使用
}
```

### GAP(問題の本質)

| 項目           | 期待値                   | 現状                          | GAP                              |
| -------------- | ------------------------ | ----------------------------- | -------------------------------- |
| フィルター対象 | actual_payer_type        | payer_type                    | 誤ったフィールドを参照           |
| ユーザー意図   | 現在の支払者でフィルター | CSV取り込み時の値でフィルター | ユーザー編集後の値が反映されない |
| 整合性         | 精算計算と一致           | 精算計算と不一致              | データ整合性欠如                 |

**データモデル確認:**

- `payer_type`: CSV取り込み時のソース支払元(履歴用)
- `actual_payer_type`: 実際の支払元(精算計算で使用)

**業務ルール参照:** L-BR-002

## 2. 根本原因

1. 命名の類似性による混同 - `payerType` と `actualPayerType` の選択ミス
2. L-BR-002の理解不足 - actualが優先されることの見落とし
3. 検証不足 - フィルター動作テストが存在しない

## 3. 機能要件

### スコープ

**実装する:**

- actual_payer_type によるフィルター処理
- 既存UIの維持(ラベル・選択肢は変更不要)

**実装しない:**

- actual_payer_user_id によるユーザー名フィルター(将来拡張)
- payer_type フィールドの削除(CSV取り込み履歴として保持)
- UI変更

## 4. API仕様

### 変更箇所: `app/actions/transactions.ts`

**変更前 (Line 421-423):**

```typescript
if (payerType) {
  conditions.push(eq(transactionsTable.payerType, payerType));
}
```

**変更後:**

```typescript
if (payerType) {
  conditions.push(eq(transactionsTable.actualPayerType, payerType));
}
```

**影響範囲:** 1行のみの変更、後方互換性あり

## 5. Laws準拠マトリクス

| Law ID   | カテゴリ     | 適用内容                     | 準拠状況 |
| -------- | ------------ | ---------------------------- | -------- |
| L-BR-002 | 業務ルール   | actualPayerTypeを使用        | 準拠     |
| L-CX-001 | 顧客体験     | 精算計算と同じフィールド使用 | 準拠     |
| L-CX-004 | 顧客体験     | 100ms以内のUI応答            | 準拠     |
| L-AS-001 | API仕様      | success/data構造維持         | 準拠     |
| L-SC-001 | セキュリティ | 認証・認可                   | 準拠     |
| L-OC-001 | 組織一貫性   | Drizzle ORM使用              | 準拠     |

**Laws違反:** なし

## 6. 受け入れ条件

### AC-001: actualPayerTypeでフィルターされる (L-BR-002)

Given: グループに以下の取引が存在

- Transaction A: payer_type="UserA", actual_payer_type="UserB"
- Transaction B: payer_type="UserB", actual_payer_type="UserA"
- Transaction C: payer_type="UserA", actual_payer_type="UserA"

When: 支払者フィルターで "User A" を選択

Then:

- Transaction B と Transaction C が表示される
- Transaction A は表示されない(actual_payer_type="UserB")

### AC-002: 精算計算との整合性 (L-CX-001)

Given: 2026-01月の取引が存在
When: 支払者フィルターで "User A" を選択し合計金額を計算
Then: 合計金額が精算結果画面の "User Aが支払った家計費" と一致する

### AC-003: 既存のテストが通過する (L-TA-002)

Given: 既存のテストスイート
When: npm test を実行
Then: すべてのユニットテストが通過する

## 7. テスト要件 (L-TA-001)

### Typical Cases(典型ケース)

| ID      | 説明              | 入力                | 期待出力                            |
| ------- | ----------------- | ------------------- | ----------------------------------- |
| TYP-001 | UserAでフィルター | payerType="UserA"   | actual_payer_type="UserA"の取引のみ |
| TYP-002 | UserBでフィルター | payerType="UserB"   | actual_payer_type="UserB"の取引のみ |
| TYP-003 | フィルター未指定  | payerType=undefined | すべての取引                        |

### Boundary Cases(境界ケース)

| ID      | 説明               | 入力              | 期待出力     |
| ------- | ------------------ | ----------------- | ------------ |
| BND-001 | 取引0件            | payerType="UserA" | 空配列       |
| BND-002 | 全取引が同一支払者 | payerType="UserA" | すべての取引 |

### Incident Cases(事故ケース)

| ID      | 説明                    | 入力                                                             | 期待出力             |
| ------- | ----------------------- | ---------------------------------------------------------------- | -------------------- |
| INC-001 | payer編集後のフィルター | payer_type="UserA", actual_payer_type="UserB"でpayerType="UserB" | その取引が表示される |

### Attack Cases(攻撃ケース)

| ID      | 説明                    | 入力                             | 期待出力                |
| ------- | ----------------------- | -------------------------------- | ----------------------- |
| ATK-001 | SQLインジェクション試行 | payerType="UserA'; DROP TABLE--" | Zodバリデーションで拒否 |
| ATK-002 | 不正なpayerType         | payerType="Common"               | Zodバリデーションで拒否 |

## 8. 実装タスク提案

### Task 1: コード修正(5分)

File: app/actions/transactions.ts
Line: 422
Change:
From: eq(transactionsTable.payerType, payerType)
To: eq(transactionsTable.actualPayerType, payerType)

### Task 2: テスト追加(30分)

File: app/actions/**tests**/transactions.test.ts (新規作成)
Test Cases: TYP-001, TYP-002, BND-001, INC-001, ATK-001

### Task 3: 検証(15分)

Steps:

1. 取引を作成(actual_payer_typeを編集)
2. フィルターを適用
3. 精算画面と照合

## 9. 次のステップ

この仕様を **Delivery Agent (DA)** に引き渡して実装を依頼してください。

**実装ファイル:**

- `/Users/takuya.kurihara/workspace/domestic-account-booking/app/actions/transactions.ts` (Line 422)

**Laws準拠確認済み:** すべての関連Lawsに100%準拠しています。
