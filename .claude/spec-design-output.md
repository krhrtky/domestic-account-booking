# 仕様策定: CSVカラム自動検出パターンの拡張

## メタ情報

- **ワークフローID**: wf-csv-detection-enhancement-20260112
- **策定日**: 2026-01-12
- **Laws準拠モード**: 汎用モード (`laws_enabled: false`)
- **前回ワークフロー**: wf-csv-column-mapping-20260112
- **関連Laws**: L-BR-006 (CSV Import Rules)

---

## 1. スコープ

### IN スコープ

- クレジットカード会社の一般的なCSV形式への対応
- 日付・金額・摘要の検出パターン拡張
- 既存テストの後方互換性保証
- 新規パターンのテストケース追加

### OUT スコープ

- カラムマッピングUIの変更（既に実装済み）
- パターンマッチングアルゴリズムの根本的変更
- ユーザー定義パターンの追加機能
- 多言語対応（英語・日本語以外）

---

## 2. 問題定義

### 現状

実際のクレジットカードCSVをアップロードすると「必須列（日付、金額）が見つかりません」エラーが発生。

**実際のCSVヘッダー例**:
```csv
ご利用年月日,ご利用箇所,ご利用額,払戻額,ご請求額（うち手数料・利息）,...
```

### 原因

`src/lib/csv-parser.ts` の検出パターンが不完全:

| 種別 | 実際のヘッダー | 現在のパターン | マッチ状況 |
|------|--------------|--------------|----------|
| 日付 | `ご利用年月日` | `ご利用日` | ❌ 不一致 |
| 金額 | `ご利用額` | `ご利用金額` | ❌ 不一致 |
| 摘要 | `ご利用箇所` | `ご利用店名` | ❌ 不一致 |

### 根本原因分析

パターンマッチングは `includes()` を使用しているが、パターンリストに含まれていない:

```typescript
// 現在のロジック (L-87)
return headers.findIndex((h) =>
  datePatterns.some((p) => h.toLowerCase().includes(p.toLowerCase()))
)
```

- `'ご利用日'.includes('ご利用年月日')` → `false`
- `'ご利用金額'.includes('ご利用額')` → `false`
- `'ご利用店名'.includes('ご利用箇所')` → `false`

逆のマッチングではないため、短いパターンでは長いヘッダーを捕捉できない。

---

## 3. ユーザーストーリー

### US-001: クレジットカードCSVのスムーズなインポート

**As a** 家計精算アプリのユーザー  
**I want to** 様々なクレジットカード会社のCSVをアップロードできる  
**So that** 「必須列が見つかりません」エラーに遭遇せず、データを取り込める

**受け入れ条件**:
- AC-001: `ご利用年月日` が日付カラムとして検出される
- AC-002: `ご利用額` が金額カラムとして検出される
- AC-003: `ご利用箇所` が摘要カラムとして検出される
- AC-004: 既存のCSV形式（`ご利用日`, `ご利用金額`, `ご利用店名`）も引き続き動作する

---

## 4. API/データモデル仕様

### 4.1 変更対象

**ファイル**: `src/lib/csv-parser.ts`

**関数**: 
- `detectDateColumn(headers: string[]): number` (L-75)
- `detectAmountColumn(headers: string[]): number` (L-110)
- `detectDescriptionColumn(headers: string[]): number` (L-92)

### 4.2 追加パターン

#### 日付パターン

```typescript
const datePatterns = [
  'date',
  '日付',
  '利用日',
  'ご利用日',
  'ご利用年月日',      // ← 追加
  '年月日',           // ← 追加
  'データ処理日',
  '取引日',
  'お取引日',
  '引落日',
  '発生日',
]
```

#### 金額パターン

```typescript
const amountPatterns = [
  'amount',
  '金額',
  'ご利用金額',
  'ご利用額',         // ← 追加
  '利用額',           // ← 追加
  '支払金額',
  '利用金額',
  'お支払金額',
  '預かり金額',
  '引出金額',
  '預入金額',
]
```

#### 摘要パターン

```typescript
const descPatterns = [
  'description',
  '摘要',
  '内容',
  '店名',
  '商品名',
  '利用先',
  'ご利用内容',
  'ご利用箇所',       // ← 追加
  '利用箇所',         // ← 追加
  '摘要内容',
  'お取引内容',
  'ご利用店名',
]
```

### 4.3 パターン優先順位

パターン配列の順序は検出優先度を表す:

1. **より具体的なパターンを前に配置**
   - `'ご利用年月日'` → `'ご利用日'` → `'年月日'` → `'日付'`
   - `'ご利用金額'` → `'ご利用額'` → `'利用額'` → `'金額'`

2. **理由**: 複数マッチ時は最初にマッチしたものを採用
   - 例: `'年月日'` と `'日付'` が両方存在する場合、`'年月日'` が優先

### 4.4 非機能要件

| 要件 | 値 | 検証方法 |
|------|-----|---------|
| パフォーマンス | パターン追加による処理時間増加 < 5% | ベンチマークテスト |
| 後方互換性 | 既存テスト100% PASS | 回帰テスト |
| カバレッジ | 新規パターンのカバレッジ 100% | ユニットテスト |

---

## 5. Laws準拠確認

### L-BR-006: CSV Import Rules

#### 対応フォーマット

| 項目 | 要件 | 準拠状況 |
|------|------|---------|
| 文字コード | UTF-8（BOMあり/なし両対応） | ✓ 準拠 (既存) |
| 区切り文字 | カンマ（,） | ✓ 準拠 (既存) |
| ヘッダー行 | 必須 | ✓ 準拠 (既存) |
| 必須列 | 日付, 金額 | ✓ 今回拡張で対応 |
| 推奨列 | 摘要/メモ | ✓ 今回拡張で対応 |

#### 列マッピング (拡張)

| CSVヘッダー例 | マッピング先 | 変更 |
|--------------|-------------|------|
| 日付, 利用日, Date | date | 既存 |
| **ご利用年月日, 年月日** | date | **新規** |
| 金額, 利用金額, Amount | amount | 既存 |
| **ご利用額, 利用額** | amount | **新規** |
| 摘要, 内容, メモ, Description | description | 既存 |
| **ご利用箇所, 利用箇所** | description | **新規** |

### L-LC-001: PII Handling in CSV

機密情報列の自動除外パターンは変更なし（既存実装を維持）。

### L-SC-002: CSV Injection Prevention

サニタイゼーション処理は変更なし（既存実装を維持）。

---

## 6. 受け入れ条件（詳細）

### AC-001: ご利用年月日の検出

**Given**: CSVに `ご利用年月日` 列が存在する  
**When**: `detectHeaders()` を実行  
**Then**: `suggestedMapping.dateColumn` が `'ご利用年月日'` になる

**検証方法**: ユニットテスト  
**テストケースID**: DETECT-DATE-001

```typescript
it('detects ご利用年月日 column as date', async () => {
  const { detectHeaders } = await import('./csv-parser')
  const csvContent = `ご利用年月日,金額,摘要
2025-01-15,5400,スーパー`

  const result = detectHeaders(csvContent)

  if ('headers' in result) {
    expect(result.suggestedMapping.dateColumn).toBe('ご利用年月日')
  }
})
```

### AC-002: ご利用額の検出

**Given**: CSVに `ご利用額` 列が存在する  
**When**: `detectHeaders()` を実行  
**Then**: `suggestedMapping.amountColumn` が `'ご利用額'` になる

**検証方法**: ユニットテスト  
**テストケースID**: DETECT-AMOUNT-001

```typescript
it('detects ご利用額 column as amount', async () => {
  const { detectHeaders } = await import('./csv-parser')
  const csvContent = `日付,ご利用額,摘要
2025-01-15,5400,スーパー`

  const result = detectHeaders(csvContent)

  if ('headers' in result) {
    expect(result.suggestedMapping.amountColumn).toBe('ご利用額')
  }
})
```

### AC-003: ご利用箇所の検出

**Given**: CSVに `ご利用箇所` 列が存在する  
**When**: `detectHeaders()` を実行  
**Then**: `suggestedMapping.descriptionColumn` が `'ご利用箇所'` になる

**検証方法**: ユニットテスト  
**テストケースID**: DETECT-DESC-001

```typescript
it('detects ご利用箇所 column as description', async () => {
  const { detectHeaders } = await import('./csv-parser')
  const csvContent = `日付,金額,ご利用箇所
2025-01-15,5400,スーパー`

  const result = detectHeaders(csvContent)

  if ('headers' in result) {
    expect(result.suggestedMapping.descriptionColumn).toBe('ご利用箇所')
  }
})
```

### AC-004: 後方互換性

**Given**: 既存のCSV形式（`ご利用日`, `ご利用金額`, `ご利用店名`）  
**When**: `detectHeaders()` を実行  
**Then**: 引き続き正しく検出される

**検証方法**: 回帰テスト（既存テストスイート）  
**テストケースID**: REGRESSION-001

```bash
npm test -- csv-parser.test.ts
```

**期待結果**: 全テストPASS

### AC-005: 実際のクレジットカードCSV形式

**Given**: ユーザー報告の実際のCSV  
**When**: `parseCSV()` を実行  
**Then**: エラーなくパースされる

**検証方法**: 統合テスト  
**テストケースID**: INTEGRATION-CARD-001

```typescript
it('parses real credit card CSV format', async () => {
  const csvContent = `ご利用年月日,ご利用箇所,ご利用額,払戻額
2025/01/15,スーパーXYZ,10000,0
2025/01/20,カフェABC,1500,0`

  const result = await parseCSV(csvContent, 'real-card.csv')

  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).toHaveLength(2)
    expect(result.data[0].date).toBe('2025-01-15')
    expect(result.data[0].amount).toBe(10000)
    expect(result.data[0].description).toBe('スーパーXYZ')
  }
})
```

---

## 7. テスト要件

### 7.1 評価データセット分類

#### 典型ケース (Typical Cases)

| ケース | 入力 | 期待出力 |
|--------|------|---------|
| TYP-001 | `ご利用年月日` 列 | 日付として検出 |
| TYP-002 | `ご利用額` 列 | 金額として検出 |
| TYP-003 | `ご利用箇所` 列 | 摘要として検出 |
| TYP-004 | 3列すべて存在 | 全列が正しく検出 |

#### 境界ケース (Boundary Cases)

| ケース | 入力 | 期待出力 |
|--------|------|---------|
| BND-001 | `年月日` 列のみ（`ご利用年月日` なし） | `年月日` を日付として検出 |
| BND-002 | `利用額` 列のみ（`ご利用額` なし） | `利用額` を金額として検出 |
| BND-003 | `利用箇所` 列のみ（`ご利用箇所` なし） | `利用箇所` を摘要として検出 |
| BND-004 | 複数の日付候補列が存在 | 最初にマッチした列を採用 |

#### 事故ケース (Incident Cases)

| ケース | 過去のバグ | 期待動作 |
|--------|----------|---------|
| INC-001 | ユーザー報告: 「必須列が見つかりません」エラー | エラーが発生しない |
| INC-002 | - | （該当なし） |

#### グレーケース (Gray Cases)

| ケース | 曖昧な入力 | 期待動作 |
|--------|----------|---------|
| GRAY-001 | `ご利用年月日` と `ご利用日` 両方存在 | `ご利用年月日` を優先（配列の前方） |
| GRAY-002 | `ご利用額` と `ご利用金額` 両方存在 | `ご利用金額` を優先（配列の前方） |
| GRAY-003 | 大文字小文字混在 (`ご利用年月日` vs `ご利用年月日`) | 大小文字を無視してマッチ |

#### 攻撃ケース (Attack Cases)

| ケース | 攻撃シナリオ | 期待動作 |
|--------|------------|---------|
| ATK-001 | 機密列名パターンに類似（`ご利用額カード番号`） | `ご利用額` として検出し、`カード番号` は除外 |
| ATK-002 | 数値が巨大（列名に悪意あるスクリプト） | サニタイズされる（既存機能） |
| ATK-003 | ヘッダーに改行・特殊文字 | サニタイズされる（既存機能） |

### 7.2 カバレッジ要件

| 対象 | 目標カバレッジ |
|------|--------------|
| `detectDateColumn()` | 100% |
| `detectAmountColumn()` | 100% |
| `detectDescriptionColumn()` | 100% |
| 新規パターンのブランチ | 100% |

### 7.3 性能要件

| メトリクス | 目標 |
|----------|------|
| パターン追加による処理時間増加 | < 5% |
| 10,000行のCSVパース時間 | < 3秒 |

---

## 8. 実装タスク提案

### タスク分解

```yaml
tasks:
  - id: IMPL-001
    title: "日付パターンに 'ご利用年月日', '年月日' を追加"
    file: src/lib/csv-parser.ts
    lines: 75-90
    estimate: 5分
    
  - id: IMPL-002
    title: "金額パターンに 'ご利用額', '利用額' を追加"
    file: src/lib/csv-parser.ts
    lines: 110-125
    estimate: 5分
    
  - id: IMPL-003
    title: "摘要パターンに 'ご利用箇所', '利用箇所' を追加"
    file: src/lib/csv-parser.ts
    lines: 92-108
    estimate: 5分
    
  - id: TEST-001
    title: "典型ケースのユニットテスト追加 (TYP-001 ~ TYP-004)"
    file: src/lib/csv-parser.test.ts
    estimate: 15分
    
  - id: TEST-002
    title: "境界ケースのユニットテスト追加 (BND-001 ~ BND-004)"
    file: src/lib/csv-parser.test.ts
    estimate: 15分
    
  - id: TEST-003
    title: "グレーケースのユニットテスト追加 (GRAY-001 ~ GRAY-003)"
    file: src/lib/csv-parser.test.ts
    estimate: 15分
    
  - id: TEST-004
    title: "実際のクレジットカードCSV統合テスト (INTEGRATION-CARD-001)"
    file: src/lib/csv-parser.integration.test.ts
    estimate: 10分
    
  - id: TEST-005
    title: "回帰テスト実行 (REGRESSION-001)"
    command: npm test -- csv-parser.test.ts
    estimate: 5分
    
  - id: DOC-001
    title: "CHANGELOG.md に変更内容を記録"
    file: CHANGELOG.md
    estimate: 5分
```

**合計見積もり**: 約80分

---

## 9. 非スコープの留意事項

### 将来的に検討すべき項目

1. **ユーザー定義パターン機能**
   - 設定画面でカスタムパターンを登録
   - 優先度: 低（ユーザー要望が増えた場合）

2. **機械学習ベースのカラム検出**
   - 列名ではなく、データの内容から推論
   - 優先度: 中（精度向上が必要な場合）

3. **多言語対応（英語・日本語以外）**
   - 中国語、韓国語などのパターン
   - 優先度: 低（国際展開時）

4. **パターンマッチングのスコアリング**
   - 複数マッチ時の信頼度を数値化
   - 優先度: 中（曖昧な場合の精度向上）

---

## 10. 完了定義 (Definition of Done)

### チェックリスト

- [ ] 全ての受け入れ条件 (AC-001 ~ AC-005) をテストで検証
- [ ] 既存テストが100% PASS（回帰テスト）
- [ ] 新規テストのカバレッジが100%
- [ ] パフォーマンス要件（処理時間増加 < 5%）を満たす
- [ ] L-BR-006 に準拠していることを確認
- [ ] コードレビュー完了
- [ ] CHANGELOG.md に変更を記録

---

## 11. リスクと緩和策

| リスク | 影響度 | 確率 | 緩和策 |
|--------|-------|------|--------|
| パターン追加による既存動作の変更 | 高 | 低 | 回帰テストで検証 |
| パターン優先順位の誤り | 中 | 中 | グレーケーステストで検証 |
| パフォーマンス劣化 | 低 | 低 | ベンチマークテストで監視 |
| 新規パターンのカバレッジ不足 | 中 | 低 | カバレッジレポートで確認 |

---

## 12. 参照ドキュメント

- **Laws**: `docs/laws/08-business-rules.md` (L-BR-006)
- **ルール**: `.claude/rules/**__csv**.md`
- **既存実装**: `src/lib/csv-parser.ts` (L-75 ~ L-135)
- **既存テスト**: `src/lib/csv-parser.test.ts` (L-404 ~ L-672)
- **前回ワークフロー**: wf-csv-column-mapping-20260112

---

## 13. 承認記録

| ロール | 承認者 | 日付 | ステータス |
|--------|-------|------|----------|
| Spec Designer | Claude Sonnet 4.5 | 2026-01-12 | ✓ 策定完了 |
| Delivery Agent | - | - | 承認待ち |
| Quality Gate Agent | - | - | 承認待ち |

---

**策定完了日時**: 2026-01-12  
**次のステップ**: Delivery Agent による実装  
**想定リードタイム**: 80分
