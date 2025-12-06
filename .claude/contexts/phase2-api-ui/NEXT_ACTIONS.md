# 次のアクション - Phase 2: API & UI 開発

**作成日:** 2025-12-07
**前フェーズ:** Core Logic (Phase 1) - APPROVED

---

## 完了済み (Phase 1: Core Logic)

### コミット履歴
```
0b35c97 fix: add P0/P1 validation and security improvements
ab337b7 feat: initial project setup with core settlement logic
```

### 実装済みファイル
| ファイル | 内容 |
|---------|------|
| src/lib/types.ts | PayerType, ExpenseType, Transaction, Group, Settlement 型定義 |
| src/lib/settlement.ts | 精算計算ロジック (ratio/month バリデーション付き) |
| src/lib/csv-parser.ts | CSVパーサー (5MB制限、日付バリデーション、日英対応) |
| src/lib/*.test.ts | 26テスト 100% pass |

### QGA承認済み項目
- ratio範囲バリデーション (0-100, 合計100)
- ファイルサイズ制限 (5MB)
- Math.round() 浮動小数点対策
- 日付バリデーション強化
- MM/DD/YYYY対応
- XSSペイロードテスト

---

## 次のフェーズ (Phase 2)

### 優先順位

#### Epic 1: User & Group Management
1. [ ] Supabase セットアップ (`.env.local` 設定)
2. [ ] 認証フロー実装 (Supabase Auth)
3. [ ] users テーブル作成
4. [ ] groups テーブル作成
5. [ ] パートナー招待機能

#### Epic 2: CSV Data Ingestion
1. [ ] ファイルアップロードUI (react-dropzone)
2. [ ] Payer Type 選択UI
3. [ ] transactions テーブル作成
4. [ ] Server Action: CSV保存

#### Epic 3: Transaction Classification
1. [ ] Transaction 一覧ページ
2. [ ] 月別フィルタ
3. [ ] Household/Personal 切り替え
4. [ ] 削除機能

#### Epic 4: Settlement Dashboard
1. [ ] 月別精算サマリー表示
2. [ ] 「誰が誰にいくら」表示
3. [ ] 内訳表示 (total, paid_by_a, paid_by_b, balance)

---

## 技術スタック参照

SPEC.md Section 3.1:
```sql
-- Database Schema
CREATE TABLE users (id UUID, name TEXT, email TEXT, group_id UUID)
CREATE TABLE groups (id UUID, name TEXT, ratio_a INT, ratio_b INT, user_a_id UUID, user_b_id UUID)
CREATE TABLE transactions (id UUID, group_id UUID, date DATE, amount INT, description TEXT, payer_type TEXT, expense_type TEXT)
```

SPEC.md Section 3.2: API Routes (Next.js Server Actions)
- POST /api/groups - グループ作成
- POST /api/transactions/upload - CSV一括登録
- PATCH /api/transactions/[id] - expense_type更新
- DELETE /api/transactions/[id] - 削除
- GET /api/settlements/[month] - 精算計算結果

---

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動
npm test          # テスト実行 (26/26 pass)
npm run lint      # リント
npm run typecheck # 型チェック
```

---

## 注意事項

1. **Supabase設定**: `.env.local.example` を参照して `.env.local` を作成
2. **RLS ポリシー**: SPEC.md Section 5.2 に従ってRow Level Security設定
3. **パフォーマンス目標**: 50,000件で500ms以内 (SPEC.md Section 5.1)

---

## 残存リスク (低優先度 - Phase 3で対応)

1. SPEC.md Test Case 1の記述ミス修正
2. 無効日付行のwarnings配列追加
3. パフォーマンスベンチマーク実施
