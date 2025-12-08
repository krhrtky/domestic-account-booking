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
| P1-Pagination | APPROVED | 7c1d34c |
| P1-UX | APPROVED | b13ea85〜b930348 (5 commits) |
| Phase 6: CSRF Protection | APPROVED | 9489f3c |
| Phase 7: A11y Auto Testing | APPROVED | 7ac06c6 |
| Phase 8: Security Headers Tests | APPROVED | f2f9d58 |
| Phase 9: Caching | APPROVED | 8621d8e |
| Phase 10: Multi-browser E2E | APPROVED | 17e0d94 |
| Phase 11: A11y Improvements | APPROVED | 89cb39a |
| Phase 12: API Endpoint Tests | APPROVED | 61bcb25 |
| Phase 13: Time-based Caching | APPROVED | d82faad |
| Phase 14: Lighthouse CI | APPROVED | 0709ee3 |
| Phase 15: ESLint v9 Setup | APPROVED | 8673ae9 |

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

## P1-Pagination: トランザクションページネーション (完了)

### コミット
```
7c1d34c feat(p1): implement offset-based pagination for transactions
```

### 実装済みファイル
| ファイル | 内容 |
|---------|------|
| app/actions/transactions.ts | OFFSET+COUNTクエリ、サーバーサイドクランプ |
| app/dashboard/transactions/page.tsx | URLクエリパラム状態管理 |
| src/components/transactions/TransactionList.tsx | ページネーション統合 |
| src/components/transactions/PaginationControls.tsx | ページナビゲーションUI (新規) |
| e2e/demo/07-pagination.spec.ts | E2Eテスト更新 |

### 機能概要
- ページサイズ選択: 10, 25, 50
- URLクエリパラム: `?page=2&size=25&month=2025-01`
- ページナビゲーション: Previous/Next + ページ番号 (ellipsis対応)
- "Showing X-Y of Z transactions" 表示
- フィルター変更時はページ1にリセット
- 無効なページ番号はサーバーサイドでクランプ
- アクセシビリティ: ARIA labels, keyboard navigation

---

## P1-UX: ローディング・エラー表示改善 (完了)

### コミット履歴 (5件)
```
b13ea85 feat(p1-ux): add reusable UI components
f579fa5 feat(p1-ux): add client-side validation to auth forms
7122286 feat(p1-ux): improve loading and error states in dashboard pages
53ab292 feat(p1-ux): add error boundaries for dashboard routes
b930348 fix(p1-ux): improve accessibility attributes
```

### 新規ファイル
| ファイル | 内容 |
|---------|------|
| src/components/ui/LoadingSkeleton.tsx | ローディングスケルトン (card/table-row/dashboard-stats) |
| src/components/ui/ErrorAlert.tsx | エラー表示 (inline/card + retry) |
| src/components/ui/FormField.tsx | フォームフィールド (aria-invalid/describedby) |
| src/components/ui/LoadingButton.tsx | ローディングボタン (aria-busy) |
| app/dashboard/error.tsx | ダッシュボードエラーバウンダリ |
| app/dashboard/transactions/error.tsx | トランザクションエラーバウンダリ |

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| src/components/auth/LoginForm.tsx | FormField/LoadingButton統合、クライアントバリデーション |
| src/components/auth/SignUpForm.tsx | FormField/LoadingButton統合、クライアントバリデーション |
| src/components/settlement/SettlementDashboard.tsx | LoadingSkeleton/ErrorAlert統合 |
| app/dashboard/transactions/page.tsx | LoadingSkeleton/ErrorAlert統合 |

### 機能概要
- **ローディングスケルトン**: animate-pulse、role="status"、aria-busy、aria-label
- **エラー表示**: role="alert"、retry機能、赤50/200/700カラー
- **フォームバリデーション**: クライアントサイド即時検証、aria-invalid、エラーメッセージ
- **ボタン状態**: aria-busy、disabled、loadingText変更
- **エラーバウンダリ**: route単位のクラッシュ回復

---

## Phase 6: セキュリティ強化 - CSRF対策 (完了)

### コミット
```
9489f3c feat(security): add CSRF protection headers
```

### 新規/更新ファイル
| ファイル | 内容 |
|---------|------|
| next.config.js | セキュリティヘッダー設定 |
| docs/SECURITY-CSRF.md | CSRF対策ドキュメント |

### セキュリティヘッダー
- X-Frame-Options: DENY (クリックジャッキング防止)
- Content-Security-Policy: frame-ancestors 'none' (iframe埋め込み禁止)
- X-Content-Type-Options: nosniff (MIMEスニッフィング防止)
- Referrer-Policy: strict-origin-when-cross-origin (リファラー制御)

### 組み込み保護
- Next.js 15 Server Actions: Origin header自動検証
- NextAuth session cookies: httpOnly, sameSite=lax

---

## Phase 7: アクセシビリティ自動テスト (完了)

### コミット
```
7ac06c6 feat(a11y): add automated accessibility testing with axe-core
```

### 新規ファイル
| ファイル | 内容 |
|---------|------|
| e2e/accessibility/utils/a11y-helpers.ts | axe-core設定、formatViolations |
| e2e/accessibility/auth.a11y.spec.ts | ログイン/サインアップページ (2テスト) |
| e2e/accessibility/dashboard.a11y.spec.ts | ダッシュボードページ (1テスト) |
| e2e/accessibility/transactions.a11y.spec.ts | トランザクションページ (1テスト) |
| e2e/accessibility/settings.a11y.spec.ts | 設定ページ (1テスト) |

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| package.json | @axe-core/playwright追加、test:e2e:a11y scripts |
| .github/workflows/e2e.yml | CI env vars修正 (NextAuth対応)、a11yテストstep追加 |

### 機能概要
- WCAG 2.1 Level AA自動テスト (wcag2a, wcag2aa, wcag21a, wcag21aa)
- 5ページ対象: login, signup, dashboard, transactions, settings
- CI統合: 違反があればビルド失敗
- npm scripts: `test:e2e:a11y`, `test:e2e:a11y:ui`

---

## Phase 8: セキュリティヘッダー検証テスト (完了)

### コミット
```
c24ce70 fix(db): use encrypted_password column name in auth queries
f2f9d58 feat(security): add security headers verification E2E tests
```

### 新規ファイル
| ファイル | 内容 |
|---------|------|
| e2e/security/utils/headers-helpers.ts | ヘッダー検証ユーティリティ |
| e2e/security/headers.spec.ts | 公開/保護ページのヘッダーテスト |

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| package.json | test:e2e:security scripts追加 |
| .github/workflows/e2e.yml | セキュリティテストstep追加 |
| app/actions/auth.ts | encrypted_passwordカラム名修正 |
| e2e/utils/test-helpers.ts | encrypted_passwordカラム名修正 |

### 検証対象ヘッダー
- X-Frame-Options: DENY
- Content-Security-Policy: frame-ancestors 'none'
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

## Phase 9: パフォーマンス最適化 - キャッシング (完了)

### コミット
```
8621d8e feat(perf): add server-side caching with React cache and revalidation
```

### 新規ファイル
| ファイル | 内容 |
|---------|------|
| src/lib/cache.ts | CACHE_TAGS, CACHE_DURATIONS定義 |
| src/lib/db-cache.ts | getUserGroupId (React cache) |

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| app/actions/transactions.ts | getUserGroupId使用、revalidateTag追加 |
| app/actions/group.ts | getUserGroupId使用、revalidateTag追加 |

### キャッシング戦略
- **Request-level deduplication**: React cache()でgetUserGroupIdをメモ化
- **Cache invalidation**: revalidateTagでトランザクション/グループ/settlement無効化
- **Tags**: transactions, group, settlement, settlementAll (グループ全体無効化用)

---

## Phase 10: Multi-browser E2E Testing (完了)

### 実装内容
- Firefox/WebKit (Safari) E2Eテスト対応
- CI matrix戦略でchromium/firefox/webkit並列実行
- 統一viewport (1280x720)、日本語ロケール (ja-JP)、Asia/Tokyoタイムゾーン
- ブラウザ別アーティファクトアップロード (失敗時のみ)

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| playwright.config.ts | 3ブラウザプロジェクト設定、locale/timezoneId追加、workers: 1固定 |
| .github/workflows/e2e.yml | matrix戦略、fail-fast: false、ブラウザ別artifact |
| package.json | test:e2e:firefox, test:e2e:webkit, test:e2e:all scripts追加 |

### Playwright設定
```typescript
projects: [
  { name: 'chromium', use: { viewport: { width: 1280, height: 720 } } },
  { name: 'firefox', use: { viewport: { width: 1280, height: 720 } } },
  { name: 'webkit', use: { viewport: { width: 1280, height: 720 } } },
]
use: {
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
}
```

### CI matrix戦略
```yaml
strategy:
  fail-fast: false
  matrix:
    browser: [chromium, firefox, webkit]
```

### E2Eテスト規模
```
Total: 150 tests in 23 files (50 tests × 3 browsers)
- auth (8 tests × 3)
- accessibility (5 tests × 3)
- security (9 tests × 3)
- demo scenarios (28 tests × 3)
```

### 検証結果
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- npx playwright test --list: ✅ 150 tests detected (3 browsers)

---

## Phase 11: Accessibility Improvements (完了)

### コミット
```
89cb39a feat(a11y): improve accessibility with ARIA attributes and Suspense fix
```

### 実装内容
- TransactionList: sr-only table caption追加
- TransactionRow: delete buttonにcontextual aria-label追加
- ExpenseTypeToggle: aria-label + aria-pressed追加
- globals.css: sr-only utility class追加
- transactions/page.tsx: useSearchParamsをSuspenseでラップ (Next.js 15 build fix)

### 更新ファイル
| ファイル | 変更内容 |
|---------|---------|
| src/components/transactions/TransactionList.tsx | sr-only caption追加 |
| src/components/transactions/TransactionRow.tsx | aria-label追加 |
| src/components/transactions/ExpenseTypeToggle.tsx | aria-label + aria-pressed追加 |
| app/globals.css | sr-only CSS utility追加 |
| app/dashboard/transactions/page.tsx | Suspense boundary追加 (P0 fix) |

### WCAG 2.1 Level AA対応
- 1.3.1 Info and Relationships: table caption
- 2.4.6 Headings and Labels: contextual button labels
- 4.1.2 Name, Role, Value: aria-pressed toggle state

### 検証結果
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- npm run build: ✅ SUCCESS

---

## Phase 12: API Endpoint Security Header Tests (完了)

### コミット
```
61bcb25 feat(security): add API endpoint security header tests (Phase 12)
```

### 実装内容
- e2e/security/api-headers.spec.ts: NextAuth APIエンドポイントのセキュリティヘッダー検証
- e2e/security/utils/headers-helpers.ts: Response | APIResponse型対応
- テスト対象: /api/auth/{providers,csrf,session}
- 4セキュリティヘッダー × 3ブラウザ = 12テスト

### 検証結果
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- API Headers tests: ✅ 12/12 PASS (4.5s)

---

## Phase 13: Time-based Caching with unstable_cache (完了)

### コミット
```
d82faad feat(perf): add time-based caching with unstable_cache (Phase 13)
```

### 実装内容
- src/lib/db-cache.ts: React cache() → unstable_cache()移行
- app/actions/transactions.ts: getTransactions/getSettlementDataのキャッシング
- 型ガードの修正 ('error' in result パターン)

### キャッシュ設定
| 関数 | 有効期間 | タグ |
|-----|---------|-----|
| getUserGroupId | 300s (5分) | user(userId) |
| getTransactions | 60s (1分) | transactions(groupId) |
| getSettlementData | 600s (10分) | settlement(groupId, month), settlementAll(groupId) |

### 検証結果
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- npm run build: ✅ SUCCESS

---

## Phase 14: Lighthouse CI Integration (完了)

### コミット
```
0709ee3 feat(perf): add Lighthouse CI for automated performance testing (Phase 14)
```

### 実装内容
- `.lighthouserc.json`: Lighthouse CI設定
  - パフォーマンスバジェット: LCP < 2.5s, CLS < 0.1, TBT < 300ms, Score >= 80
  - 3 URL targets: /login, /dashboard, /dashboard/transactions
  - 3 runs with median calculation
  - Desktop preset
- `scripts/lighthouse-auth.js`: セッショントークン生成スクリプト
- `scripts/run-lighthouse.sh`: ローカルテスト用スクリプト
- `.github/workflows/lighthouse.yml`: CI ワークフロー
- `docs/LIGHTHOUSE.md`: ドキュメント

### 新規スクリプト
```bash
npm run lighthouse        # フルテスト (ローカル)
npm run lighthouse:collect  # メトリクス収集
npm run lighthouse:assert   # バジェット検証
```

### 検証結果
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS
- npm run build: ✅ SUCCESS

---

## Phase 15: ESLint v9 Flat Config Setup (完了)

### コミット
```
8673ae9 feat(lint): add ESLint v9 flat config for Next.js 15 (Phase 15)
```

### 実装内容
- `eslint.config.mjs`: ESLint v9 flat config (Next.js core-web-vitals)
- `package.json`: lint/lint:fix スクリプト更新
- `.github/workflows/e2e.yml`: lint jobをCI追加

### 検証結果
- npm run lint: ✅ PASS (0 errors, 1 warning)
- npm run type-check: ✅ PASS
- npm test --run: ✅ 106/106 PASS

---

## 次のアクション

### Phase 15 完了
ESLint v9 flat configによるリント設定完了。

### Phase 16候補 (ポストMVP)
1. **i18n**: 多言語対応準備
2. **E2E test stabilization**: 保護ページテストの認証問題修正
3. **Error monitoring**: Sentry/LogRocket統合

### 全P1課題 (完了)
1. ~~**P1-2: alert(JSON.stringify)**~~ - ✅ COMPLETED (toast通知に置換)
2. ~~**P1-4: getCurrentGroup N+1クエリ**~~ - ✅ COMPLETED (NextAuth移行時にSQL JOINで最適化済み)
3. ~~**P1-UX**: ローディング状態・エラー表示改善~~ - ✅ COMPLETED (b930348)
4. ~~**P1-Pagination**: トランザクション一覧のページネーション~~ - ✅ COMPLETED (7c1d34c)

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
- @axe-core/playwright (a11y自動テスト)
- @lhci/cli (Lighthouse CI)
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
npm run test:e2e     # E2Eテスト (Playwright, chromiumデフォルト)
npm run test:e2e:firefox    # E2Eテスト Firefox
npm run test:e2e:webkit     # E2Eテスト WebKit (Safari)
npm run test:e2e:all        # E2Eテスト 全ブラウザ (chromium/firefox/webkit)
npm run test:e2e:ui  # E2E UIモード (デバッグ用)
npm run test:e2e:a11y    # アクセシビリティテスト
npm run test:e2e:a11y:ui # a11yテスト UIモード
npm run test:e2e:security    # セキュリティヘッダーテスト
npm run test:e2e:security:ui # securityテスト UIモード
npm run lighthouse       # Lighthouse パフォーマンステスト (ローカル)
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
│   ├── db.ts             # PostgreSQL connection pool
│   ├── db-cache.ts       # React cache() wrappers (NEW)
│   ├── cache.ts          # Cache tags/durations (NEW)
│   ├── auth.ts           # NextAuth設定
│   ├── session.ts        # getServerSession wrapper
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
├── accessibility/        # Phase 7: axe-core a11yテスト
│   ├── auth.a11y.spec.ts
│   ├── dashboard.a11y.spec.ts
│   ├── transactions.a11y.spec.ts
│   ├── settings.a11y.spec.ts
│   └── utils/
│       └── a11y-helpers.ts
├── security/             # Phase 8: セキュリティヘッダーテスト (NEW)
│   ├── headers.spec.ts
│   └── utils/
│       └── headers-helpers.ts
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
