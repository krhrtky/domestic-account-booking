# Issue: CSV重複検知機能の追加

## 概要

CSVインポート時に、Date + Amount + Description の組み合わせで重複を検知し、警告を表示する機能を追加する。

## 背景

- 現在の実装: 重複検知なし
- L-BR-006仕様: 重複検知と警告表示が要件として定義されている
- QGA判定: MINOR-001として記録（非ブロッカー、優先度: Low）

## ユーザーストーリー

**As a** 家計精算アプリのユーザー
**I want to** 同じ取引を誤って複数回インポートした場合に警告を受け取りたい
**So that** データの重複を防ぎ、正確な精算結果を得られる

## 受け入れ条件

### AC-001: 重複検知ロジック

**Given**: CSVファイルに既存データと同じ取引が含まれる
**When**: インポートを実行
**Then**:

- [ ] Date + Amount + Description の完全一致で重複を検出
- [ ] 検出された重複件数を警告メッセージに表示
- [ ] 重複があってもインポートは実行される（警告のみ）

### AC-002: 警告メッセージ

**Given**: 重複が検出された
**When**: 警告が表示される
**Then**:

- [ ] メッセージ: `重複の可能性がある取引が{N}件見つかりました。`
- [ ] 重複する取引の詳細（日付、金額、摘要）を表示
- [ ] ユーザーに「続行」または「キャンセル」の選択肢を提示

### AC-003: UIフロー

**Given**: マッピング完了後、プレビュー画面で「インポート」をクリック
**When**: 重複が検出された場合
**Then**:

- [ ] 確認ダイアログが表示される
- [ ] 「続行」を選択するとインポートが実行される
- [ ] 「キャンセル」を選択するとインポートが中止される

## 技術仕様

### データモデル

```typescript
interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateCount: number;
  duplicateTransactions: {
    date: string;
    amount: number;
    description: string;
    existingId?: string;
  }[];
}
```

### 実装箇所

1. **重複チェックロジック**: `src/lib/csv-parser.ts`

   ```typescript
   export function checkDuplicates(
     newTransactions: Transaction[],
     existingTransactions: Transaction[],
   ): DuplicateCheckResult;
   ```

2. **UI警告表示**: `src/components/transactions/CSVUploadForm.tsx`
   - 確認ダイアログコンポーネント追加

3. **テスト**: `src/lib/csv-parser.test.ts`
   - 重複検知ロジックのユニットテスト（6件以上）

## Laws準拠

### L-BR-006: CSV Import Rules

**Business Constraints**:
| Constraint | Value | 実装 |
|------------|-------|------|
| Duplicate detection | Date + Amount + Description | ✅ 今回実装 |
| On duplicate | Show warning (import proceeds) | ✅ 今回実装 |

### L-CX-003: Error Message Clarity

**警告メッセージ要件**:

- ❌ 技術的エラー禁止
- ✅ 具体的な情報提供（件数、詳細）
- ✅ 次のアクション明示（続行/キャンセル）

### L-TA-001: Test Dataset Categories

**必須テストケース**:

- Typical: 重複なしの正常インポート（1件）
- Boundary: 全件重複、部分重複（2件）
- Incident: 過去の重複インポート事例（1件）
- Attack: 意図的な大量重複（1件）

## 見積もり

- **優先度**: Low
- **工数**: 1日（8時間）
- **内訳**:
  - ロジック実装: 2時間
  - UI実装: 2時間
  - テスト作成: 3時間
  - ドキュメント更新: 1時間

## 関連ファイル

- `src/lib/csv-parser.ts` - 重複チェックロジック
- `src/components/transactions/CSVUploadForm.tsx` - UI警告表示
- `src/lib/csv-parser.test.ts` - テスト
- `docs/laws/08-business-rules.md` - L-BR-006参照
- `.claude/rules/**__csv**.md` - CSV処理ルール

## 参考情報

- ワークフローID: wf-csv-column-mapping-20260112
- QGA Report: `.claude/qga-output.md`
- Issue ID: MINOR-001
- 検出日: 2026-01-12

## チェックリスト

実装時の確認事項:

- [ ] 重複チェックロジック実装
- [ ] 警告ダイアログUI実装
- [ ] ユニットテスト6件以上
- [ ] E2Eテスト2件以上
- [ ] L-BR-006準拠確認
- [ ] L-CX-003準拠確認
- [ ] Laws検証スクリプト通過
- [ ] type-check, lint, test 全てPASS

---

**作成日**: 2026-01-12
**カテゴリ**: enhancement
**優先度**: Low
**見積もり**: 1日
