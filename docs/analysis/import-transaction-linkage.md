# インポート項目とTransactionフィールドの連動性レポート

## 概要

CSVインポート時に割り当てる列（ColumnMapping）と、保存されるTransaction、および精算計算での使用について、データフローと役割の連動性を分析する。

---

## データフロー全体図

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CSV インポートフロー                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [CSV File]                                                                      │
│      │                                                                           │
│      ▼                                                                           │
│  ┌──────────────────┐                                                           │
│  │ Column Mapping   │ ← ユーザーが選択                                          │
│  │ (列マッピング)     │                                                           │
│  ├──────────────────┤                                                           │
│  │ dateColumn      ─┼──────┐                                                    │
│  │ amountColumn    ─┼──────┼─┐                                                  │
│  │ descriptionCol  ─┼──────┼─┼─┐                                                │
│  │ payerColumn     ─┼──────┼─┼─┼─┐ (任意)                                       │
│  └──────────────────┘      │ │ │ │                                              │
│                            ▼ ▼ ▼ ▼                                              │
│  ┌──────────────────┐                                                           │
│  │ ParsedTransaction│ ← パース結果                                              │
│  ├──────────────────┤                                                           │
│  │ date            ◀┘ │ │ │                                                     │
│  │ amount            ◀┘ │ │                                                     │
│  │ description         ◀┘ │                                                     │
│  │ payer_name            ◀┘ (任意)                                              │
│  │ source_file_name ◀── ファイル名                                              │
│  └──────────────────┘                                                           │
│          │                                                                       │
│          │ + defaultPayerType / payerTypes[]                                    │
│          ▼                                                                       │
│  ┌──────────────────┐                                                           │
│  │ Transaction (DB) │ ← 保存                                                    │
│  ├──────────────────┤                                                           │
│  │ date            ─┼──────────────────────────┐                                │
│  │ amount          ─┼──────────────────────────┤                                │
│  │ description     ─┼─────────────────────┐    │                                │
│  │ payer_type      ─┼────────────────┐    │    │                                │
│  │ payer_user_id   ─┼───────────┐    │    │    │                                │
│  │ expense_type    ─┼──────┐    │    │    │    │                                │
│  │ group_id         │      │    │    │    │    │                                │
│  │ user_id          │      │    │    │    │    │                                │
│  │ source_file_name │      │    │    │    │    │                                │
│  └──────────────────┘      │    │    │    │    │                                │
│                            │    │    │    │    │                                │
└────────────────────────────┼────┼────┼────┼────┼────────────────────────────────┘
                             │    │    │    │    │
                             ▼    ▼    ▼    ▼    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              精算計算での使用                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  calculateSettlement()                                                          │
│                                                                                  │
│  1. expense_type === 'Household' のみ対象                                       │
│  2. payer_user_id または payer_type で支払者判定                                │
│  3. date で対象月フィルタ                                                       │
│  4. amount を集計                                                               │
│  5. description は表示のみ（計算には不使用）                                     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ Settlement Result                                                       │    │
│  ├─────────────────────────────────────────────────────────────────────────┤    │
│  │ paid_by_a_household ← payer == UserA の amount 合計                    │    │
│  │ paid_by_b_household ← payer == UserB の amount 合計                    │    │
│  │ paid_by_common      ← payer == Common の amount 合計                   │    │
│  │ balance_a           ← 計算式による精算額                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 項目別連動性マトリクス

### CSVマッピング → Transaction → 精算計算

| CSV列マッピング | 必須 | ParsedTransaction | Transaction | 精算計算での役割 |
|----------------|------|-------------------|-------------|-----------------|
| `dateColumn` | ○ | `date` | `date` | 対象月フィルタ |
| `amountColumn` | ○ | `amount` | `amount` | 金額集計 |
| `descriptionColumn` | ○ | `description` | `description` | 表示のみ（計算不使用） |
| `payerColumn` | × | `payer_name` | `payer_user_id` | 支払者判定（補助） |
| （UIで選択） | ○ | — | `payer_type` | 支払者判定（主） |
| （固定値） | — | — | `expense_type` | 計算対象判定 |

---

## 各項目の詳細

### 1. 日付（dateColumn → date）

```
CSV列 "日付" / "利用日" / "Date"
        ↓
    normalizeDate()
        ↓
    Transaction.date (YYYY-MM-DD)
        ↓
    calculateSettlement() で month フィルタ
```

**役割**:
- 対象月の判定（`date.startsWith(targetMonth)`）
- 取引一覧の表示・ソート

**変換処理**:
```typescript
// src/lib/csv-parser.ts
const normalizeDate = (dateStr: string): string | null => {
  // 対応フォーマット:
  // - YYYY-MM-DD
  // - YYYY/MM/DD
  // - MM/DD/YYYY
}
```

**精算への影響**: **高**
- 月を跨いで誤って割り当てると、精算額に直接影響

---

### 2. 金額（amountColumn → amount）

```
CSV列 "金額" / "ご利用金額" / "Amount"
        ↓
    parseAmount() → 絶対値化
        ↓
    Transaction.amount (number)
        ↓
    calculateSettlement() で集計
```

**役割**:
- 精算金額の計算元データ

**変換処理**:
```typescript
// src/lib/csv-parser.ts
const parseAmount = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[,¥]/g, '').trim()
  return Math.abs(parseFloat(cleaned))  // 常に正の値
}
```

**精算への影響**: **最高**
- 金額が直接精算額に反映される
- 誤った列のマッピングは致命的

---

### 3. 摘要（descriptionColumn → description）

```
CSV列 "摘要" / "内容" / "店名"
        ↓
    sanitizeCSVField() → セキュリティ処理
        ↓
    Transaction.description (string)
        ↓
    取引一覧で表示のみ
```

**役割**:
- 取引内容の識別・表示
- ユーザーが支出タイプ判断する際の参考情報

**セキュリティ処理**:
```typescript
// Formula Injection対策
if (sanitized.startsWith('=') || sanitized.startsWith('+') ...) {
  sanitized = "'" + sanitized
}
// Newline Injection対策
sanitized = value.replace(/[\r\n]/g, '')
```

**精算への影響**: **なし**
- 計算には使用されない
- 誤マッピングでも精算額に影響なし

---

### 4. 支払者（payerColumn → payer_name → payer_user_id）

```
CSV列 "支払者" / "ユーザー" / "名前" (任意)
        ↓
    sanitizeCSVField()
        ↓
    ParsedTransaction.payer_name
        ↓
    グループメンバー名とマッチング
        ↓
    Transaction.payer_user_id (UUID or null)
```

**役割**:
- CSV内に支払者情報がある場合、自動的に支払者を判定
- グループメンバー名と一致すれば `payer_user_id` に設定

**マッチングロジック**:
```typescript
// app/actions/transactions.ts
const usersByName = new Map<string, string>()
usersResult.rows.forEach(u => {
  usersByName.set(u.name.toLowerCase(), u.id)
})

// payerColumn の値がメンバー名と一致すれば payer_user_id を設定
if (rowPayerType !== 'Common' && t.payer_name) {
  const foundUserId = usersByName.get(t.payer_name.toLowerCase())
  if (foundUserId) {
    payerUserId = foundUserId
  }
}
```

**精算への影響**: **高（間接的）**
- `payer_user_id` が設定されると、精算計算で優先的に使用
- 名前の不一致は `payer_type` にフォールバック

---

### 5. 支払元タイプ（UI選択 → payer_type）

```
プレビュー画面で選択
  ├─ defaultPayerType（一括設定）
  └─ payerTypes[]（個別設定）
        ↓
    Transaction.payer_type ('UserA' | 'UserB' | 'Common')
        ↓
    calculateSettlement() で振り分け
```

**役割**:
- 精算計算の支払者判定の主要ソース
- `payer_user_id` がない場合のフォールバック

**精算への影響**: **最高**
```typescript
// src/lib/settlement.ts
const paidByA = householdTransactions
  .filter((t) => {
    if (t.payer_user_id) {
      return t.payer_user_id === group.user_a_id  // 優先
    }
    return t.payer_type === 'UserA'  // フォールバック
  })
  .reduce((sum, t) => sum + t.amount, 0)
```

---

### 6. 支出タイプ（固定値 → expense_type）

```
インポート時: 固定で 'Household'
        ↓
    Transaction.expense_type ('Household' | 'Personal')
        ↓
    ユーザーが手動変更可能
        ↓
    calculateSettlement() でフィルタ
```

**役割**:
- 精算対象/対象外の判定

**初期値**:
```typescript
// app/actions/transactions.ts
'Household' as ExpenseType  // 全取引がデフォルトで「家計」
```

**精算への影響**: **最高**
```typescript
// src/lib/settlement.ts
const householdTransactions = transactions.filter((t) => {
  return t.expense_type === 'Household' && dateStr.startsWith(targetMonth)
})
// Personal は完全に除外される
```

---

## 連動性の問題点

### 問題1: payerColumn と payer_type の二重管理

**現状**:
```
payerColumn (CSV) → payer_name → payer_user_id
                         ↓
                    名前マッチング
                         ↓
              一致: payer_user_id 設定
              不一致: null（payer_type にフォールバック）
```

**問題点**:
- CSV内の支払者名とグループメンバー名が一致しない場合がある
- 例: CSV「田中太郎」 vs グループメンバー「太郎」

**影響**:
- 意図しない支払者として扱われる可能性
- ユーザーが明示的に選択した `payer_type` が上書きされない

**改善案**:
1. マッチング候補を表示してユーザー確認
2. 部分一致オプションの追加
3. マッチング失敗時の警告表示

---

### 問題2: expense_type の固定初期値

**現状**:
- すべての取引が `Household` でインポートされる
- ユーザーが個別に `Personal` に変更する必要がある

**問題点**:
- 大量の個人支出がある場合、手動変更が煩雑
- 誤って `Personal` を `Household` のまま放置するリスク

**改善案**:
1. CSV列に「支出タイプ」マッピングを追加
2. 摘要のキーワードで自動分類（例: 「趣味」「ゲーム」→ Personal）
3. デフォルト支出タイプの設定オプション

---

### 問題3: payer_user_id と payer_type の優先順位

**現状**:
```typescript
if (t.payer_user_id) {
  return t.payer_user_id === group.user_a_id  // 優先
}
return t.payer_type === 'UserA'  // フォールバック
```

**問題点**:
- `payer_user_id` が設定されると `payer_type` は無視される
- ユーザーがUIで `payer_type` を変更しても、`payer_user_id` が残っていると反映されない

**影響**:
- PayerSelect で変更しても計算に反映されないケースがある

**検証必要**:
- `updateTransactionPayer()` で `payer_user_id` が更新されるか確認

---

## 発見された整合性問題

### ISSUE-1: PayerSelect で Common を選択できない

**現状のUI**:
```typescript
// src/components/transactions/PayerSelect.tsx
<option value="">デフォルト</option>
<option value={groupUserAId}>{userAName}</option>
{groupUserBId && userBName && (
  <option value={groupUserBId}>{userBName}</option>
)}
// ❌ Common オプションがない
```

**問題点**:
- インポート時に `payer_type: 'Common'` で取り込んだ取引を後から Common に戻せない
- PayerSelect は `payer_user_id` を変更するが、Common は個人ではないため user_id がない
- 「デフォルト」を選択すると `payer_user_id = null` になり、`payer_type` にフォールバックするが、`payer_type` 自体は変更されない

**影響**:
- 誤って UserA/UserB を選択した場合、Common に戻すUIがない
- 精算計算で意図せず Common が UserA/UserB 扱いになる可能性

**修正案**:
```typescript
// PayerSelect に Common オプションを追加
<option value="">デフォルト (payer_type使用)</option>
<option value={groupUserAId}>{userAName}</option>
{groupUserBId && userBName && (
  <option value={groupUserBId}>{userBName}</option>
)}
<option value="common">共通口座</option>  // 追加
```

---

### ISSUE-2: payer_user_id と payer_type の二重管理による混乱

**データモデル**:
```typescript
interface Transaction {
  payer_type: 'UserA' | 'UserB' | 'Common'  // インポート時に設定
  payer_user_id?: string | null              // 個人を明示的に指定
}
```

**精算計算のロジック**:
```typescript
// payer_user_id が優先
if (t.payer_user_id) {
  return t.payer_user_id === group.user_a_id
}
return t.payer_type === 'UserA'  // フォールバック
```

**問題シナリオ**:

| 操作 | payer_type | payer_user_id | 精算での扱い |
|------|-----------|---------------|-------------|
| インポート時 UserA 選択 | UserA | null | UserA ✓ |
| PayerSelect で 太郎 選択 | UserA | user_a_id | UserA ✓ |
| PayerSelect で デフォルト選択 | UserA | null | UserA ✓ |
| インポート時 Common 選択 | Common | null | 除外 ✓ |
| PayerSelect で 太郎 選択 | Common | user_a_id | **UserA（期待は除外）** |
| PayerSelect で デフォルト選択 | Common | null | 除外 ✓ |

**問題**:
- Common でインポート後、PayerSelect でユーザーを選ぶと精算対象になる
- これは意図した動作かもしれないが、ユーザーには分かりにくい

**改善案**:
1. PayerSelect 変更時に `payer_type` も連動更新
2. または UI で `payer_type` と `payer_user_id` を分離表示

---

### ISSUE-3: payer_type 変更UIの不在

**現状**:
- `expense_type` は ExpenseTypeToggle で変更可能
- `payer_type` を直接変更するUIがない
- PayerSelect は `payer_user_id` のみ変更

**影響**:
- インポート時の `payer_type` 設定が事実上変更不可
- 誤って Common でインポートした場合、削除→再インポートが必要

**改善案**:
PayerTypeSelect コンポーネントを追加、または PayerSelect に統合

---

## 連動性サマリー

### 精算計算への影響度

| 項目 | 影響度 | 誤設定時のリスク |
|------|--------|-----------------|
| `amount` | 最高 | 精算額が完全に誤る |
| `payer_type` / `payer_user_id` | 最高 | 誰が支払ったか誤認識 |
| `expense_type` | 最高 | 計算対象/除外が誤る |
| `date` | 高 | 月跨ぎで誤計上 |
| `description` | なし | 表示のみ |

### データ整合性チェックポイント

1. **インポート時**
   - 日付フォーマットの正規化成功確認
   - 金額の絶対値化確認
   - 機密情報列の除外確認

2. **プレビュー時**
   - payerColumn と payer_type の整合確認
   - 金額合計の妥当性確認

3. **保存後**
   - Transaction レコードの件数確認
   - payer_user_id の設定状況確認

4. **精算計算時**
   - expense_type のフィルタ確認
   - payer_user_id 優先の動作確認
   - 対象月フィルタ確認
