# トラブルシューティングガイド

本ドキュメントは、デプロイ・運用時によくある問題とその解決方法をまとめています。

---

## デプロイ時の問題

### 1. Vercelビルドエラー: "Type error: Cannot find module..."

**症状:**
```
Type error: Cannot find module '@/lib/settlement' or its corresponding type declarations.
```

**原因:** TypeScriptのパス解決エラー

**解決策:**
```bash
# ローカルで確認
npm run type-check

# tsconfig.jsonの確認
cat tsconfig.json | grep "paths"

# 期待される設定
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# 修正後
git add tsconfig.json
git commit -m "fix: resolve TypeScript path aliases"
git push
```

---

### 2. Vercelビルドエラー: "npm ERR! missing script: build"

**症状:**
```
npm ERR! missing script: build
```

**原因:** package.jsonにbuildスクリプトがない

**解決策:**
```bash
# package.jsonを確認
cat package.json | grep '"build"'

# 期待される設定
"scripts": {
  "build": "next build"
}

# 修正後
git add package.json
git commit -m "fix: add build script"
git push
```

---

### 3. Neon接続エラー: "connect ETIMEDOUT"

**症状:**
```
Error: connect ETIMEDOUT xxx.xxx.xxx.xxx:5432
```

**原因:** 
- DATABASE_URLの形式エラー
- Neonデータベースがスリープ状態

**解決策:**

**手順1: 接続文字列の確認**
```bash
# 正しい形式
postgresql://user:password@ep-xxx.ap-northeast-1.aws.neon.tech/dbname?sslmode=require

# よくある間違い
postgresql://user:password@localhost:5432/dbname  # ローカルDB指定
postgresql://user@ep-xxx.../dbname                # パスワード欠落
```

**手順2: Neonダッシュボードで確認**
1. [Neon Dashboard](https://console.neon.tech/)にログイン
2. プロジェクトを開く → 自動的にウェイクアップ
3. "Connection Details"で接続文字列を再コピー
4. Vercel環境変数を更新 → Redeploy

**手順3: 接続テスト**
```bash
# ローカルから接続テスト
export DATABASE_URL="postgresql://..."
npx ts-node -e "
import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => console.log('Connected!')).catch(console.error);
"
```

---

### 4. Vercel環境変数が反映されない

**症状:**
デプロイ後もアプリが環境変数を読み込めない

**原因:** 
- 環境変数追加後にRedeployしていない
- 環境変数のEnvironmentが間違っている（Preview/Productionの違い）

**解決策:**

**手順1: 環境変数の確認**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. 全ての必須変数が"Production"に設定されているか確認：
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

**手順2: Redeploy**
1. Vercel Dashboard → Deployments
2. 最新デプロイの"..."メニュー → "Redeploy"
3. "Use existing Build Cache"のチェックを外す
4. "Redeploy"クリック

---

## 認証関連の問題

### 5. ログイン後すぐにログアウトされる

**症状:**
ログインボタンクリック後、ダッシュボードに遷移するがすぐに`/login`にリダイレクトされる

**原因:**
- `NEXTAUTH_URL`が本番URLと一致していない
- Cookie設定の問題（`secure`属性とHTTP/HTTPSの不一致）

**解決策:**

**手順1: NEXTAUTH_URLの確認**
```bash
# Vercel環境変数を確認
# ✓ 正しい: https://your-app.vercel.app
# ✗ 間違い: http://localhost:3000
# ✗ 間違い: https://your-app.vercel.app/ (末尾スラッシュ)
```

**手順2: NextAuth設定確認**
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ...
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' // 本番ではtrue
      }
    }
  }
}
```

**手順3: ブラウザキャッシュクリア**
1. DevTools → Application → Cookies → `next-auth.session-token`を削除
2. 再度ログイン試行

---

### 6. "NEXTAUTH_SECRET is not defined"エラー

**症状:**
```
Error: Please define NEXTAUTH_SECRET environment variable
```

**原因:** 環境変数が未設定

**解決策:**

**手順1: NEXTAUTH_SECRET生成**
```bash
openssl rand -base64 64
# 例: 8Xg2K9pL4m...（64文字以上のランダム文字列）
```

**手順2: Vercel環境変数追加**
1. Vercel Dashboard → Settings → Environment Variables
2. Key: `NEXTAUTH_SECRET`
3. Value: 生成した文字列
4. Environment: Production
5. "Save" → Redeploy

**Laws準拠確認:**
- [ ] L-SC-005: NEXTAUTH_SECRETが64文字以上

---

## データベース関連の問題

### 7. "relation 'users' does not exist"エラー

**症状:**
```
error: relation "users" does not exist
```

**原因:** マイグレーションが未実行

**解決策:**

**方法1: Drizzle Pushでスキーマ適用**
```bash
# ローカルから本番DBに接続
export DATABASE_URL="postgresql://..."
npm run db:push
```

**方法2: SQL手動実行**
1. Neon Dashboard → SQL Editor
2. `/Users/takuya.kurihara/workspace/domestic-account-booking/drizzle/0000_sweet_the_initiative.sql`を開く
3. 全てのSQLをコピー → SQL Editorにペースト
4. "Run"クリック

**確認:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'custom_auth');

-- 期待される結果
-- custom_auth.users
-- public.users
-- public.groups
-- public.transactions
-- public.invitations
```

---

### 8. "duplicate key value violates unique constraint"

**症状:**
```
error: duplicate key value violates unique constraint "users_email_unique"
```

**原因:** 同じメールアドレスで複数回ユーザー作成を試行

**解決策:**

**手順1: 既存データ確認**
```sql
-- Neon SQL Editorで実行
SELECT id, email, created_at 
FROM custom_auth.users 
WHERE email = 'demo-a@example.com';
```

**手順2: 既存ユーザー削除（必要な場合のみ）**
```sql
-- 注意: カスケード削除により関連データも削除される
DELETE FROM custom_auth.users WHERE email = 'demo-a@example.com';
```

**手順3: シードスクリプト再実行**
```bash
export DATABASE_URL="postgresql://..."
npx tsx scripts/seed-local.ts
```

**Laws準拠確認:**
- [ ] L-LC-001: 削除前にバックアップ確認（個人情報保護）

---

### 9. "violates check constraint ratio_sum"

**症状:**
```
error: new row for relation "groups" violates check constraint "ratio_sum"
```

**原因:** 負担割合の合計が100%でない

**解決策:**

**手順1: 現在の割合を確認**
```sql
SELECT id, name, ratio_a, ratio_b, (ratio_a + ratio_b) as sum
FROM groups;
```

**手順2: 割合を修正**
```sql
-- 合計が100%になるように修正
UPDATE groups 
SET ratio_a = 60, ratio_b = 40 
WHERE id = 'your-group-id';
```

**Laws準拠確認:**
- [ ] L-BR-001: 負担割合の合計が常に100%

---

## CSV取り込み関連の問題

### 10. "ファイルサイズが大きすぎます"エラー

**症状:**
CSVアップロード時に"ファイルサイズは5MB以下にしてください"エラー

**原因:** L-RV-002のファイルサイズ制限

**解決策:**

**手順1: ファイルサイズ確認**
```bash
ls -lh your-file.csv
# 例: -rw-r--r--  1 user  staff   6.2M Jan 15 10:00 your-file.csv
```

**手順2: ファイル分割**
```bash
# 行数確認
wc -l your-file.csv
# 例: 15000 your-file.csv

# 2つに分割（ヘッダー保持）
head -n 1 your-file.csv > header.csv
tail -n +2 your-file.csv | head -n 7500 > part1.csv
tail -n +2 your-file.csv | tail -n 7500 > part2.csv

# ヘッダー追加
cat header.csv part1.csv > upload1.csv
cat header.csv part2.csv > upload2.csv
```

**Laws準拠確認:**
- [ ] L-RV-002: ファイルサイズ5MB以下
- [ ] L-RV-002: 行数10,000行以下

---

### 11. "日付の形式が不正です"エラー

**症状:**
CSV取り込み時に特定の行で日付パースエラー

**原因:** サポートされていない日付形式

**解決策:**

**サポート形式:**
- `YYYY-MM-DD` (例: 2025-01-15)
- `YYYY/MM/DD` (例: 2025/01/15)
- `MM/DD/YYYY` (例: 01/15/2025)

**非サポート形式:**
- `Jan 15, 2025`
- `15-01-2025` (DD-MM-YYYY)

**手順1: CSVフォーマット確認**
```bash
head -n 5 your-file.csv
# 日付列を確認
```

**手順2: 日付フォーマット統一（Excel/Numbers）**
1. CSVをExcelで開く
2. 日付列を選択 → セルの書式設定
3. "ユーザー定義" → `YYYY-MM-DD`
4. CSV (UTF-8)で保存

---

### 12. Formula Injectionエラー（意図的な場合）

**症状:**
CSV取り込み後、`=SUM(A1:A10)`が`'=SUM(A1:A10)`に変換される

**原因:** L-SC-002のセキュリティ対策（Formula Injection防止）

**解決策:**

これは**意図された動作**です。セキュリティのため、以下の文字で始まるフィールドは自動的にエスケープされます：

- `=`（イコール）
- `+`（プラス）
- `-`（マイナス）
- `@`（アットマーク）

**正常な金額（例: `-1000`）の処理:**
金額列は数値として解析されるため、マイナス記号は正常に処理されます。

**Laws準拠確認:**
- [ ] L-SC-002: Formula Injectionが防止されている

---

## パフォーマンス関連の問題

### 13. ページ読み込みが遅い（3秒以上）

**症状:**
Vercelデプロイ後、ページ読み込みに3秒以上かかる

**原因:**
- Neonデータベースがスリープから復帰中
- クエリの最適化不足
- 不要なクライアントサイドJavaScript

**解決策:**

**手順1: Neonコネクションプーリング有効化**
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { 
  max: 10,           // 最大接続数
  idle_timeout: 20,  // アイドルタイムアウト（秒）
})

export const db = drizzle(client)
```

**手順2: クエリの最適化**
```typescript
// NG: N+1クエリ
const transactions = await db.query.transactions.findMany()
for (const tx of transactions) {
  const user = await db.query.users.findFirst({ where: eq(users.id, tx.userId) })
}

// OK: JOIN使用
const transactions = await db.query.transactions.findMany({
  with: { user: true }
})
```

**手順3: Lighthouse確認**
```bash
npm run lighthouse
# パフォーマンススコア確認
```

---

### 14. "429 Too Many Requests"エラー

**症状:**
API呼び出し時に429エラー

**原因:** L-SC-004のレート制限に到達

**解決策:**

**確認:**
```typescript
// src/middleware.ts または API routeでレート制限確認
// ログイン: 5回/15分
// POST /api/transactions: 10回/1分
// GET: 100回/1分
```

**対処:**
1. 過度なAPI呼び出しを削減（バッチ処理等）
2. クライアント側でキャッシュ実装
3. 必要に応じてレート制限を緩和（Laws遵守の範囲内で）

**Laws準拠確認:**
- [ ] L-SC-004: レート制限が適切に機能している

---

## Laws違反検出時の対応

### 15. Laws違反を発見した場合

**手順:**

1. **実装を中断**
2. **以下のフォーマットで報告:**

```markdown
⚠️ Laws違反検出

種別: [衝突|不在|適用不能]
該当ルール: L-XX-NNN
状況: [具体的な説明]
影響: [実装への影響]
提案: [可能であれば解決案]
証跡: [スクリーンショット/ログ/該当コード]
```

3. **例: L-CX-001違反（精算計算エラー）**
```markdown
⚠️ Laws違反検出

種別: 不在
該当ルール: L-CX-001（精算金額の正確性）
状況: 端数処理が`Math.floor()`になっており、仕様の`Math.round()`（四捨五入）と異なる
影響: 精算金額が最大±0.5円ずれる可能性
提案: src/lib/settlement.tsの計算式を修正
証跡: 
  - ファイル: src/lib/settlement.ts:15
  - 現在: `Math.floor(balanceA)`
  - 期待: `Math.round(balanceA)`
```

4. **修正後の確認:**
```bash
# Laws準拠テスト実行
npm test -- settlement.test.ts

# Laws準拠チェック
npm run check:expressions  # 禁止表現チェック
npm run type-check         # 型チェック
npm run lint               # コーディング規約
```

---

## サポート情報

### ログ確認方法

**Vercel Logs:**
1. Vercel Dashboard → Project → Functions
2. 最新のログを確認
3. エラースタックトレースをコピー

**Neon Query Logs:**
1. Neon Dashboard → Monitoring
2. "Query History"でスロークエリ確認

### Laws準拠ドキュメント

- [Laws README](/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/README.md)
- [顧客体験ルール](/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/01-customer-experience.md)
- [セキュリティルール](/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/04-security.md)

---

## よくある質問

### Q1: ローカルでは動くのにVercelで動かない

**A:** 環境変数の設定を確認してください。Vercelの環境変数はローカルの`.env.local`とは別です。

### Q2: Neonの無料プランの制限は？

**A:** 
- データベースサイズ: 512MB
- アクティブ時間: 100時間/月
- 自動スリープ: 5分間非アクティブ後

制限に達した場合は有料プランへのアップグレードを検討してください。

### Q3: Laws違反を修正する権限は？

**A:** 
- コードの修正: Coding Agentが実施可能
- `docs/laws/`の編集: 人間ユーザーのみ（L-OC-005）

---

**最終更新:** 2025-12-30
