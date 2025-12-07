# 次のアクション - Phase 2: API & UI 開発

**更新日:** 2025-12-07
**前フェーズ:** Core Logic (Phase 1) - APPROVED
**現在フェーズ:** Epic 2 - APPROVED ✓

---

## 完了サマリー

| Epic | 状態 | コミット |
|------|------|---------|
| Phase 1: Core Logic | APPROVED | 0b35c97, ab337b7 |
| Epic 1: User & Group Management | APPROVED | d5e9e3e, 03ae761, 7d544ac |
| Epic 2: CSV Data Ingestion UI | APPROVED | 5d64265 |

---

## Epic 2: CSV Data Ingestion UI (完了)

### コミット履歴 (Epic 2)
```
5d64265 feat(epic-2): add CSV data ingestion UI with transactions management
```

### 実装済みファイル (Epic 2)
| ファイル | 内容 |
|---------|------|
| supabase/migrations/003_transactions_table.sql | transactionsテーブル、RLSポリシー |
| app/actions/transactions.ts | uploadCSV, getTransactions, updateTransactionExpenseType, deleteTransaction |
| app/actions/__tests__/transactions.test.ts | 13テスト (validation schemas) |
| src/components/transactions/CSVUploadForm.tsx | CSVアップロードフォーム (5MB制限、成功メッセージ) |
| src/components/transactions/TransactionList.tsx | トランザクション一覧 |
| src/components/transactions/TransactionRow.tsx | トランザクション行 |
| src/components/transactions/ExpenseTypeToggle.tsx | Household/Personal切り替え (エラーハンドリング付き) |
| src/components/transactions/TransactionFilters.tsx | フィルター (月/expense_type/payer_type) |
| src/components/transactions/TransactionPreview.tsx | CSVプレビュー |
| app/dashboard/transactions/page.tsx | トランザクション一覧ページ |
| app/dashboard/transactions/upload/page.tsx | CSVアップロードページ |

### QGA結果: APPROVED

#### 修正済み P0 (3件)
| 項目 | 修正内容 |
|-----|---------|
| P0-1 | クライアントサイドファイルサイズ検証 (5MB) |
| P0-2 | アップロード成功メッセージ (X transactions imported) |
| P0-3 | ExpenseTypeToggle エラーハンドリング・リカバリー |

---

## テストカバレッジ

```
Test Files  4 passed (4)
     Tests  59 passed (59)

- src/lib/settlement.test.ts: 15 tests
- src/lib/csv-parser.test.ts: 11 tests
- app/actions/__tests__/validation.test.ts: 20 tests
- app/actions/__tests__/transactions.test.ts: 13 tests (NEW)
```

---

## 次のアクション

### Epic 3: 精算ダッシュボード (Settlement Dashboard)
```bash
/claude-code-multi-agent Epic 3: Settlement Dashboard を実装。
- 指定月の精算結果計算・表示
- calculateSettlement ロジック連携
- ダッシュボードUI
```

### 残存 P1 課題 (任意)
1. **P1-2: alert(JSON.stringify)** - toast通知システムに置換
2. **P1-4: getCurrentGroup N+1クエリ** - Supabase joinで最適化
3. **P1-テスト**: Server Actions統合テスト追加
4. **P1-UX**: ローディング状態・エラー表示改善
5. **P1-Pagination**: トランザクション一覧のページネーション

---

## 技術スタック

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Zod validation
- Vitest (59 tests passing)

---

## 環境設定

```bash
# .env.local 必須設定
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 開発コマンド

```bash
npm run dev       # 開発サーバー
npm test          # テスト (59/59 pass)
npx vitest run    # テスト1回実行
npm run type-check # 型チェック
npm run build     # ビルド
```

---

## ファイル構造 (Epic 2完了後)

```
src/
├── lib/
│   ├── types.ts          # 型定義 (user_id追加)
│   ├── settlement.ts     # 精算ロジック
│   ├── csv-parser.ts     # CSVパーサー
│   └── supabase/
│       ├── client.ts     # ブラウザクライアント
│       └── server.ts     # サーバークライアント
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx
│   │   └── LoginForm.tsx
│   ├── group/
│   │   ├── GroupSettings.tsx
│   │   ├── InvitePartner.tsx
│   │   └── CreateGroupForm.tsx
│   └── transactions/
│       ├── CSVUploadForm.tsx
│       ├── TransactionList.tsx
│       ├── TransactionRow.tsx
│       ├── ExpenseTypeToggle.tsx
│       ├── TransactionFilters.tsx
│       └── TransactionPreview.tsx
└── middleware.ts         # ルート保護

app/
├── (auth)/
│   ├── signup/page.tsx
│   └── login/page.tsx
├── dashboard/
│   ├── page.tsx
│   └── transactions/
│       ├── page.tsx
│       └── upload/page.tsx
├── settings/page.tsx
├── invite/[token]/page.tsx
└── actions/
    ├── auth.ts
    ├── group.ts
    ├── transactions.ts
    └── __tests__/
        ├── validation.test.ts
        └── transactions.test.ts

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    └── 003_transactions_table.sql
```
