# 次のアクション - Phase 2: API & UI 開発

**更新日:** 2025-12-07
**前フェーズ:** Core Logic (Phase 1) - APPROVED
**現在フェーズ:** Epic 1 - CONDITIONAL (P0修正完了、P1残存)

---

## 完了済み (Phase 1: Core Logic)

### コミット履歴
```
24a3880 docs: add Phase 2 action plan for API & UI development
0b35c97 fix: add P0/P1 validation and security improvements
ab337b7 feat: initial project setup with core settlement logic
```

### 実装済みファイル (Phase 1)
| ファイル | 内容 |
|---------|------|
| src/lib/types.ts | PayerType, ExpenseType, Transaction, Group, Settlement 型定義 |
| src/lib/settlement.ts | 精算計算ロジック (ratio/month バリデーション付き) |
| src/lib/csv-parser.ts | CSVパーサー (5MB制限、日付バリデーション、日英対応) |
| src/lib/*.test.ts | 26テスト 100% pass |

---

## Epic 1: User & Group Management (現在)

### コミット履歴 (Epic 1)
```
03ae761 fix(epic-1): add /invite/* middleware exception and P0 validation tests
d5e9e3e feat(epic-1): add user & group management with P0 security fixes
```

### 実装済みファイル (Epic 1)
| ファイル | 内容 |
|---------|------|
| app/actions/auth.ts | signUp, logIn, logOut Server Actions (Zod validation) |
| app/actions/group.ts | createGroup, invitePartner, acceptInvitation, updateRatio, getCurrentGroup |
| app/actions/__tests__/validation.test.ts | 20テスト (P0検証含む) |
| src/lib/supabase/client.ts | ブラウザ用Supabaseクライアント |
| src/lib/supabase/server.ts | サーバー用Supabaseクライアント |
| src/middleware.ts | 認証ルート保護 (/invite/* 例外対応済み) |
| src/components/auth/* | SignUpForm, LoginForm |
| src/components/group/* | GroupSettings, InvitePartner, CreateGroupForm |
| app/(auth)/* | signup, login ページ |
| app/dashboard/page.tsx | ダッシュボード |
| app/settings/page.tsx | 設定ページ |
| app/invite/[token]/page.tsx | 招待承認ページ |
| supabase/migrations/* | DBスキーマ、RLSポリシー |
| docs/EPIC-1-USER-GROUP-MANAGEMENT.md | 仕様書 |

### QGA結果: CONDITIONAL

#### 修正済み P0 (5件)
| 項目 | 修正内容 | コミット |
|-----|---------|---------|
| P0-1 | invitePartner入力バリデーション追加 | d5e9e3e |
| P0-2 | invitation insertエラーハンドリング追加 | d5e9e3e |
| P0-3 | logIn入力バリデーション追加 | d5e9e3e |
| P0-4 | RLSポリシー修正 (auth.users → users) | d5e9e3e |
| P0-NEW | middleware /invite/* ルート例外追加 | 03ae761 |

#### 残存 P1 課題 (4件) - Phase 2で対応可
1. **P1-2: alert(JSON.stringify)** - toast通知システムに置換 (Phase 2)
2. **P1-4: getCurrentGroup N+1クエリ** - Supabase joinで最適化
3. **P1-テスト**: Server Actions統合テスト追加 (60%カバレッジ目標)
4. **P1-UX**: ローディング状態・エラー表示改善

---

## テストカバレッジ

```
Test Files  3 passed (3)
     Tests  46 passed (46)

- src/lib/settlement.test.ts: 15 tests
- src/lib/csv-parser.test.ts: 11 tests
- app/actions/__tests__/validation.test.ts: 20 tests (NEW)
```

---

## 次のアクション

### 1. Epic 1 APPROVE取得 (推奨)
P1課題はPhase 2に繰り延べ可能。QGAにAPPROVE判定を依頼。

### 2. Epic 2 開始 (Epic 1承認後)
```bash
/claude-code-multi-agent Epic 2: CSV Data Ingestion UI を実装。
- transactions テーブル作成
- CSV アップロード Server Action
- CSVプレビュー・確認UI
- バルク insert with validation
```

### 3. P1課題対応 (任意)
```bash
# N+1クエリ最適化
/claude-code-multi-agent app/actions/group.ts の getCurrentGroup を Supabase join で最適化

# toast通知追加
/claude-code-multi-agent alert() を sonner/react-hot-toast に置換
```

---

## 技術スタック

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Zod validation
- Vitest (46 tests passing)

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
npm test          # テスト (46/46 pass)
npx vitest run    # テスト1回実行
npm run type-check # 型チェック
npm run build     # ビルド
```

---

## ファイル構造 (Epic 1完了後)

```
src/
├── lib/
│   ├── types.ts          # 型定義
│   ├── settlement.ts     # 精算ロジック
│   ├── csv-parser.ts     # CSVパーサー
│   └── supabase/
│       ├── client.ts     # ブラウザクライアント
│       └── server.ts     # サーバークライアント
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx
│   │   └── LoginForm.tsx
│   └── group/
│       ├── GroupSettings.tsx
│       ├── InvitePartner.tsx
│       └── CreateGroupForm.tsx
└── middleware.ts         # ルート保護

app/
├── (auth)/
│   ├── signup/page.tsx
│   └── login/page.tsx
├── dashboard/page.tsx
├── settings/page.tsx
├── invite/[token]/page.tsx
└── actions/
    ├── auth.ts
    ├── group.ts
    └── __tests__/
        └── validation.test.ts

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    └── 002_rls_policies.sql

docs/
└── EPIC-1-USER-GROUP-MANAGEMENT.md
```
