# Quality Gate Report

## ゲート判定
**REQUEST_CHANGES**

## サマリー
- レビュー対象: 4ファイル、890行
- 重大度別Findings: Critical 2 / High 6 / Medium 3 / Low 0
- 実行可能性: 部分的（7/27テストが失敗）
- Laws準拠: 概ね良好（一部実装ギャップあり）

---

## Findings

### Critical

#### 1. [csv/import-errors.spec.ts:26] API `/api/me` エンドポイント不在

**重大度**: Critical  
**Laws違反**: L-SC-001（認証・認可検証不可）

**問題**:
```typescript
const hasGroup = await page.evaluate(() => {
  return fetch('/api/me', { credentials: 'include' })
    .then(r => r.json())
    .then(data => !!data.groupId)
})
```

`/api/me` エンドポイントが実装されていないため、HTML（<!DOCTYPE）が返され JSON parse エラー。全6テストケースが失敗。

**影響**:
- BND-002, BND-003, INC-001 の全テストが実行不能
- L-BR-006（CSV取り込みルール）の境界値・事故ケースが検証不可

**修正案**:
```typescript
// Option 1: 既存APIへの置き換え
const hasGroup = await page.evaluate(() => {
  return fetch('/api/groups', { credentials: 'include' })
    .then(r => r.status === 200)
})

// Option 2: /api/me を実装
// app/api/me/route.ts
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { group: true },
  })
  
  return NextResponse.json({
    id: user.id,
    email: user.email,
    groupId: user.groupId,
  })
}
```

**必須対応**: DA に API実装または既存API利用への修正を依頼

---

#### 2. [security/attack-auth.spec.ts:151] レート制限未実装によるテスト失敗

**重大度**: Critical  
**Laws違反**: L-SC-004（レート制限とDoS対策）

**問題**:
```typescript
// 6回目の試行でエラーメッセージが表示されない
const errorVisible = await page.getByText(/Invalid|incorrect|failed/i).isVisible()
expect(errorVisible).toBeTruthy()  // ← fails
```

L-SC-004 では `/api/auth/login` に「5回/15分」のレート制限が必須だが、未実装のため ATK-005 テストが失敗。

**影響**:
- L-TA-001 攻撃ケース要件（3+）を満たせない可能性
- DoS攻撃への脆弱性が残存

**修正案**:
```typescript
// middleware.ts または auth route
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5,
  message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。',
  standardHeaders: true,
  legacyHeaders: false,
})
```

**必須対応**: DA にレート制限ミドルウェア実装を依頼

---

### High

#### 3. [security/attack-auth.spec.ts:57-109] IDOR テスト実装の複雑性過剰

**重大度**: High  
**Laws違反**: なし（コード品質）

**問題**:
- 2ユーザー作成 + グループ作成 + 取引作成 + ログアウト + 再ログイン の手順が複雑
- 106行（test全体の64%）が setup に費やされている
- 他のテストとデータが干渉する可能性

**推奨改善**:
```typescript
// fixtures/attack-scenarios.ts を作成し、セットアップを共通化
export async function setupIdorScenario(page: Page) {
  const { victim, attacker } = await createTwoGroups()
  const victimTx = await createTransaction(victim, { amount: 1000 })
  return { victim, attacker, victimTx }
}

// テストは簡潔に
test('IDOR: 他グループトランザクション取得は403', async ({ page, request }) => {
  const { attacker, victimTx } = await setupIdorScenario(page)
  await loginUser(page, attacker)
  
  const response = await request.get(`/api/transactions/${victimTx.id}`)
  expect([403, 404]).toContain(response.status())
})
```

**対応**: 次イテレーションでリファクタリング推奨（今回はconditional承認可）

---

#### 4. [security/attack-injection.spec.ts:109-146] ファイルシステム操作の残骸

**重大度**: High  
**Laws違反**: なし（テスト品質）

**問題**:
```typescript
const csvPath = path.join(__dirname, '../../tests/fixtures/csv-injection-test.csv')
fs.writeFileSync(csvPath, csvContent, 'utf-8')
// ... テスト実行 ...
fs.unlinkSync(csvPath)
```

- テスト失敗時に一時ファイルが残る
- 並列実行時にファイル名競合の可能性
- `tests/fixtures/` ディレクトリが `.gitignore` に含まれていない場合、git に混入

**推奨改善**:
```typescript
// Playwrightのbuffer upload機能を使用
const csvBuffer = Buffer.from(csvContent, 'utf-8')
await fileInput.setInputFiles({
  name: 'test.csv',
  mimeType: 'text/csv',
  buffer: csvBuffer,
})
```

**対応**: DA に buffer upload への変更を依頼（P1）

---

#### 5. [csv/import-errors.spec.ts:43] Shift-JIS エンコード生成の誤り

**重大度**: High  
**Laws違反**: L-TA-001（事故ケース正確性）

**問題**:
```typescript
const shiftJisContent = Buffer.from('日付,金額,摘要\n2025-01-15,1000,テスト', 'shift_jis')
```

Node.js の `Buffer.from()` は `'shift_jis'` エンコードをサポートしていない（`'utf-8'`, `'utf16le'`, `'latin1'` のみ）。この行は実際には UTF-8 として処理されるため、**テストが正しく事故ケースを検証できていない**。

**修正必須**:
```typescript
import iconv from 'iconv-lite'

const shiftJisContent = iconv.encode('日付,金額,摘要\n2025-01-15,1000,テスト', 'shift_jis')
```

**対応**: DA に即座修正を依頼（BLOCKER）

---

#### 6. [settlement/calculation-boundaries.spec.ts:22-39] グループ作成の重複ロジック

**重大度**: High  
**Laws違反**: なし（保守性）

**問題**:
- `beforeEach` でグループ存在チェック → 作成が毎テストで実行される
- `getGroupId()` ヘルパーを2回呼び出し
- コードの意図が不明瞭

**推奨改善**:
```typescript
test.beforeEach(async ({ page }) => {
  await loginUser(page, testUser)
  
  if (!groupId) {
    await ensureGroupExists(page, testUser.id!, {
      name: 'Settlement Test Group',
      ratioA: 50,
    })
    groupId = (await getGroupId(testUser.id!))!
  }
})
```

**対応**: 次イテレーションでリファクタリング推奨

---

#### 7. [settlement/calculation-boundaries.spec.ts:39-95] 負担割合バリデーションの UI依存

**重大度**: High  
**Laws違反**: L-BR-001（計算ロジック検証が不完全）

**問題**:
```typescript
test('負担割合の合計が110%の場合エラーメッセージが表示される', async ({ page }) => {
  await page.fill('input[name="ratioA"]', '60')
  await page.fill('input[name="ratioB"]', '50')  // UI上では自動補正される可能性
  await page.click('button[type="submit"]')
  
  const errorMessage = await page.getByText(/100%|合計|割合/).isVisible()
  expect(errorMessage).toBeTruthy()
})
```

UIレイヤーでの検証に依存しており、**バックエンドAPIの直接検証が欠如**。L-BR-001 の制約「負担割合の合計 = 100%」をAPIレベルで検証すべき。

**推奨改善**:
```typescript
// API直接テストを追加
test('API: 負担割合110%はバリデーションエラー', async ({ request }) => {
  const response = await request.post('/api/groups', {
    data: { groupName: 'Test', ratioA: 60, ratioB: 50 },
  })
  
  expect(response.status()).toBe(400)
  const body = await response.json()
  expect(body.error.code).toBe('E_VALIDATION_001')
})
```

**対応**: Phase 3 で API unit test 追加を推奨

---

#### 8. [settlement/calculation-boundaries.spec.ts:98-183] 精算金額アサーションの脆弱性

**重大度**: High  
**Laws違反**: L-CX-001（計算精度100%）

**問題**:
```typescript
const settlementText = await page.locator('[data-testid="settlement-amount"]').textContent()
if (settlementText) {
  const amount = parseInt(settlementText.replace(/[^0-9]/g, ''))
  expect(amount).toBe(670)
}
```

- `if (settlementText)` により、要素不在時にテストがパスしてしまう（false positive）
- L-CX-001「計算精度100%」を検証するには、**要素の存在が必須条件**

**修正必須**:
```typescript
const settlementAmount = await page
  .locator('[data-testid="settlement-amount"]')
  .textContent()

expect(settlementAmount).not.toBeNull()
const amount = parseInt(settlementAmount!.replace(/[^0-9]/g, ''))
expect(amount).toBe(670)
```

**対応**: DA に即座修正を依頼

---

### Medium

#### 9. [attack-injection.spec.ts:233] 数式パターンマッチの過剰

**重大度**: Medium  
**Laws違反**: なし（テスト正確性）

**問題**:
```typescript
const formulaTransactions = transactions.data?.filter((t: { description: string }) => 
  /^[\+\-@]/.test(t.description)
)
expect(formulaTransactions?.length || 0).toBe(0)
```

エスケープ後の文字列は `'+'`, `'-'`, `'@'` で始まるため、このアサーションは常に失敗する可能性。

**推奨改善**:
```typescript
// エスケープ後は "'" プレフィックスがあるべき
expect(formulaTransactions.every(t => t.description.startsWith("'"))).toBeTruthy()
```

**対応**: 次イテレーションで精緻化

---

#### 10. [attack-auth.spec.ts:7] storageState設定の不整合

**重大度**: Medium  
**Laws違反**: なし（テスト設計）

**問題**:
```typescript
test.describe('ATK-001: 未認証ページアクセス防御', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  // ...
})
```

一方、ATK-002 は `loginUser()` を使用しており、認証状態管理が統一されていない。

**推奨改善**:
全攻撃テストで `test.use()` による明示的な認証状態制御を統一。

**対応**: 次イテレーションで標準化

---

#### 11. [all files] エラーメッセージの多言語対応不備

**重大度**: Medium  
**Laws違反**: L-CX-003（エラーメッセージ明確性）

**問題**:
複数テストで英語/日本語両対応の正規表現を使用しているが、L-CX-003 では「日本語エラーメッセージ」が必須。

```typescript
await page.getByText(/UTF-8|文字コード|エンコード|無効/i)
```

実装がまだ英語エラーを返している可能性があり、テストが本来の意図を検証できていない。

**推奨改善**:
仕様書で日本語メッセージを明記し、テストは厳密に日本語のみマッチさせる。

```typescript
await expect(page.getByText('UTF-8形式で保存されたファイルをご利用ください')).toBeVisible()
```

**対応**: Phase 3 でエラーメッセージ仕様を SDA と合意

---

## 仕様充足チェック

### spec.md 受入基準

| 基準 | 達成 | 備考 |
|------|------|------|
| Phase 1 攻撃ケース5+実装 | ⚠ 80% | 11ケース実装済みだが、ATK-005（レート制限）が失敗 |
| Phase 2 事故ケース2+実装 | ❌ 0% | INC-001 が API不在により実行不能 |
| Phase 2 境界ケース12+実装 | ⚠ 50% | 12ケース実装済みだが、6ケースが API不在により失敗 |
| L-TA-001 全カテゴリ充足 | ❌ 60% | 事故ケース検証が不完全 |
| テスト独立実行可能 | ✓ | beforeEach/afterAll でデータクリーンアップ実装 |
| Laws 100%準拠 | ⚠ 80% | L-SC-004, L-BR-006 の一部未実装 |

### Laws 遵守状況

#### L-SC-001: 認証・認可の厳格化
- ✓ ATK-001（未認証アクセス防御）: 4テストすべてパス
- ✓ ATK-002（IDOR防御）: 実装済み（実行結果待ち）
- 判定: **Pass**

#### L-SC-002: インジェクション対策
- ✓ ATK-003（XSS防御）: 3ケース実装済み
- ✓ ATK-004（CSVインジェクション防御）: 3ケース実装済み
- 判定: **Pass**

#### L-SC-004: レート制限とDoS対策
- ❌ ATK-005（ログイン5回/15分）: レート制限未実装により失敗
- 判定: **Fail** → **BLOCKER**

#### L-BR-001: 精算計算ルール
- ✓ BND-001（負担割合バリデーション）: 3ケース実装済み
- ✓ BND-004（端数処理）: 3ケース実装済み
- ⚠ アサーションの脆弱性あり（Finding #8）
- 判定: **Conditional Pass**（修正条件付き）

#### L-BR-004: 月次集計ルール
- ✓ BND-005（月またぎ）: 2ケース実装済み
- 判定: **Pass**

#### L-BR-006: CSV取り込みルール
- ❌ INC-001（文字化けCSV）: API不在により実行不能
- ❌ BND-002（行数上限）: API不在により実行不能
- ❌ BND-003（ファイルサイズ上限）: API不在により実行不能
- 判定: **Fail** → **BLOCKER**

#### L-TA-001: 評価データセット
- ✓ 典型ケース: 15+ → 充足
- ⚠ 境界ケース: 17+ 実装済みだが 6ケース失敗 → 実質11ケース
- ❌ 事故ケース: 2実装済みだが すべて失敗 → 実質0ケース
- ✓ グレーケース: 1+ → 充足
- ⚠ 攻撃ケース: 11実装済みだが 1ケース失敗 → 実質10ケース
- 判定: **Fail**（事故ケース0は要件未達）

---

## 残存リスク

### P0（リリースブロッカー）

1. **レート制限未実装 (L-SC-004)**
   - リスク: ブルートフォース攻撃に対して無防備
   - 影響範囲: 認証エンドポイント全体
   - 推定工数: 0.5日（ミドルウェア実装 + テスト修正）

2. **CSV取り込みAPI不在 (L-BR-006)**
   - リスク: 境界値・事故ケースが未検証
   - 影響範囲: CSV取り込み機能全体
   - 推定工数: 1日（/api/me 実装 OR テスト修正）

3. **Shift-JIS テスト不正確 (L-TA-001)**
   - リスク: 実際の文字化けバグを検出できない
   - 影響範囲: INC-001（事故ケース）
   - 推定工数: 0.5日（iconv-lite 導入 + テスト修正）

### P1（次イテレーション対応）

4. **精算金額アサーションの脆弱性 (L-CX-001)**
   - リスク: False positive によりバグを見逃す可能性
   - 推定工数: 0.25日

5. **ファイルシステム操作の残骸**
   - リスク: 並列実行時の競合、git 混入
   - 推定工数: 0.5日

6. **IDOR テストの複雑性過剰**
   - リスク: 保守性低下、実行時間増大
   - 推定工数: 0.5日（リファクタリング）

---

## 推奨アクション

### 必須（リリース前）

1. **DA へ依頼: レート制限実装**
   - 対象: `app/api/auth/[...nextauth]/route.ts` または middleware
   - 要件: L-SC-004 準拠（5回/15分）
   - 検証: `e2e/security/attack-auth.spec.ts:131` が pass すること

2. **DA へ依頼: `/api/me` 実装 OR テスト修正**
   - Option A: `/api/me` エンドポイント実装
   - Option B: `e2e/csv/import-errors.spec.ts:26` を既存 API に置き換え
   - 検証: 6テストすべてが実行可能になること

3. **DA へ依頼: Shift-JIS エンコード修正**
   - 対象: `e2e/csv/import-errors.spec.ts:43`
   - 要件: `iconv-lite` を使用した正しいエンコード
   - 検証: INC-001 が意図通り文字化けエラーを検出すること

4. **DA へ依頼: 精算金額アサーション強化**
   - 対象: `e2e/settlement/calculation-boundaries.spec.ts:98-183`
   - 修正: `if (settlementText)` を削除し、`expect().not.toBeNull()` を追加
   - 検証: 要素不在時にテストが失敗すること

### 推奨（次イテレーション）

5. **SDA と協議: エラーメッセージ仕様明確化**
   - 議題: 全エラーメッセージの日本語化要件
   - 成果物: `spec.md` へのエラーメッセージ一覧追加

6. **DA へ依頼: ファイルシステム操作の削除**
   - 対象: `e2e/security/attack-injection.spec.ts`
   - 修正: `setInputFiles({ buffer })` へ変更

7. **DA へ依頼: IDOR テストのリファクタリング**
   - 成果物: `e2e/fixtures/attack-scenarios.ts` 作成

---

## 判定根拠

### REQUEST_CHANGES の理由

以下の **BLOCKER** レベル問題が存在するため、現状ではリリース不可と判断：

1. **Critical #2**: L-SC-004（レート制限）未実装
   - セキュリティ必須要件の欠如
   - 攻撃ケース要件未達により L-TA-001 違反

2. **Critical #1**: `/api/me` 不在により 6テスト実行不能
   - L-BR-006（CSV取り込み）の境界値・事故ケースが未検証
   - L-TA-001 事故ケース要件（1+）が実質0

3. **High #5**: Shift-JIS テスト不正確
   - L-TA-001 事故ケースの信頼性欠如
   - 実際のバグを検出できない

### Conditional Approval の条件

上記3点を修正し、以下を確認できれば **APPROVE** へ変更可能：

```bash
# すべてのテストがパス
npm run test:e2e -- e2e/security/ e2e/csv/ e2e/settlement/

# レート制限が機能することを確認
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -H "Content-Type: application/json" \
  # 6回目で 429 が返ること

# CSV エラーケースが正しく検証されることを確認
npx playwright test e2e/csv/import-errors.spec.ts --reporter=list
# INC-001: Shift-JIS → エラー検出
# BND-002: 10,001行 → エラー検出
# BND-003: 5.1MB → エラー検出
```

---

**レビュー実施日**: 2025-12-20  
**レビュー担当**: Quality Assurance Agent  
**次回アクション**: DA への修正依頼（上記3点）
