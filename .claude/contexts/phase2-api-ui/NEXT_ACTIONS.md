# 次のアクション - Phase 5: NextAuth Migration

**更新日:** 2025-12-08
**前フェーズ:** P1 Toast Notifications - APPROVED ✓
**現在フェーズ:** Supabase → NextAuth + pg 移行 - APPROVED ✓

---

## 完了サマリー

| Epic | 状態 | コミット |
|------|------|---------|
| Phase 1: Core Logic | APPROVED | 0b35c97, ab337b7 |
| Epic 1: User & Group Management | APPROVED | d5e9e3e, 03ae761, 7d544ac |
| Epic 2: CSV Data Ingestion UI | APPROVED | 5d64265 |
| Epic 3: Settlement Dashboard | APPROVED | b7ada9a |
| Phase 3: E2E Tests | APPROVED | 1321c14 |
| P1: Toast Notifications | APPROVED | b9991c2 |
| Phase 5: NextAuth Migration | APPROVED | 77fadda〜8a9ad8e (10 commits) |

---

## Epic 3: Settlement Dashboard (完了)

### コミット履歴 (Epic 3)
```
b7ada9a feat(epic-3): add settlement dashboard with monthly calculation display
```

### 実装済みファイル (Epic 3)
| ファイル | 内容 |
|---------|------|
| app/actions/transactions.ts | getSettlementData追加 (月フィルタリング付き) |
| app/actions/__tests__/settlement.test.ts | 8テスト (Zod validation) |
| src/components/settlement/MonthSelector.tsx | 月選択ドロップダウン (ARIA対応) |
| src/components/settlement/SettlementSummary.tsx | 精算サマリー表示 |
| src/components/settlement/SettlementDashboard.tsx | ダッシュボードコンテナ |
| app/dashboard/page.tsx | SettlementDashboard統合 |

### QGA結果: APPROVED (P0修正後)

#### 修正済み P0 (2件)
| 項目 | 修正内容 |
|-----|---------|
| P0-2 | サーバーサイド月フィルタリング追加 (パフォーマンス改善) |
| P1-1 | MonthSelector アクセシビリティ改善 (ARIA labels) |

### 機能概要
- 過去12ヶ月の月セレクター (デフォルト: 当月)
- 精算結果表示:
  - 総家計支出 (total_household)
  - User A/B 立替額
  - 共通口座支出
  - 負担割合
  - 最終精算額 (支払い方向付き)
- ローディング/エラー状態
- モバイルレスポンシブ

---

## テストカバレッジ

```
Test Files  8 passed (8)
     Tests  106 passed (106)

- src/lib/settlement.test.ts: 15 tests
- src/lib/csv-parser.test.ts: 11 tests
- src/lib/rate-limiter.test.ts: 10 tests
- src/lib/rate-limiter-auth.test.ts: 9 tests
- src/lib/get-client-ip.test.ts: 14 tests
- app/actions/__tests__/validation.test.ts: 20 tests
- app/actions/__tests__/transactions.test.ts: 19 tests
- app/actions/__tests__/settlement.test.ts: 8 tests
```

---

## Phase 3: E2E Tests (完了)

### コミット履歴
```
1321c14 feat(e2e): add Playwright E2E test infrastructure
```

### 実装済みファイル
| ファイル | 内容 |
|---------|------|
| playwright.config.ts | Playwright設定 (Chromium, sequential) |
| e2e/utils/test-helpers.ts | Supabase Admin API ヘルパー |
| e2e/auth/login.spec.ts | ログインテスト (4ケース) |
| e2e/auth/signup.spec.ts | サインアップテスト (4ケース) |
| e2e/settlement/dashboard.spec.ts | ダッシュボードテスト (5ケース) |
| .github/workflows/e2e.yml | CI/CD ワークフロー |

### QGA結果: APPROVED (P0修正後)

#### 修正済み P0 (3件)
| 項目 | 修正内容 |
|-----|---------|
| P0 #1 | cleanupTestData: group_members → groups with user_a_id/user_b_id |
| P0 #2 | 環境変数バリデーション追加 (早期エラー) |
| P0 #3 | fullyParallel: false (race condition防止) |

#### 修正済み P1 (2件)
| 項目 | 修正内容 |
|-----|---------|
| P1 #4 | dialog assertion: waitForEvent promise pattern |
| P1 #6 | URL assertion: regex → exact '/login' |

### E2Eテストカバレッジ
```
Test Suites: 3 (auth/login, auth/signup, settlement/dashboard)
Test Cases: 13 total
- Login flow: 4 tests
- Signup flow: 4 tests
- Dashboard: 5 tests
```

---

## P1: Toast Notifications (完了)

### コミット履歴
```
b9991c2 feat(p1): replace alert() with toast notifications
```

### 実装済みファイル
| ファイル | 内容 |
|---------|------|
| src/lib/hooks/useToast.ts | toast wrapper (success/error/info) |
| src/components/ui/Toaster.tsx | styled Toaster component |
| app/layout.tsx | Toaster統合 |
| src/components/auth/LoginForm.tsx | alert → toast |
| src/components/auth/SignUpForm.tsx | alert → toast |
| src/components/group/*.tsx | alert → toast (3 files) |

### QGA結果: APPROVED (P0修正後)

#### 修正済み P0 (2件)
| 項目 | 修正内容 |
|-----|---------|
| P0-1 | error toast duration: 4000ms → 5000ms |
| P0-2 | success toasts追加 (Login, SignUp, CreateGroup) |

### 機能概要
- react-hot-toast ライブラリ採用 (3.5kB gzipped)
- エラートースト: 5秒表示 (赤アイコン)
- 成功トースト: 4秒表示 (緑アイコン)
- 位置: top-right
- 5コンポーネントから alert() 削除

---

## Phase 5: Supabase → NextAuth + pg 移行 (完了)

### コミット履歴 (10件)
```
77fadda feat(db): pg Pool + migration追加
b218903 feat(auth): NextAuth.js移行
d67be0f refactor(actions): 直接SQL化
1e49c1f refactor(ui): 認証フォーム更新
09614bd test(helpers): E2Eヘルパー移行
c0981c2 test(e2e): 14テストファイル更新
c023705 chore: Supabaseファイル削除
eaa6a0f chore: 依存関係更新
8128dac docs: 実装ドキュメント追加
8a9ad8e docs: SESSION-SUMMARY更新
```

### 実装済みファイル
| ファイル | 内容 |
|---------|------|
| src/lib/db.ts | PostgreSQL connection pool (pg) |
| src/lib/auth.ts | NextAuth.js設定 (Credentials provider) |
| src/lib/session.ts | getServerSession wrapper |
| app/api/auth/[...nextauth]/route.ts | NextAuth APIルート |
| supabase/migrations/004_nextauth_schema.sql | NextAuth用スキーマ |
| app/actions/*.ts | 直接SQLクエリ化 |
| e2e/utils/test-helpers.ts | pg helpers移行 |

### 検証状況
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- supabaseAdmin参照: 0件
- git status: clean

---

## 次のアクション

### Phase 5完了
Supabase依存を完全に排除し、NextAuth + pg直接接続に移行完了。

### Phase 6候補 (ポストMVP)
1. **パフォーマンス最適化**: N+1クエリ解消、キャッシング
2. **UX改善**: ページネーション、ローディングスケルトン
3. **セキュリティ強化**: CSRF対策強化
4. **Multi-browser E2E**: Firefox/Safari対応

### 残存 P1 課題 (任意)
1. ~~**P1-2: alert(JSON.stringify)**~~ - ✅ COMPLETED (toast通知に置換)
2. ~~**P1-4: getCurrentGroup N+1クエリ**~~ - ✅ COMPLETED (NextAuth移行時にSQL JOINで最適化済み)
3. **P1-UX**: ローディング状態・エラー表示改善
4. **P1-Pagination**: トランザクション一覧のページネーション

---

## 技術スタック

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS
- NextAuth.js v4 (Credentials provider)
- PostgreSQL (pg直接接続)
- Zod validation
- Vitest (106 tests passing)
- Playwright E2E (14+ tests)
- react-hot-toast (UX)
- bcrypt (パスワードハッシュ)
- Rate limiting (認証保護)

---

## 環境設定

```bash
# .env.local 必須設定
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 開発コマンド

```bash
npm run dev          # 開発サーバー
npm test -- --run    # 単体テスト (106/106 pass, watch無効)
npm run test:e2e     # E2Eテスト (Playwright)
npm run test:e2e:ui  # E2E UIモード (デバッグ用)
npm run type-check   # 型チェック
npm run build        # ビルド
```

---

## ファイル構造 (Phase 5完了後)

```
src/
├── lib/
│   ├── types.ts          # 型定義
│   ├── settlement.ts     # 精算ロジック
│   ├── csv-parser.ts     # CSVパーサー
│   ├── db.ts             # PostgreSQL connection pool (NEW)
│   ├── auth.ts           # NextAuth設定 (NEW)
│   ├── session.ts        # getServerSession wrapper (NEW)
│   ├── rate-limiter.ts   # Rate limiting
│   └── get-client-ip.ts  # IP取得ユーティリティ
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx
│   │   └── LoginForm.tsx
│   ├── group/
│   │   ├── GroupSettings.tsx
│   │   ├── InvitePartner.tsx
│   │   └── CreateGroupForm.tsx
│   ├── transactions/
│   │   ├── CSVUploadForm.tsx
│   │   ├── TransactionList.tsx
│   │   ├── TransactionRow.tsx
│   │   ├── ExpenseTypeToggle.tsx
│   │   ├── TransactionFilters.tsx
│   │   └── TransactionPreview.tsx
│   ├── settlement/
│   │   ├── MonthSelector.tsx
│   │   ├── SettlementSummary.tsx
│   │   └── SettlementDashboard.tsx
│   └── ui/
│       └── Toaster.tsx
└── middleware.ts         # ルート保護

app/
├── (auth)/
│   ├── signup/page.tsx
│   └── login/page.tsx
├── api/
│   └── auth/
│       └── [...nextauth]/route.ts  # NextAuth APIルート (NEW)
├── dashboard/
│   ├── page.tsx
│   └── transactions/
│       ├── page.tsx
│       └── upload/page.tsx
├── settings/page.tsx
├── invite/[token]/page.tsx
└── actions/
    ├── auth.ts           # 直接SQL (Supabase削除)
    ├── group.ts          # 直接SQL
    ├── transactions.ts   # 直接SQL
    └── __tests__/
        ├── validation.test.ts
        ├── transactions.test.ts
        └── settlement.test.ts

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_transactions_table.sql
    └── 004_nextauth_schema.sql  # NextAuth用スキーマ (NEW)

e2e/
├── auth/
│   ├── login.spec.ts
│   └── signup.spec.ts
├── settlement/
│   └── dashboard.spec.ts
├── transactions/         # トランザクション関連E2E
└── utils/
    └── test-helpers.ts   # pg helpers (Supabase削除)

.github/workflows/
└── e2e.yml
```
