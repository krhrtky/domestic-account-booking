# E2Eテスト追加仕様書

## 1. 実行コンテキスト

### 基本情報
- **開始日時**: 2025-12-20
- **目的**: L-TA-001評価データセットに基づく不足E2Eテストの特定と仕様策定
- **スコープ**: docs/laws/とREQUIREMENTS.mdで定義された全ユースケースのE2Eカバレッジ検証

### 分析対象
- 既存E2Eテスト: 28ファイル
- 参照Laws: L-TA-001, L-BR-001〜007, L-CX-001〜004, L-SC-001〜005, L-AS-001〜004
- 要件定義: REQUIREMENTS.md (Epic 1-4)

---

## 2. 既存E2Eテスト一覧

### 2.1 認証系 (auth/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| login.spec.ts | 正常ログイン、無効認証情報、サインアップ遷移、ローディング状態 | 認証成功/失敗フロー | 典型 |
| signup.spec.ts | アカウント作成 | ユーザー登録 | 典型 |
| validation-errors.spec.ts | バリデーションエラー | 入力検証 | 境界 |
| onboarding-flow.spec.ts | オンボーディング完全フロー | 初回セットアップ | 典型 |

### 2.2 精算系 (settlement/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| dashboard.spec.ts | ダッシュボード表示 | 精算結果確認 | 典型 |
| traceability.spec.ts | L-BR-007 根拠確認 | 精算内訳表示、過去精算トレース | 典型 |
| auth-state-verification.spec.ts | 認証状態確認 | セッション管理 | 境界 |

### 2.3 デモシナリオ (demo/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| 02-partner-invitation.spec.ts | パートナー招待 | グループ形成 | 典型 |
| 03-manual-transactions.spec.ts | 手動取引登録 | 取引作成 | 典型 |
| 04-csv-upload.spec.ts | CSVアップロード | CSV取り込み | 典型 |
| 05-transaction-classification.spec.ts | 支出タイプ切替 | Household/Personal分類 | 典型 |
| 06-filtering.spec.ts | フィルタリング | 月/Payer/ExpenseType絞込 | 典型 |
| 07-pagination.spec.ts | ページネーション | 大量データ表示 | 境界 |
| 08-deletion.spec.ts | 削除 | 取引削除 | 典型 |
| 09-settlement-equal.spec.ts | 50:50精算 | 等分精算 | 典型 |
| 10-settlement-unequal.spec.ts | 60:40精算 | 不等分精算 | 典型 |
| 11-settlement-common-account.spec.ts | 共通口座精算 | Common除外計算 | グレー |
| 12-ratio-update.spec.ts | 割合変更 | 動的再計算 | 典型 |
| 13-logout-session.spec.ts | ログアウト | セッション破棄 | 典型 |
| 14-error-handling.spec.ts | CSVエラー処理 | 無効フォーマット | 境界 |
| 15-edge-cases.spec.ts | エッジケース | 0件/等額/極端値/特殊文字/未来日付 | 境界 |

### 2.4 セキュリティ (security/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| headers.spec.ts | L-AS-004セキュリティヘッダー | 全ページのヘッダー検証 | 典型 |
| api-headers.spec.ts | APIヘッダー検証 | APIレスポンスヘッダー | 典型 |

### 2.5 アクセシビリティ (accessibility/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| auth.a11y.spec.ts | 認証画面a11y | ARIA/キーボード操作 | - |
| dashboard.a11y.spec.ts | ダッシュボードa11y | ARIA/キーボード操作 | - |
| settings.a11y.spec.ts | 設定画面a11y | ARIA/キーボード操作 | - |
| transactions.a11y.spec.ts | 取引一覧a11y | ARIA/キーボード操作 | - |

### 2.6 ビジュアル回帰 (vrt/)
| ファイル | テストケース | カバーするユースケース | L-TA-001分類 |
|---------|------------|---------------------|-------------|
| visual-regression.spec.ts | スクリーンショット回帰 | UI一貫性 | - |

---

## 3. ユースケース一覧（laws/要件から抽出）

### 3.1 L-TA-001: 評価データセット必須カバレッジ

| カテゴリ | 最小ケース数 | 現状E2E有無 | 充足状況 |
|---------|------------|-----------|---------|
| 典型ケース | 3+ | ✓ | 充足 (15+) |
| 境界ケース | 3+ | ✓ | 充足 (5+) |
| 事故ケース | 1+ | ✗ | **不足** |
| グレーケース | 1+ | ✓ | 充足 (1) |
| 攻撃ケース | 3+ | ✗ | **不足** |

### 3.2 L-BR: 業務ルール

| UC-ID | ユースケース | 関連ルール | E2E有無 | 備考 |
|-------|------------|-----------|--------|------|
| BR-001-1 | 精算計算（50:50） | L-BR-001 | ✓ | 09-settlement-equal.spec.ts |
| BR-001-2 | 精算計算（60:40） | L-BR-001 | ✓ | 10-settlement-unequal.spec.ts |
| BR-001-3 | 端数処理（四捨五入） | L-BR-001 | ✗ | **不足** |
| BR-001-4 | 負担割合合計≠100%エラー | L-BR-001 | ✗ | **不足** |
| BR-002-1 | Common除外計算 | L-BR-002 | ✓ | 11-settlement-common-account.spec.ts |
| BR-003-1 | Household/Personal切替 | L-BR-003 | ✓ | 05-transaction-classification.spec.ts |
| BR-004-1 | 月次集計（月またぎ） | L-BR-004 | ✗ | **不足** |
| BR-004-2 | タイムゾーン（JST） | L-BR-004 | ✗ | **不足** |
| BR-005-1 | グループ招待 | L-BR-005 | ✓ | 02-partner-invitation.spec.ts |
| BR-005-2 | 招待有効期限（7日） | L-BR-005 | ✗ | **不足** |
| BR-005-3 | グループ脱退 | L-BR-005 | ✗ | **不足** |
| BR-006-1 | CSV取り込み（正常） | L-BR-006 | ✓ | 04-csv-upload.spec.ts |
| BR-006-2 | 行数上限（10,000行） | L-BR-006 | ✗ | **不足** |
| BR-006-3 | ファイルサイズ上限（5MB） | L-BR-006 | ✗ | **不足** |
| BR-006-4 | 重複検知 | L-BR-006 | ✗ | **不足** |
| BR-006-5 | 文字コードエラー（非UTF-8） | L-BR-006 | ✗ | **不足** (事故ケース) |
| BR-007-1 | 精算内訳確認 | L-BR-007 | ✓ | traceability.spec.ts |

### 3.3 L-CX: 顧客体験

| UC-ID | ユースケース | 関連ルール | E2E有無 | 備考 |
|-------|------------|-----------|--------|------|
| CX-001-1 | 精算計算精度 | L-CX-001 | ✓ | 09/10-settlement.spec.ts |
| CX-002-1 | 金額フォーマット（¥カンマ区切り） | L-CX-002 | ✗ | **不足** |
| CX-002-2 | 日付フォーマット（YYYY年MM月DD日） | L-CX-002 | ✗ | **不足** |
| CX-003-1 | エラーメッセージ明確性 | L-CX-003 | △ | 部分的（validation-errors.spec.ts） |
| CX-004-1 | ボタンクリック100ms以内フィードバック | L-CX-004 | ✗ | **不足** |
| CX-004-2 | API待機中プログレス表示（3s以内） | L-CX-004 | ✗ | **不足** |

### 3.4 L-SC: セキュリティ

| UC-ID | ユースケース | 関連ルール | E2E有無 | 備考 |
|-------|------------|-----------|--------|------|
| SC-001-1 | 未認証ページアクセス→リダイレクト | L-SC-001 | ✗ | **不足** (攻撃ケース) |
| SC-001-2 | 他グループデータアクセス→403 | L-SC-001 | ✗ | **不足** (攻撃ケース) |
| SC-002-1 | SQLインジェクション防御 | L-SC-002 | ✗ | **不足** (攻撃ケース) |
| SC-002-2 | XSS防御（取引摘要） | L-SC-002 | ✗ | **不足** (攻撃ケース) |
| SC-002-3 | CSVインジェクション防御 | L-SC-002 | ✗ | **不足** (攻撃ケース) |
| SC-003-1 | パスワードログマスキング | L-SC-003 | ✗ | **不足** |
| SC-004-1 | レート制限（ログイン5回/15分） | L-SC-004 | ✗ | **不足** (攻撃ケース) |
| SC-005-1 | CSRFトークン検証 | L-SC-005 | ✗ | **不足** (攻撃ケース) |

### 3.5 L-AS: API仕様

| UC-ID | ユースケース | 関連ルール | E2E有無 | 備考 |
|-------|------------|-----------|--------|------|
| AS-001-1 | レスポンス形式（success/data/error） | L-AS-001 | ✗ | **不足** |
| AS-002-1 | 入力バリデーション（Zod） | L-AS-002 | △ | 部分的 |
| AS-004-1 | セキュリティヘッダー | L-AS-004 | ✓ | headers.spec.ts |

### 3.6 REQUIREMENTS.md Epic

| Epic | ユースケース | E2E有無 | 備考 |
|------|------------|--------|------|
| Epic 1 | ユーザー登録・グループ形成 | ✓ | signup/onboarding/invitation |
| Epic 2 | CSV取り込み | △ | 正常系のみ、異常系不足 |
| Epic 3 | 明細仕分け | ✓ | classification.spec.ts |
| Epic 4 | 精算ロジック | △ | 基本計算のみ、境界値不足 |

---

## 4. E2E不足ケース

### 4.1 優先度P0（必須実装）

| UC-ID | ユースケース | 理由 | 関連ルール |
|-------|------------|------|-----------|
| ATK-001 | 未認証ページアクセス防御 | L-SC-001必須、攻撃ケース不足 | L-SC-001, L-TA-001 |
| ATK-002 | 他グループデータアクセス拒否（IDOR） | L-SC-001必須、攻撃ケース不足 | L-SC-001, L-TA-001 |
| ATK-003 | XSS防御（取引摘要） | L-SC-002必須、攻撃ケース不足 | L-SC-002, L-TA-001 |
| ATK-004 | CSVインジェクション防御 | L-SC-002必須、攻撃ケース不足 | L-SC-002, L-TA-001 |
| INC-001 | 文字化けCSV（非UTF-8） | L-BR-006事故ケース、過去バグ想定 | L-BR-006, L-TA-001 |
| BND-001 | 負担割合合計≠100%エラー | L-BR-001境界値、必須検証 | L-BR-001, L-TA-001 |

### 4.2 優先度P1（推奨実装）

| UC-ID | ユースケース | 理由 | 関連ルール |
|-------|------------|------|-----------|
| CX-004-1 | ボタンクリック100ms以内フィードバック | L-CX-004性能要件 | L-CX-004, L-TA-001 |
| BND-002 | CSV行数上限（10,000行） | L-BR-006境界値 | L-BR-006, L-RV-002 |
| BND-003 | CSVファイルサイズ上限（5MB） | L-BR-006境界値 | L-BR-006, L-RV-002 |
| BND-004 | 端数処理（四捨五入） | L-BR-001計算精度 | L-BR-001, L-CX-001 |
| BND-005 | 月またぎ取引 | L-BR-004境界値 | L-BR-004 |
| ATK-005 | レート制限（ログイン5回/15分） | L-SC-004必須 | L-SC-004, L-TA-001 |

### 4.3 優先度P2（将来実装）

| UC-ID | ユースケース | 理由 | 関連ルール |
|-------|------------|------|-----------|
| CX-002-1 | 金額フォーマット表示一貫性 | L-CX-002 UI要件 | L-CX-002 |
| CX-002-2 | 日付フォーマット表示一貫性 | L-CX-002 UI要件 | L-CX-002 |
| BR-005-2 | 招待有効期限（7日） | L-BR-005境界値 | L-BR-005 |
| BR-005-3 | グループ脱退 | L-BR-005フロー | L-BR-005 |
| BR-006-4 | CSV重複検知 | L-BR-006品質向上 | L-BR-006 |
| ATK-006 | SQLインジェクション防御 | L-SC-002（ORMで緩和済み） | L-SC-002 |
| ATK-007 | CSRFトークン検証 | L-SC-005（フレームワークで実装済み） | L-SC-005 |

---

## 5. 実装優先順位

### Phase 1: セキュリティ攻撃ケース（P0）

**目標**: L-TA-001攻撃ケース3+を満たす

1. **e2e/security/attack-auth.spec.ts** (新規)
   - ATK-001: 未認証ページアクセス防御
   - ATK-002: IDOR（他グループデータアクセス拒否）
   - ATK-005: レート制限（ログイン5回/15分）

2. **e2e/security/attack-injection.spec.ts** (新規)
   - ATK-003: XSS防御（取引摘要に`<script>`挿入試行）
   - ATK-004: CSVインジェクション防御（`=CMD|calc`パターン）

### Phase 2: 事故ケース・境界値（P0-P1）

**目標**: L-TA-001事故ケース1+、境界ケース充実

3. **e2e/csv/import-errors.spec.ts** (新規)
   - INC-001: 文字化けCSV（Shift-JIS等）
   - BND-002: CSV行数上限（10,001行でエラー）
   - BND-003: CSVファイルサイズ上限（5.1MBでエラー）

4. **e2e/settlement/calculation-boundaries.spec.ts** (新規)
   - BND-001: 負担割合合計≠100%エラー（例: 60+50）
   - BND-004: 端数処理検証（1000円を33:67で割る→670円）
   - BND-005: 月またぎ取引（1/31と2/1の境界）

### Phase 3: 性能・UX要件（P1）

5. **e2e/performance/feedback.spec.ts** (新規)
   - CX-004-1: ボタンクリック100ms以内ローディング表示
   - CX-004-2: API待機中プログレス表示（3s以内）

### Phase 4: UI一貫性検証（P2）

6. **e2e/ui/format-consistency.spec.ts** (新規)
   - CX-002-1: 金額フォーマット（¥10,000形式の全画面統一）
   - CX-002-2: 日付フォーマット（YYYY年MM月DD日形式の全画面統一）

---

## 6. 受入基準チェックリスト

### 6.1 L-TA-001: 評価データセット要件

- [ ] 典型ケース: 3+（現状15+で充足）
- [ ] 境界ケース: 3+（現状5+ → Phase 2で8+へ拡充）
- [ ] **事故ケース: 1+（現状0 → Phase 2で1+実装必須）**
- [ ] グレーケース: 1+（現状1で充足）
- [ ] **攻撃ケース: 3+（現状0 → Phase 1で5+実装必須）**

### 6.2 L-TA-002: 採点ルーブリック

- [ ] 全E2Eテストが成功（PASS）
- [ ] クリティカルパス（精算計算、CSV取り込み）が100%カバー
- [ ] セキュリティテスト全成功（攻撃シナリオ0%成功率）

### 6.3 L-BR: 業務ルール

- [ ] L-BR-001: 精算計算ロジック全パターン検証
  - [ ] 50:50精算
  - [ ] 60:40精算
  - [ ] 端数処理（四捨五入）
  - [ ] 負担割合エラー検出
- [ ] L-BR-006: CSV取り込み全エラーケース検証
  - [ ] 文字化け（非UTF-8）
  - [ ] 行数上限
  - [ ] ファイルサイズ上限
  - [ ] 無効フォーマット（既存）

### 6.4 L-CX: 顧客体験

- [ ] L-CX-001: 計算精度100%
- [ ] L-CX-002: UI表示一貫性（金額・日付フォーマット）
- [ ] L-CX-003: エラーメッセージ明確性
- [ ] L-CX-004: 操作フィードバック即時性（100ms以内）

### 6.5 L-SC: セキュリティ

- [ ] L-SC-001: 認証・認可
  - [ ] 未認証アクセス拒否
  - [ ] 他グループデータアクセス拒否（IDOR）
- [ ] L-SC-002: インジェクション防御
  - [ ] XSS防御
  - [ ] CSVインジェクション防御
- [ ] L-SC-004: レート制限（ログイン5回/15分）

### 6.6 実装品質

- [ ] 全テストが独立実行可能（データクリーンアップ実装）
- [ ] テスト失敗時のスクリーンショット取得
- [ ] CI/CDパイプライン統合
- [ ] テストデータセットのZodスキーマ検証（L-TA-005準拠）

---

## 7. テストデータセット仕様

### 7.1 攻撃ケース（Phase 1）

```typescript
// e2e/fixtures/attack-scenarios.ts

export const ATTACK_SCENARIOS = {
  auth: [
    {
      id: 'ATK-001',
      name: '未認証ページアクセス',
      path: '/dashboard',
      expectedRedirect: '/login',
    },
    {
      id: 'ATK-002',
      name: 'IDOR（他グループデータアクセス）',
      endpoint: '/api/transactions/{victim-transaction-id}',
      expectedStatus: 403,
    },
    {
      id: 'ATK-005',
      name: 'ログインレート制限',
      attempts: 6,
      window: '15min',
      expectedStatus: 429,
    },
  ],
  injection: [
    {
      id: 'ATK-003',
      name: 'XSS（取引摘要）',
      payload: '<script>alert(document.cookie)</script>',
      expectedSanitized: '&lt;script&gt;alert(document.cookie)&lt;/script&gt;',
    },
    {
      id: 'ATK-004',
      name: 'CSVインジェクション',
      csvRow: '2025-01-15,1000,=CMD|calc|',
      expectedSanitized: "'=CMD|calc|",
    },
  ],
};
```

### 7.2 事故ケース（Phase 2）

```typescript
// e2e/fixtures/incident-cases.ts

export const INCIDENT_CASES = {
  csv: [
    {
      id: 'INC-001',
      name: '文字化けCSV（Shift-JIS）',
      file: 'tests/fixtures/shift-jis.csv',
      expectedError: 'UTF-8形式で保存されたファイルをご利用ください',
      reference: 'Issue #XXX（想定）',
    },
  ],
};
```

### 7.3 境界ケース（Phase 2）

```typescript
// e2e/fixtures/boundary-cases.ts

export const BOUNDARY_CASES = {
  settlement: [
    {
      id: 'BND-001',
      name: '負担割合合計≠100%',
      ratioA: 60,
      ratioB: 50,
      expectedError: '負担割合の合計は100%である必要があります',
    },
    {
      id: 'BND-004',
      name: '端数処理（四捨五入）',
      paidByA: 1000,
      ratioA: 33,
      ratioB: 67,
      expectedBalanceA: 670,
    },
  ],
  csv: [
    {
      id: 'BND-002',
      name: 'CSV行数上限',
      rows: 10001,
      expectedError: '行数が上限(10,000行)を超えています',
    },
    {
      id: 'BND-003',
      name: 'CSVファイルサイズ上限',
      fileSizeMB: 5.1,
      expectedError: 'ファイルサイズが上限(5MB)を超えています',
    },
  ],
};
```

---

## 8. 関連ドキュメント

- `docs/laws/07-test-audit.md`: L-TA-001〜005定義
- `docs/laws/08-business-rules.md`: L-BR-001〜007定義
- `docs/laws/01-customer-experience.md`: L-CX-001〜004定義
- `docs/laws/04-security.md`: L-SC-001〜005定義
- `REQUIREMENTS.md`: Epic 1-4要件
- `e2e/README.md`: 既存E2Eテスト構成

---

## 9. 実装ガイドライン

### 9.1 テストファイル構成

```
e2e/
├── security/
│   ├── attack-auth.spec.ts       # Phase 1
│   └── attack-injection.spec.ts  # Phase 1
├── csv/
│   └── import-errors.spec.ts     # Phase 2
├── settlement/
│   └── calculation-boundaries.spec.ts  # Phase 2
├── performance/
│   └── feedback.spec.ts          # Phase 3
├── ui/
│   └── format-consistency.spec.ts  # Phase 4
└── fixtures/
    ├── attack-scenarios.ts
    ├── incident-cases.ts
    └── boundary-cases.ts
```

### 9.2 命名規則

- ファイル名: `{category}-{feature}.spec.ts`
- describe: `'L-XX-NNN: {Rule Name}'`（ルール準拠を明示）
- test: `'should {expected behavior} ({test-id})'`

### 9.3 アサーションパターン

```typescript
// セキュリティ検証
await expect(response.status()).toBe(403);
await expect(page).toHaveURL('/login');

// サニタイズ検証
const html = await page.content();
expect(html).not.toContain('<script>');
expect(html).toContain('&lt;script&gt;');

// エラーメッセージ検証
await expect(page.getByText('UTF-8形式で保存されたファイルをご利用ください')).toBeVisible();

// 性能検証
const start = Date.now();
await button.click();
await expect(loadingIndicator).toBeVisible();
expect(Date.now() - start).toBeLessThan(100);
```

---

## 10. 承認・レビュー

### 承認者
- [ ] プロダクトオーナー: 仕様内容の妥当性確認
- [ ] QAエンジニア: テストケース網羅性確認
- [ ] セキュリティ担当: 攻撃シナリオの妥当性確認

### レビュー観点
1. L-TA-001の全カテゴリ（典型/境界/事故/グレー/攻撃）を3+/1+満たすか
2. 優先度P0のテストケースが全て含まれているか
3. テストデータセットがZodスキーマで検証可能か（L-TA-005）
4. 既存テストと重複していないか

---

## 11. 次ステップ

1. **Phase 1実装開始**: セキュリティ攻撃ケース（attack-auth.spec.ts、attack-injection.spec.ts）
2. **テストデータセット作成**: fixtures/attack-scenarios.ts、incident-cases.ts、boundary-cases.ts
3. **CI統合**: .github/workflows/e2e.ymlに新規テスト追加
4. **Phase 2移行判断**: Phase 1完了後、受入基準達成状況を評価

---

**文書バージョン**: 1.0  
**最終更新日**: 2025-12-20  
**次回レビュー予定**: Phase 1完了時
