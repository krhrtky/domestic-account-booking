# 04. セキュリティルール (Security Laws)

## 目的

機密漏洩、プロンプトインジェクション、権限逸脱などのセキュリティリスクを防止する。

---

## L-SC-001: 認証・認可の厳格化

### ルール

1. すべての保護エンドポイントで認証チェックを行う
2. リソースアクセス時はグループ所属を検証する
3. セッションは適切な有効期限を設定する

### 認可マトリクス

| リソース | 未認証 | 認証済（グループ外） | 認証済（グループ内） |
|---------|-------|-------------------|-------------------|
| /api/transactions | ✗ | ✗ | ✓ |
| /api/groups/:id | ✗ | ✗ | ✓ |
| /api/settlement | ✗ | ✗ | ✓ |
| /api/auth/* | ✓ | ✓ | ✓ |

### 検証方法

```typescript
// e2e/auth/authorization.spec.ts

describe('L-SC-001: 認証・認可の厳格化', () => {
  describe('未認証アクセス', () => {
    it('未認証で/api/transactionsにアクセスすると401', async () => {
      const response = await fetch('/api/transactions');
      expect(response.status).toBe(401);
    });
  });

  describe('グループ外アクセス', () => {
    it('他グループのトランザクションにアクセスすると403', async () => {
      const userA = await loginAs('userA@example.com');
      const groupBTransaction = await getTransactionFromGroupB();

      const response = await fetch(`/api/transactions/${groupBTransaction.id}`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('セッション有効期限', () => {
    it('期限切れセッションでアクセスすると401', async () => {
      const expiredToken = createExpiredToken();

      const response = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: 'SESSION_EXPIRED',
      });
    });
  });
});
```

**ミドルウェア実装パターン:**

```typescript
// src/middleware.ts

export async function middleware(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // グループリソースへのアクセス検証
  const groupId = extractGroupIdFromPath(request.nextUrl.pathname);
  if (groupId && session.user.groupId !== groupId) {
    return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  return NextResponse.next();
}
```

---

## L-SC-002: インジェクション対策

### ルール

1. すべてのユーザー入力をサニタイズする
2. SQLクエリはパラメータ化する（Prisma/Drizzle使用時は自動）
3. HTML出力時はエスケープする（React使用時は自動）
4. CSVパース時は特殊文字を処理する

### 禁止事項

- 文字列連結によるSQLクエリ構築
- `dangerouslySetInnerHTML` の使用（必須の場合はDOMPurify適用）
- `eval()`, `new Function()` の使用
- ユーザー入力をファイルパスに直接使用

### 検証方法

```typescript
// src/lib/sanitize.test.ts

describe('L-SC-002: インジェクション対策', () => {
  describe('CSVインジェクション対策', () => {
    it('数式インジェクションをエスケープ', () => {
      const maliciousInput = '=CMD|calc.exe|A0';
      const sanitized = sanitizeCSVField(maliciousInput);

      expect(sanitized).not.toMatch(/^[=+\-@]/);
      expect(sanitized).toBe("'=CMD|calc.exe|A0");
    });

    it('改行インジェクションを除去', () => {
      const inputWithNewline = 'テスト\n悪意のある行';
      const sanitized = sanitizeCSVField(inputWithNewline);

      expect(sanitized).not.toContain('\n');
    });
  });

  describe('XSS対策', () => {
    it('HTMLタグはエスケープされる', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = escapeHtml(maliciousInput);

      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });
});
```

**静的解析ルール:**

```javascript
// eslint-plugin-security設定
// .eslintrc.js

module.exports = {
  plugins: ['security'],
  rules: {
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
  },
};
```

---

## L-SC-003: 機密情報の保護

### ルール

1. 環境変数で機密情報を管理する
2. ログに機密情報を出力しない
3. エラーレスポンスにスタックトレースを含めない
4. クライアントに内部情報を露出しない

### 機密情報定義

| 情報種別 | 保存場所 | ログ出力 | クライアント送信 |
|---------|---------|---------|----------------|
| DATABASE_URL | 環境変数 | ✗ | ✗ |
| SESSION_SECRET | 環境変数 | ✗ | ✗ |
| ユーザーパスワード | DB（ハッシュ化） | ✗ | ✗ |
| メールアドレス | DB | マスキング | 本人のみ |

### 検証方法

```typescript
// scripts/check-secrets.ts

import { glob } from 'glob';
import { readFileSync } from 'fs';

const SECRET_PATTERNS = [
  /(?:password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
  /(?:sk_live_|pk_live_|sk_test_|pk_test_)[a-zA-Z0-9]+/,
  /postgres:\/\/[^:]+:[^@]+@/,
];

async function checkHardcodedSecrets() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}');
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push(`${file}: 機密情報パターンを検出`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('L-SC-003 違反:');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }
}
```

```typescript
// src/lib/logger.test.ts

describe('L-SC-003: ログの機密情報マスキング', () => {
  it('パスワードフィールドはマスキングされる', () => {
    const log = createLogEntry({
      action: 'login',
      data: { email: 'test@example.com', password: 'secret123' },
    });

    expect(log.data.password).toBe('[REDACTED]');
  });

  it('メールアドレスは部分マスキングされる', () => {
    const log = createLogEntry({
      action: 'signup',
      data: { email: 'user@example.com' },
    });

    expect(log.data.email).toBe('u***@example.com');
  });
});
```

---

## L-SC-004: レート制限とDoS対策

### ルール

| エンドポイント | 制限 | ウィンドウ |
|--------------|------|-----------|
| /api/auth/login | 5回 | 15分 |
| /api/auth/signup | 3回 | 1時間 |
| /api/transactions (POST) | 10回 | 1分 |
| /api/* (GET) | 100回 | 1分 |

### 検証方法

```typescript
// src/lib/rate-limiter.test.ts

describe('L-SC-004: レート制限', () => {
  it('ログイン試行は15分間で5回まで', async () => {
    const ip = '192.168.1.1';

    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit('login', ip);
      expect(result.allowed).toBe(true);
    }

    const result = await checkRateLimit('login', ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('制限超過後は429を返す', async () => {
    // 制限を超過させる
    await exceedRateLimit('login', '192.168.1.2');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '192.168.1.2' },
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });
});
```

---

## L-SC-005: CSRFおよびセッション保護

### ルール

1. 状態変更リクエストにはCSRFトークンを必須とする
2. セッションCookieには適切な属性を設定する
3. セッション固定攻撃を防止する

### Cookie設定要件

```typescript
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7日
};
```

### 検証方法

```typescript
// e2e/security/csrf.spec.ts

describe('L-SC-005: CSRF保護', () => {
  it('CSRFトークンなしのPOSTは403', async () => {
    const session = await login();

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        Cookie: session.cookie,
        // CSRFトークンなし
      },
      body: JSON.stringify({ amount: 1000 }),
    });

    expect(response.status).toBe(403);
  });

  it('ログイン後はセッションIDが再生成される', async () => {
    const preLoginSession = await getSession();
    await login();
    const postLoginSession = await getSession();

    expect(preLoginSession.id).not.toBe(postLoginSession.id);
  });
});
```

---

## CI設定

```yaml
# .github/workflows/security.yml

name: Security Validation

on: [push, pull_request]

jobs:
  security-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check for hardcoded secrets
        run: npx ts-node scripts/check-secrets.ts

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run security ESLint rules
        run: npm run lint -- --plugin security

      - name: Run authorization tests
        run: npm test -- --grep "L-SC-001"

      - name: Run injection tests
        run: npm test -- --grep "L-SC-002"

      - name: Run rate limiter tests
        run: npm test -- --grep "L-SC-004"

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.9.0
        with:
          target: 'http://localhost:3000'
```

---

## 違反時の対応

1. **認証バイパス検出**: 即座にデプロイ停止、影響範囲調査、強制ログアウト
2. **機密情報漏洩**: シークレットローテーション、影響ユーザー通知
3. **インジェクション脆弱性**: パッチ適用まで該当機能を無効化
4. **DoS脆弱性**: WAFルール追加、レート制限強化
