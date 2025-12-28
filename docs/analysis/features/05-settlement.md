# 機能仕様書: 精算計算・ダッシュボード

## 概要

家計支出を負担割合に基づいて計算し、「誰が誰にいくら支払うか」を表示する機能。
アプリケーションのコア機能。

## 機能一覧

| 機能ID | 機能名 | 実装ファイル | 状態 |
|--------|--------|-------------|------|
| STL-001 | 精算計算 | `src/lib/settlement.ts:calculateSettlement()` | 実装済み |
| STL-002 | 精算サマリー表示 | `src/components/settlement/SettlementSummary.tsx` | 実装済み |
| STL-003 | 月選択 | `src/components/settlement/MonthSelector.tsx` | 実装済み |
| STL-004 | ダッシュボード | `src/components/settlement/SettlementDashboard.tsx` | 実装済み |
| STL-005 | 精算データ取得 | `app/actions/transactions.ts:getSettlementData()` | 実装済み |

## 精算ロジック詳細

### 計算式（シンプルモデル）

```
Balance_A = PaidBy_A^{Household} - ((PaidBy_A^{Household} + PaidBy_B^{Household}) × Ratio_A)
```

### 精算方向の判定

| 条件 | 結果 |
|------|------|
| Balance_A > 0 | User BがUser Aに支払う |
| Balance_A < 0 | User AがUser Bに支払う |
| Balance_A = 0 | 精算不要 |

### 計算対象

| 支払元 | 支出タイプ | 計算対象 |
|--------|-----------|----------|
| UserA | Household | ○ PaidBy_Aに加算 |
| UserA | Personal | × 除外 |
| UserB | Household | ○ PaidBy_Bに加算 |
| UserB | Personal | × 除外 |
| Common | Household | × 除外（共通口座は精算対象外） |
| Common | Personal | × 除外 |

### 端数処理

- `Math.round()` を使用（四捨五入）
- 最小単位: 1円

## ユースケース

### UC-STL-001: 精算サマリー表示

**アクター**: グループメンバー

**事前条件**:
- ユーザーがログインしている
- ユーザーがグループに所属している

**フロー**:
1. ユーザーがダッシュボード（`/dashboard`）にアクセス
2. システムが当月の精算データを計算
3. 精算サマリーが表示される

**表示項目**:
- 対象月
- 家計の支出合計
- User Aの支払い額
- User Bの支払い額
- 共通口座からの支払い額
- 精算額（誰が誰にいくら支払うか）

**事後条件**:
- 精算結果が表示されている

### UC-STL-002: 月の切り替え

**アクター**: グループメンバー

**事前条件**:
- ダッシュボードが表示されている

**フロー**:
1. 月セレクタで対象月を変更
2. システムが選択月の精算データを計算
3. サマリーが更新される

**事後条件**:
- 選択月の精算結果が表示されている

### UC-STL-003: 精算内訳確認

**アクター**: グループメンバー

**事前条件**:
- 精算サマリーが表示されている

**フロー**:
1. 精算サマリーの「詳細を見る」をクリック（※UI確認要）
2. 内訳パネルが展開される
3. 計算の内訳が表示される

**表示項目**:
- User Aが支払った家計支出合計
- User Bが支払った家計支出合計
- User Aの負担割合
- User Bの負担割合
- 計算式の視覚化

## データモデル

```typescript
interface Settlement {
  month: string                 // YYYY-MM形式
  total_household: number       // 家計支出合計
  paid_by_a_household: number   // User A支払い額
  paid_by_b_household: number   // User B支払い額
  paid_by_common: number        // 共通口座支払い額
  balance_a: number             // User Aの収支（正:受け取り、負:支払い）
  ratio_a: number               // User A負担割合
  ratio_b: number               // User B負担割合
}
```

## バリデーション

### 負担割合の検証

```typescript
const validateRatio = (ratioA: number, ratioB: number): void => {
  if (ratioA < 0 || ratioA > 100) {
    throw new Error('負担割合Aは0〜100の範囲で入力してください')
  }
  if (ratioB < 0 || ratioB > 100) {
    throw new Error('負担割合Bは0〜100の範囲で入力してください')
  }
  if (ratioA + ratioB !== 100) {
    throw new Error('負担割合の合計は100%である必要があります')
  }
}
```

### 月フォーマットの検証

```typescript
const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const validateMonthFormat = (month: string): void => {
  if (!MONTH_FORMAT_REGEX.test(month)) {
    throw new Error('月の形式が正しくありません。YYYY-MM形式で入力してください')
  }
}
```

## 計算例

### 例1: 50:50 割合

```
User A支払い: ¥50,000
User B支払い: ¥30,000
負担割合: A 50% / B 50%

Total = ¥80,000
Balance_A = ¥50,000 - (¥80,000 × 0.5) = ¥10,000

→ User BがUser Aに¥10,000支払う
```

### 例2: 60:40 割合

```
User A支払い: ¥60,000
User B支払い: ¥40,000
負担割合: A 60% / B 40%

Total = ¥100,000
Balance_A = ¥60,000 - (¥100,000 × 0.6) = ¥0

→ 精算不要
```

### 例3: 共通口座含む

```
User A支払い: ¥30,000
User B支払い: ¥20,000
Common支払い: ¥50,000
負担割合: A 50% / B 50%

Total（精算対象）= ¥50,000  ※Commonは除外
Balance_A = ¥30,000 - (¥50,000 × 0.5) = ¥5,000

→ User BがUser Aに¥5,000支払う
```

## 表示フォーマット

| 項目 | フォーマット | 例 |
|------|------------|-----|
| 金額 | ¥{カンマ区切り} | ¥10,000 |
| 割合 | {数値}% | 60% |
| 月 | YYYY年MM月 | 2025年01月 |

## 関連ルール

- L-BR-001: 精算計算ルール
- L-BR-002: 支払元ルール
- L-BR-003: 支出タイプルール
- L-CX-001: 精算精度
- L-CX-002: UI表示一貫性
- L-OC-002: 精算ロジック一元化
