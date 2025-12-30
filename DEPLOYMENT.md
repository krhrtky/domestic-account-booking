# Deployment Guide - Vercel + Neon PostgreSQL

本ドキュメントは、家計精算アプリをVercel + Neon PostgreSQLにデプロイする手順を説明します。

---

## Phase 3: Vercel + Neonデプロイ

### 前提条件

- GitHubアカウント
- Vercelアカウント（未作成の場合はGitHubでサインアップ可能）
- Neonアカウント（無料プランで開始可能）

---

## Step 1: Neon PostgreSQL Database セットアップ

### 1.1 Neonアカウント作成

1. [Neon公式サイト](https://neon.tech/)にアクセス
2. "Sign Up"をクリック → GitHubアカウントでサインアップ
3. 無料プランで開始（クレジットカード不要）

### 1.2 Neonプロジェクト作成

1. Neonダッシュボードで"Create Project"をクリック
2. 以下を入力：
   - **Project name:** `domestic-account-booking-prod`（任意の名前）
   - **Region:** Tokyo（低レイテンシーのため）
   - **PostgreSQL version:** 16（最新）
3. "Create Project"をクリック

### 1.3 データベース接続情報取得

1. プロジェクト作成後、"Dashboard"タブで接続情報を確認
2. **Connection String**をコピー（以下の形式）:
   ```
   postgresql://user:password@ep-xxx.ap-northeast-1.aws.neon.tech/dbname?sslmode=require
   ```
3. この接続文字列を安全な場所に保存

**重要:** 接続文字列には認証情報が含まれるため、絶対にGitにコミットしないこと（L-SC-003準拠）

---

## Step 2: マイグレーション実行

### 2.1 ローカルで接続テスト

```bash
cd /Users/takuya.kurihara/workspace/domestic-account-booking

# 環境変数を一時的に設定
export DATABASE_URL="postgresql://user:password@ep-xxx.ap-northeast-1.aws.neon.tech/dbname?sslmode=require"

# Drizzle Pushでスキーマ適用
npm run db:push
```

**出力例（成功時）:**
```
[✓] Changes applied
```

### 2.2 マイグレーションSQLの手動実行（代替方法）

Drizzle Pushが失敗する場合、手動でSQLを実行：

1. Neonダッシュボード → "SQL Editor"タブを開く
2. `/Users/takuya.kurihara/workspace/domestic-account-booking/drizzle/0000_sweet_the_initiative.sql`の内容をコピー
3. SQL Editorにペーストして"Run"をクリック
4. 全85行が正常に実行されることを確認

### 2.3 スキーマ確認

SQL Editorで以下を実行してテーブル作成を確認：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' OR table_schema = 'custom_auth';
```

**期待される出力:**
```
users (custom_auth schema)
users (public schema)
groups
transactions
invitations
```

### 2.4 スキーマ検索パス設定（自動適用）

アプリケーションは自動的に `search_path=custom_auth,public` を設定します（`src/db/client.ts`）。
手動設定は不要ですが、検証は以下で可能です：

```sql
SHOW search_path;
```

**期待される出力:**
```
custom_auth, public
```

**重要:** このスキーマ設定により以下が実現されます（L-SC-001準拠）：
- NextAuth認証テーブル（`custom_auth.users`）への安全なアクセス
- アプリケーションテーブル（`public.*`）への通常アクセス
- スキーマ間の分離によるセキュリティ強化

---

## Step 3: Vercel デプロイ設定

### 3.1 GitHubリポジトリの準備

```bash
cd /Users/takuya.kurihara/workspace/domestic-account-booking

# 変更をコミット（まだの場合）
git add .
git commit -m "feat: prepare for Vercel deployment"

# GitHubにプッシュ
git push origin master
```

### 3.2 Vercelプロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. "Add New" → "Project"をクリック
3. GitHubリポジトリ`domestic-account-booking`をインポート
4. プロジェクト設定：
   - **Framework Preset:** Next.js（自動検出）
   - **Root Directory:** `.`（デフォルト）
   - **Build Command:** `npm run build`（デフォルト）
   - **Output Directory:** `.next`（デフォルト）

### 3.3 環境変数設定

Vercelプロジェクト設定画面で"Environment Variables"に以下を追加：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://user:password@ep-xxx...?sslmode=require` | Production |
| `NEXTAUTH_SECRET` | ランダムな64文字以上の文字列 | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |

**NEXTAUTH_SECRET生成方法:**
```bash
openssl rand -base64 64
```

**DATABASE_URL注意事項:**
- `?sslmode=require` パラメータを必ず含める（Neonの要件）
- スキーマ設定（`search_path`）は不要（アプリケーションで自動設定）
- 接続文字列にパスワードが含まれるため、環境変数のみに保存

**セキュリティ注意（L-SC-003, L-SC-005準拠）:**
- 環境変数は"Production"環境のみに設定
- `DATABASE_URL`は絶対にソースコードに含めない
- `NEXTAUTH_SECRET`は推測不可能なランダム文字列を使用
- スキーマアクセスは `search_path=custom_auth,public` で制御（L-SC-001準拠）

---

## 環境変数設定のDO/DONT例

### DO: 正しい設定例

**1. DATABASE_URL - 完全な接続文字列を使用**
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.ap-northeast-1.aws.neon.tech/dbname?sslmode=require"
```
- ホスト名、ポート、データベース名、パラメータを全て含める
- `sslmode=require` パラメータは必須（Neon接続要件）
- スキーマ設定（`search_path`）は不要（アプリケーションが自動設定）

**2. NEXTAUTH_SECRET - 十分な長さとランダム性**
```bash
openssl rand -base64 64
NEXTAUTH_SECRET="生成された64文字以上のランダム文字列"
```
- 最低64文字以上のランダム文字列
- 英数字+記号を含む高エントロピー文字列

**3. NEXTAUTH_URL - デプロイ先のURL**
```bash
NEXTAUTH_URL="https://your-app.vercel.app"
```
- HTTPSプロトコルを使用（本番環境）
- ドメイン名のみ（パスなし）

### DONT: 避けるべき設定例

**1. DATABASE_URL - 不完全な設定**
```bash
DATABASE_URL="postgresql://localhost/mydb"
```
- ローカルホストでは本番動作しない
- `sslmode=require` パラメータが欠落（Neon接続失敗）
- 認証情報（user:password）が欠落

**2. DATABASE_URL - 平文でコミット**
```typescript
// ❌ 絶対にやらないこと
export const DATABASE_URL = "postgresql://user:password@..."
const dbUrl = "postgresql://user:pass@host/db"
```
- ソースコードに直接記述は L-SC-003 違反
- Gitにコミットすると永久に残る（削除しても履歴に残る）
- 公開リポジトリの場合、即座に悪用される

**3. DATABASE_URL - 不正なスキーマパラメータ**
```bash
DATABASE_URL="postgresql://user:password@host/db?search_path=public"
```
- `search_path` をURLパラメータで指定すると、アプリケーション設定と衝突
- `custom_auth` スキーマにアクセスできず認証エラー

**4. NEXTAUTH_SECRET - 弱いシークレット**
```bash
NEXTAUTH_SECRET="secret"
NEXTAUTH_SECRET="password123"
NEXTAUTH_SECRET="myapp"
```
- 短い文字列は推測可能（L-SC-005 違反）
- 辞書攻撃で破られる
- 最低64文字以上必須

**5. NEXTAUTH_URL - 誤ったプロトコル・パス**
```bash
NEXTAUTH_URL="http://your-app.vercel.app"
NEXTAUTH_URL="https://your-app.vercel.app/api/auth"
```
- HTTPは本番環境で使用不可（セキュリティリスク）
- パス含めるとコールバックURLが不正になる

**6. 環境変数をログ出力**
```typescript
// ❌ 絶対にやらないこと
console.log('DATABASE_URL:', process.env.DATABASE_URL)
logger.info({ databaseUrl: process.env.DATABASE_URL })
```
- ログに機密情報が残る（L-SC-003 違反）
- CloudWatch/Vercel Logsに永続化される

**7. クライアント側で環境変数を使用**
```typescript
// ❌ 絶対にやらないこと（Next.jsの場合）
export const config = {
  databaseUrl: process.env.DATABASE_URL  // サーバーサイドのみで使用可能
}
```
- `NEXT_PUBLIC_` プレフィックスがない環境変数はクライアントで使用不可
- クライアント側に露出すると情報漏洩

### 環境変数設定チェックリスト

デプロイ前に以下を確認してください：

- [ ] `DATABASE_URL` が Vercel 環境変数に設定されている
- [ ] `DATABASE_URL` に `sslmode=require` パラメータが含まれている
- [ ] `DATABASE_URL` がソースコードに含まれていない（`git grep "postgresql://"` で確認）
- [ ] `NEXTAUTH_SECRET` が64文字以上のランダム文字列である
- [ ] `NEXTAUTH_SECRET` が `openssl rand -base64 64` で生成されている
- [ ] `NEXTAUTH_URL` がデプロイ先のHTTPS URLである（例: `https://your-app.vercel.app`）
- [ ] 環境変数が "Production" 環境にのみ設定されている
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] ログ出力に環境変数が含まれていない
- [ ] エラーメッセージに接続文字列が含まれていない

### 関連Laws

本セクションの設定は以下のLawsに準拠します：

- **L-SC-003**: 機密情報の保護 - 環境変数で機密情報を管理、ログに出力しない
- **L-SC-001**: 認証・認可の厳格化 - スキーマアクセス制御（`search_path=custom_auth,public`）
- **L-LC-001**: 個人情報の適切な取り扱い - 接続文字列にPII含めない

詳細は [docs/laws/04-security.md](./docs/laws/04-security.md) および [docs/laws/03-legal-compliance.md](./docs/laws/03-legal-compliance.md) を参照してください。

### 3.4 デプロイ実行

1. "Deploy"ボタンをクリック
2. ビルドログを確認（3-5分程度）
3. デプロイ完了後、URLをクリックしてアクセス確認

**ビルド成功の確認ポイント:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Collecting page data
✓ Generating static pages
```

---

## Step 4: 本番データベース初期化

### 4.1 Seed実行（ユーザー作成）

Vercelデプロイ後、本番DBにシードユーザーを作成：

**方法1: ローカルから本番DBに接続**
```bash
# 本番DB URLを設定
export DATABASE_URL="postgresql://user:password@ep-xxx..."

# 環境変数でユーザー情報をカスタマイズ（推奨）
export SEED_USER_A_EMAIL="your-email-a@example.com"
export SEED_USER_A_PASSWORD="StrongPassword123!"
export SEED_USER_A_NAME="ユーザーA"

export SEED_USER_B_EMAIL="your-email-b@example.com"
export SEED_USER_B_PASSWORD="StrongPassword123!"
export SEED_USER_B_NAME="ユーザーB"

# シード実行
npx tsx scripts/seed-local.ts
```

**方法2: Neon SQL Editorで直接実行**
```sql
-- custom_auth.users にユーザー作成（パスワードはbcryptハッシュ化が必要）
-- 詳細は scripts/seed-local.ts を参照
```

### 4.2 ログイン確認

1. `https://your-app.vercel.app/login`にアクセス
2. 作成したユーザーでログイン
3. ダッシュボードが表示されることを確認

---

## トラブルシューティング

### ビルドエラー: "Type error: ..."

**原因:** TypeScriptの型エラー

**解決策:**
```bash
# ローカルで型チェック
npm run type-check

# エラー修正後、再度プッシュ
git add .
git commit -m "fix: resolve type errors"
git push
```

### デプロイ成功したがアプリが500エラー

**原因:** 環境変数の設定ミスまたはDB接続エラー

**確認手順:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`が正しく設定されているか確認
3. Neon Dashboardでデータベースが起動しているか確認（Autoスリープからの復帰）
4. Vercel Logs（Functions → ログ確認）でエラー詳細を確認

### データベース接続タイムアウト

**原因:** Neonの無料プランはアイドル時にスリープ

**解決策:**
1. Neon Dashboardでプロジェクトを開く → 自動的にウェイクアップ
2. 数秒待ってから再度アクセス
3. 頻繁に使用する場合は有料プラン検討

### NEXTAUTH_SECRET エラー

**エラーメッセージ:** "Please define NEXTAUTH_SECRET..."

**解決策:**
1. Vercel Dashboard → Environment Variables で`NEXTAUTH_SECRET`を確認
2. 未設定の場合は追加：
   ```bash
   openssl rand -base64 64
   ```
3. 環境変数追加後、Redeploy必須

### マイグレーション適用漏れ

**症状:** "relation 'users' does not exist"

**解決策:**
```bash
# Step 2.1を再実行
export DATABASE_URL="postgresql://..."
npm run db:push
```

---

## Laws準拠チェックポイント

| Law | 確認項目 | Status |
|-----|---------|--------|
| L-SC-003 | DATABASE_URLが環境変数のみに存在 | ✓ |
| L-SC-005 | NEXTAUTH_SECRETが64文字以上 | ✓ |
| L-RV-002 | Neon無料プラン使用（コスト制御） | ✓ |
| L-AS-004 | セキュリティヘッダー設定（Next.js自動） | ✓ |
| L-OC-001 | ビルドコマンドが`npm run build` | ✓ |

---

## 次のステップ

デプロイ完了後、[VERIFICATION.md](./VERIFICATION.md)の手順で動作検証を実施してください。
