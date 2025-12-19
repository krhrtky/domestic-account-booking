# L-SC-004: レート制限適用状況

本文書は、L-SC-004（レート制限とDoS対策）の実装状況を調査し、適用箇所と未適用箇所を明示する。

## 1. 調査概要

- **調査日**: 2025-12-15
- **対象Law**: L-SC-004
- **調査対象**: Server Actions、API Routes、Middleware
- **実装ファイル**: `src/lib/rate-limiter.ts`

## 2. レート制限実装の概要

### 2.1 実装コンポーネント

| ファイル | 役割 |
|---------|------|
| `src/lib/rate-limiter.ts` | 汎用レート制限ロジック（インメモリストア） |
| `app/actions/auth.ts` | 認証Server Actionsへの適用 |

### 2.2 実装済み機能

- インメモリMap型ストアによる制限カウント管理
- 識別子（email/IP）単位での制限
- ストア分離（login/signup）
- ウィンドウ満了時の自動リセット
- `retryAfter`秒数の返却

## 3. L-SC-004要求仕様

| エンドポイント | 期待値 | 識別子 |
|---------------|--------|--------|
| /api/auth/login | 5回/15分 | Email |
| /api/auth/signup | 3回/1時間 | IP |
| /api/transactions (POST) | 10回/1分 | User ID |
| /api/* (GET) | 100回/1分 | IP |

## 4. 実装状況詳細

### 4.1 認証エンドポイント

#### ✅ Login (実装済み)

**場所**: `app/actions/auth.ts:89-112`

```typescript
const rateLimitResult = checkRateLimit(normalizedEmail, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000
}, 'login')
```

| 項目 | 実装値 | 要求値 | 準拠 |
|------|--------|--------|------|
| 制限回数 | 5回 | 5回 | ✅ |
| ウィンドウ | 15分 | 15分 | ✅ |
| 識別子 | Email | Email | ✅ |

**注意点**:
- NextAuth経由のログイン（`/api/auth/[...nextauth]/route.ts`）はレート制限が**未適用**
- Server Action `logIn()` のみがレート制限対象

#### ⚠️ Signup (部分実装)

**場所**: `app/actions/auth.ts:37-41`

```typescript
const rateLimitResult = checkRateLimit(clientIP, {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000
}, 'signup')
```

| 項目 | 実装値 | 要求値 | 準拠 |
|------|--------|--------|------|
| 制限回数 | 3回 | 3回 | ✅ |
| ウィンドウ | **15分** | **1時間** | ❌ |
| 識別子 | IP | IP | ✅ |

**問題**:
- **ウィンドウが15分で実装されており、1時間（60分）の要求に未準拠**

### 4.2 Transactions エンドポイント

#### ❌ POST /api/transactions (未実装)

**影響範囲**: `app/actions/transactions.ts:31-86`

Server Action `uploadCSV()` には**レート制限が未適用**。

| 項目 | 実装値 | 要求値 | 準拠 |
|------|--------|--------|------|
| 制限回数 | - | 10回/1分 | ❌ |
| 識別子 | - | User ID | ❌ |

**リスク**:
- ユーザーが大量のCSVアップロードリクエストを短時間で送信可能
- DBへの高負荷リクエストが防止されていない

#### ❌ GET /api/* (未実装)

**影響範囲**: 
- `app/actions/transactions.ts:88-210` (`getTransactions`)
- `app/actions/transactions.ts:272-346` (`getSettlementData`)
- `app/actions/group.ts` 全般

全てのGET相当のServer Actionsに**レート制限が未適用**。

| 項目 | 実装値 | 要求値 | 準拠 |
|------|--------|--------|------|
| 制限回数 | - | 100回/1分 | ❌ |
| 識別子 | - | IP | ❌ |

**リスク**:
- 自動化スクレイピングや大量クエリによるDB負荷が防止されていない

### 4.3 その他のエンドポイント

#### DELETE/PUT 系 (未実装)

以下のServer Actionsには制限未適用：

| Action | ファイル | 操作 |
|--------|---------|------|
| `updateTransactionExpenseType` | transactions.ts:212 | UPDATE |
| `deleteTransaction` | transactions.ts:244 | DELETE |
| `invitePartner` | group.ts:81 | INSERT |
| `acceptInvitation` | group.ts:132 | UPDATE |
| `updateRatio` | group.ts:203 | UPDATE |

**推奨制限**: 10回/1分（POST相当）

## 5. API Routes の状況

### 5.1 NextAuth エンドポイント

**場所**: `app/api/auth/[...nextauth]/route.ts`

NextAuthが内部で処理するため、カスタムレート制限の適用が困難。

**現状**:
- `authorize()` callback内ではレート制限を適用していない
- `/api/auth/callback/credentials`への直接アクセスが保護されていない

**リスク**:
- ブルートフォース攻撃への耐性が不足

### 5.2 テストエンドポイント

**場所**: `app/api/test/revalidate/route.ts`

本番環境では無効化されているためレート制限不要。

## 6. Middleware の役割

**場所**: `middleware.ts`

現在の実装は**認証チェックのみ**で、レート制限機能は含まれていない。

## 7. テストカバレッジ

### 7.1 ユニットテスト

**場所**: `src/lib/rate-limiter.test.ts`

以下のシナリオをカバー：

| テスト項目 | 状態 |
|-----------|------|
| 初回リクエスト許可 | ✅ |
| 制限内リクエスト許可 | ✅ |
| 制限超過ブロック | ✅ |
| retryAfter計算 | ✅ |
| ウィンドウ満了後リセット | ✅ |
| ストア分離 | ✅ |
| 識別子分離 | ✅ |
| resetRateLimit動作 | ✅ |

### 7.2 統合テスト

**場所**: `src/lib/rate-limiter-auth.test.ts`

認証Server Actionsでの実動作テスト済み。

### 7.3 E2Eテスト

L-SC-004のE2Eテストは**未作成**。

## 8. 準拠状況サマリー

| エンドポイント | 期待値 | 実装状況 | 準拠 |
|---------------|--------|---------|------|
| Login (Server Action) | 5回/15分 | ✅ 実装済み | ✅ |
| Login (NextAuth) | 5回/15分 | ❌ 未実装 | ❌ |
| Signup | 3回/1時間 | ⚠️ 3回/15分 | ❌ |
| POST /api/transactions | 10回/1分 | ❌ 未実装 | ❌ |
| GET /api/* | 100回/1分 | ❌ 未実装 | ❌ |

### 8.1 BLOCKER級の問題

なし（現在は無料サービスのためDoSリスクは許容範囲）

### 8.2 MAJOR級の問題

1. **Signup ウィンドウ不一致**: 15分 → 1時間に修正必要
2. **Transactions POST 未保護**: 大量アップロードが可能

### 8.3 MINOR級の問題

1. **GET系全般の未保護**: スクレイピング対策なし
2. **NextAuth直接アクセスの未保護**: ブルートフォース攻撃への耐性不足

## 9. 推奨改善案

### 9.1 即時対応（MAJOR）

1. **Signup ウィンドウ修正**
   ```typescript
   // app/actions/auth.ts:38-40
   const rateLimitResult = checkRateLimit(clientIP, {
     maxAttempts: 3,
     windowMs: 60 * 60 * 1000  // 15分 → 1時間に変更
   }, 'signup')
   ```

2. **Transactions POST保護**
   ```typescript
   // app/actions/transactions.ts:31
   export async function uploadCSV(...) {
     const user = await requireAuth()
     
     // 追加
     const rateLimitResult = checkRateLimit(user.id, {
       maxAttempts: 10,
       windowMs: 60 * 1000
     }, 'csv-upload')
     
     if (!rateLimitResult.allowed) {
       return { error: `アップロード回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。` }
     }
     // ...
   }
   ```

### 9.2 短期改善（MINOR）

3. **GET系全般の保護**
   - Middlewareでグローバルレート制限を適用
   - IPベースで100回/1分を監視

4. **NextAuth保護**
   - `authorize()` callback内でレート制限チェック追加
   - または外部ツール（Cloudflare Rate Limiting等）で保護

### 9.3 長期改善

5. **永続化ストアへの移行**
   - インメモリMapからRedis/PostgreSQLへ移行
   - サーバー再起動時の制限リセットを防止

6. **分散レート制限**
   - 複数サーバーインスタンス環境での一貫性確保

## 10. 結論

**L-SC-004準拠状況**: ❌ 不完全

- **認証Server Actions**: 部分的に実装済みだが、Signup期間に不一致あり
- **Transactions/GET系**: 未実装
- **NextAuth直接アクセス**: 未保護

**優先度**:
1. Signup期間修正（MAJOR）
2. Transactions POST保護（MAJOR）
3. GET系保護（MINOR）
4. NextAuth保護検討（MINOR）

**想定工数**:
- MAJOR修正: 1-2時間（実装+テスト）
- MINOR修正: 4-8時間（Middleware改修+E2Eテスト）

---

**本調査はCoding Agentによる自動生成レポートです。コード修正は実施していません。**
