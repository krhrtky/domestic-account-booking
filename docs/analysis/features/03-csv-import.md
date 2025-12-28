# 機能仕様書: CSVインポート

## 概要

銀行口座やクレジットカードの明細CSVをアップロードし、取引データとして取り込む機能。
エンコーディング自動検出、列マッピング、セキュリティ対策を含む。

## 機能一覧

| 機能ID | 機能名 | 実装ファイル | 状態 |
|--------|--------|-------------|------|
| CSV-001 | ファイル選択 | `src/components/transactions/CSVUploadForm.tsx` | 実装済み |
| CSV-002 | エンコーディング検出 | `src/lib/encoding.ts` | 実装済み |
| CSV-003 | ヘッダー検出 | `src/lib/csv-parser.ts:detectHeaders()` | 実装済み |
| CSV-004 | 列マッピング | `src/components/transactions/ColumnMappingForm.tsx` | 実装済み |
| CSV-005 | データプレビュー | `src/components/transactions/TransactionPreview.tsx` | 実装済み |
| CSV-006 | 機密情報フィルタ | `src/lib/csv-parser.ts:filterSensitiveColumns()` | 実装済み |
| CSV-007 | Formula Injection対策 | `src/lib/csv-parser.ts:sanitizeCSVField()` | 実装済み |
| CSV-008 | 支払元選択 | `src/components/transactions/PayerSelect.tsx` | 実装済み |
| CSV-009 | インポート実行 | `app/actions/transactions.ts:uploadCSV()` | 実装済み |

## ユースケース

### UC-CSV-001: CSVファイルアップロード

**アクター**: グループメンバー

**事前条件**:
- ユーザーがログインしている
- ユーザーがグループに所属している
- 有効なCSVファイルがある

**フロー**:
1. ユーザーがアップロードページ（`/dashboard/transactions/upload`）にアクセス
2. ファイル選択ボタンをクリック
3. CSVファイルを選択
4. システムがエンコーディングを検出（UTF-8/Shift_JIS/EUC-JP）
5. システムがCSVをパース
6. 列マッピング画面が表示される
7. ユーザーが列の対応を確認・調整
8. 「プレビューを表示」ボタンをクリック
9. データプレビュー画面が表示される
10. デフォルト支払元を選択（UserA/UserB/Common）
11. 必要に応じて個別行の支払元を変更
12. 「インポート実行」ボタンをクリック
13. システムがトランザクションを保存
14. 成功メッセージが表示され、取引一覧にリダイレクト

**事後条件**:
- 取引データがデータベースに保存されている
- すべての取引がデフォルトで「Household」タイプ

**異常系**:
- E1: ファイルが5MBを超える → エラー「ファイルサイズが5MBを超えています」
- E2: 行数が10,000を超える → エラー「行数が上限(10,000行)を超えています」
- E3: 必須列が見つからない → エラー「必須列（日付、金額、摘要）が見つかりません」
- E4: CSVパースエラー → エラー「CSVの形式が正しくありません」
- E5: レート制限超過 → エラー「CSV取り込みの試行回数が上限を超えました」

### UC-CSV-002: 列マッピング調整

**アクター**: グループメンバー

**事前条件**:
- CSVファイルがアップロードされている
- 列マッピング画面が表示されている

**フロー**:
1. システムが自動検出した列マッピングを表示
2. ユーザーが各列（日付、金額、摘要、支払者）に対応するCSV列を選択
3. 「プレビューを表示」をクリック

**自動検出対応パターン**:

| 対象列 | 検出パターン |
|--------|-------------|
| 日付 | date, 日付, 利用日, ご利用日, 取引日, お取引日 |
| 金額 | amount, 金額, ご利用金額, 支払金額, 利用金額 |
| 摘要 | description, 摘要, 内容, 店名, 商品名, 利用先 |
| 支払者 | payer, 支払者, User, ユーザー, 名前 |

### UC-CSV-003: 個別支払元設定

**アクター**: グループメンバー

**事前条件**:
- プレビュー画面が表示されている

**フロー**:
1. プレビューテーブルで各行の支払元が表示される
2. ユーザーが個別の行の支払元をドロップダウンから変更
3. 変更が即座にプレビューに反映

**選択可能な支払元**:
- UserA（User Aの名前で表示）
- UserB（User Bの名前で表示）
- Common（共通口座）

## データモデル

```typescript
interface ParsedTransaction {
  date: string          // YYYY-MM-DD形式
  description: string   // 摘要（サニタイズ済み）
  amount: number        // 金額（絶対値）
  source_file_name: string // 元ファイル名
  payer_name?: string   // CSV内の支払者名（オプション）
}

interface ColumnMapping {
  dateColumn: string | null
  amountColumn: string | null
  descriptionColumn: string | null
  payerColumn: string | null
}

type ParseResult =
  | { success: true; data: ParsedTransaction[]; warnings?: string[] }
  | { success: false; errors: string[]; warnings?: string[] }
```

## セキュリティ対策

### 機密情報フィルタリング

以下のパターンにマッチする列は自動的に除外:
- カード番号 / card number
- 口座番号 / account number
- 暗証番号 / PIN
- CVV / CVC
- 会員番号 / member number
- 残高

### Formula Injection対策

以下の文字で始まるフィールドはシングルクォートでプレフィックス:
- `=`（数式）
- `+`（プラス記号）
- `-`（マイナス記号）
- `@`（アットマーク）

### Newline Injection対策

フィールド内の改行文字（`\r`, `\n`）を削除。

## 制限事項

| 項目 | 制限値 | 根拠 |
|------|--------|------|
| ファイルサイズ | 5MB | L-RV-002 |
| 行数 | 10,000行 | L-RV-002 |
| レート制限 | 10回/分 | L-SC-004 |

## 対応エンコーディング

| エンコーディング | 用途 |
|-----------------|------|
| UTF-8 | 標準（BOMあり/なし対応） |
| Shift_JIS | 日本のWindows環境CSV |
| EUC-JP | Unix系環境 |

## 関連ルール

- L-BR-006: CSVインポートルール
- L-LC-001: 個人情報取り扱い
- L-SC-002: CSV Injection対策
- L-SC-004: レート制限
