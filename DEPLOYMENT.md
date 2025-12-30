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
| `DATABASE_URL` | `postgresql://user:password@ep-xxx...` | Production |
| `NEXTAUTH_SECRET` | ランダムな64文字以上の文字列 | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |

**NEXTAUTH_SECRET生成方法:**
```bash
openssl rand -base64 64
```

**セキュリティ注意（L-SC-003, L-SC-005準拠）:**
- 環境変数は"Production"環境のみに設定
- `DATABASE_URL`は絶対にソースコードに含めない
- `NEXTAUTH_SECRET`は推測不可能なランダム文字列を使用

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
