# 06. API仕様ルール (API Specification Laws)

## 目的

APIレスポンスの一貫性・予測可能性を確保し、フロントエンド・バックエンド間の契約を明確化する。

---

## L-AS-001: レスポンス標準フォーマット

### 成功レスポンス

```typescript
// 成功時の標準レスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

// 例: トランザクション一覧
{
  "success": true,
  "data": [
    {
      "id": "txn_123",
      "date": "2025-01-15",
      "amount": 1000,
      "description": "スーパー",
      "payerType": "UserA",
      "expenseType": "Household"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

### エラーレスポンス

```typescript
// エラー時の標準レスポンス
interface ErrorResponse {
  success: false;
  error: {
    code: string;         // E_XXX_NNN 形式
    message: string;      // ユーザー向けメッセージ（日本語）
    field?: string;       // バリデーションエラー時のフィールド名
    details?: unknown;    // 追加情報（開発環境のみ）
  };
}

// 例: バリデーションエラー
{
  "success": false,
  "error": {
    "code": "E_VALIDATION_001",
    "message": "金額は0以上の数値を入力してください",
    "field": "amount"
  }
}
```

### HTTPステータスコードマッピング

| ステータス | 用途 | エラーコードプレフィックス |
|-----------|------|-------------------------|
| 200 | 成功（GET, PUT, DELETE） | - |
| 201 | 作成成功（POST） | - |
| 400 | バリデーションエラー | E_VALIDATION_* |
| 401 | 認証エラー | E_AUTH_* |
| 403 | 権限エラー | E_PERM_* |
| 404 | リソース不在 | E_NOT_FOUND_* |
| 409 | 競合エラー | E_CONFLICT_* |
| 429 | レート制限 | E_RATE_LIMIT_* |
| 500 | サーバーエラー | E_INTERNAL_* |

### 検証方法

```typescript
// src/lib/api-response.test.ts

describe('L-AS-001: レスポンス標準フォーマット', () => {
  describe('成功レスポンス', () => {
    it('successフィールドがtrueである', async () => {
      const response = await fetch('/api/transactions');
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
    });

    it('ページネーション時はmetaを含む', async () => {
      const response = await fetch('/api/transactions?page=1&limit=20');
      const body = await response.json();

      expect(body.meta).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
      });
    });
  });

  describe('エラーレスポンス', () => {
    it('successフィールドがfalseである', async () => {
      const response = await fetch('/api/transactions/invalid-id');
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    });

    it('エラーコードは規定の形式', async () => {
      const response = await fetch('/api/transactions/invalid-id');
      const body = await response.json();

      expect(body.error.code).toMatch(/^E_[A-Z]+_\d{3}$/);
    });

    it('メッセージは日本語', async () => {
      const response = await fetch('/api/transactions/invalid-id');
      const body = await response.json();

      expect(body.error.message).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
    });
  });
});
```

---

## L-AS-002: 入力バリデーション仕様

### バリデーションルール

| フィールド | 型 | 制約 | エラーメッセージ |
|-----------|-----|------|-----------------|
| amount | number | 0以上、整数 | 金額は0以上の整数を入力してください |
| date | string | ISO8601形式 | 日付はYYYY-MM-DD形式で入力してください |
| description | string | 1-200文字 | 摘要は1〜200文字で入力してください |
| payerType | enum | UserA/UserB/Common | 支払元を選択してください |
| expenseType | enum | Household/Personal | 支出タイプを選択してください |
| ratioA | number | 0-100、整数 | 負担割合は0〜100の整数で入力してください |
| ratioB | number | 0-100、ratioA+ratioB=100 | 負担割合の合計は100%である必要があります |
| email | string | メール形式 | 有効なメールアドレスを入力してください |
| password | string | 8文字以上 | パスワードは8文字以上で入力してください |

### Zodスキーマ定義

```typescript
// src/lib/schemas.ts

import { z } from 'zod';

export const TransactionSchema = z.object({
  amount: z.number()
    .int({ message: '金額は整数で入力してください' })
    .min(0, { message: '金額は0以上で入力してください' }),

  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日付はYYYY-MM-DD形式で入力してください' }),

  description: z.string()
    .min(1, { message: '摘要を入力してください' })
    .max(200, { message: '摘要は200文字以内で入力してください' }),

  payerType: z.enum(['UserA', 'UserB', 'Common'], {
    errorMap: () => ({ message: '支払元を選択してください' }),
  }),

  expenseType: z.enum(['Household', 'Personal'], {
    errorMap: () => ({ message: '支出タイプを選択してください' }),
  }),
});

export const GroupSettingsSchema = z.object({
  ratioA: z.number()
    .int()
    .min(0)
    .max(100),
  ratioB: z.number()
    .int()
    .min(0)
    .max(100),
}).refine(data => data.ratioA + data.ratioB === 100, {
  message: '負担割合の合計は100%である必要があります',
});
```

### 検証方法

```typescript
// src/lib/schemas.test.ts

describe('L-AS-002: 入力バリデーション', () => {
  describe('Transaction', () => {
    it('有効なデータはパスする', () => {
      const result = TransactionSchema.safeParse({
        amount: 1000,
        date: '2025-01-15',
        description: 'スーパー',
        payerType: 'UserA',
        expenseType: 'Household',
      });

      expect(result.success).toBe(true);
    });

    it('負の金額はエラー', () => {
      const result = TransactionSchema.safeParse({
        amount: -100,
        date: '2025-01-15',
        description: 'テスト',
        payerType: 'UserA',
        expenseType: 'Household',
      });

      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('金額は0以上で入力してください');
    });

    it('不正な日付形式はエラー', () => {
      const result = TransactionSchema.safeParse({
        amount: 1000,
        date: 'January 15, 2025',
        description: 'テスト',
        payerType: 'UserA',
        expenseType: 'Household',
      });

      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('日付はYYYY-MM-DD形式で入力してください');
    });
  });

  describe('GroupSettings', () => {
    it('割合の合計が100でない場合はエラー', () => {
      const result = GroupSettingsSchema.safeParse({
        ratioA: 60,
        ratioB: 50,
      });

      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('負担割合の合計は100%である必要があります');
    });
  });
});
```

---

## L-AS-003: エンドポイント仕様

### API一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /api/auth/signup | ユーザー登録 | 不要 |
| POST | /api/auth/login | ログイン | 不要 |
| POST | /api/auth/logout | ログアウト | 必要 |
| GET | /api/groups/:id | グループ情報取得 | 必要 |
| PUT | /api/groups/:id | グループ設定更新 | 必要 |
| GET | /api/transactions | トランザクション一覧 | 必要 |
| POST | /api/transactions | トランザクション作成 | 必要 |
| PUT | /api/transactions/:id | トランザクション更新 | 必要 |
| DELETE | /api/transactions/:id | トランザクション削除 | 必要 |
| POST | /api/transactions/import | CSV取り込み | 必要 |
| GET | /api/settlement | 精算結果取得 | 必要 |

### エンドポイント詳細仕様

```typescript
// docs/api/transactions.ts（ドキュメント用型定義）

/**
 * GET /api/transactions
 *
 * クエリパラメータ:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - month: string (YYYY-MM形式)
 * - payerType: 'UserA' | 'UserB' | 'Common'
 * - expenseType: 'Household' | 'Personal'
 *
 * レスポンス:
 * - 200: SuccessResponse<Transaction[]>
 * - 401: ErrorResponse (E_AUTH_001)
 */

/**
 * POST /api/transactions/import
 *
 * リクエスト:
 * - Content-Type: multipart/form-data
 * - file: CSVファイル (max 5MB)
 * - payerType: 'UserA' | 'UserB' | 'Common'
 *
 * レスポンス:
 * - 201: SuccessResponse<{ imported: number, skipped: number, warnings: string[] }>
 * - 400: ErrorResponse (E_VALIDATION_*)
 * - 413: ErrorResponse (E_VALIDATION_010: ファイルサイズ超過)
 */

/**
 * GET /api/settlement
 *
 * クエリパラメータ:
 * - month: string (YYYY-MM形式, required)
 *
 * レスポンス:
 * - 200: SuccessResponse<SettlementResult>
 *
 * SettlementResult:
 * {
 *   month: string,
 *   totalHousehold: number,
 *   paidByA: number,
 *   paidByB: number,
 *   paidByCommon: number,
 *   ratioA: number,
 *   ratioB: number,
 *   balanceA: number,
 *   direction: 'A_PAYS_B' | 'B_PAYS_A' | 'SETTLED',
 *   amount: number
 * }
 */
```

### 検証方法

```typescript
// e2e/api/endpoints.spec.ts

describe('L-AS-003: エンドポイント仕様', () => {
  describe('GET /api/transactions', () => {
    it('ページネーションが正しく動作する', async () => {
      const response = await fetch('/api/transactions?page=1&limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.length).toBeLessThanOrEqual(10);
      expect(body.meta.page).toBe(1);
    });

    it('limitの上限は100', async () => {
      const response = await fetch('/api/transactions?limit=200', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await response.json();
      expect(body.meta.limit).toBe(100);
    });
  });

  describe('GET /api/settlement', () => {
    it('monthパラメータは必須', async () => {
      const response = await fetch('/api/settlement', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('E_VALIDATION_001');
    });

    it('精算結果の構造が正しい', async () => {
      const response = await fetch('/api/settlement?month=2025-01', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toMatchObject({
        month: '2025-01',
        totalHousehold: expect.any(Number),
        paidByA: expect.any(Number),
        paidByB: expect.any(Number),
        ratioA: expect.any(Number),
        ratioB: expect.any(Number),
        balanceA: expect.any(Number),
        direction: expect.stringMatching(/^(A_PAYS_B|B_PAYS_A|SETTLED)$/),
        amount: expect.any(Number),
      });
    });
  });
});
```

---

## L-AS-004: レスポンスヘッダー仕様

### 必須ヘッダー

| ヘッダー | 値 | 目的 |
|---------|-----|------|
| Content-Type | application/json; charset=utf-8 | レスポンス形式 |
| X-Request-Id | UUID | リクエスト追跡 |
| X-Response-Time | {ms}ms | パフォーマンス監視 |

### セキュリティヘッダー

| ヘッダー | 値 | 目的 |
|---------|-----|------|
| X-Content-Type-Options | nosniff | MIMEスニッフィング防止 |
| X-Frame-Options | DENY | クリックジャッキング防止 |
| X-XSS-Protection | 1; mode=block | XSS防止 |
| Strict-Transport-Security | max-age=31536000 | HTTPS強制 |
| Cache-Control | no-store | キャッシュ禁止（個人情報） |

### 禁止ヘッダー

| ヘッダー | 理由 |
|---------|------|
| Server | サーバー情報漏洩 |
| X-Powered-By | 技術スタック漏洩 |

### 検証方法

```typescript
// e2e/api/headers.spec.ts

describe('L-AS-004: レスポンスヘッダー', () => {
  it('必須ヘッダーが含まれる', async () => {
    const response = await fetch('/api/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
  });

  it('セキュリティヘッダーが含まれる', async () => {
    const response = await fetch('/api/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('禁止ヘッダーが含まれない', async () => {
    const response = await fetch('/api/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.headers.get('Server')).toBeNull();
    expect(response.headers.get('X-Powered-By')).toBeNull();
  });
});
```

---

## CI設定

```yaml
# .github/workflows/api-spec.yml

name: API Specification Validation

on: [push, pull_request]

jobs:
  api-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate response format
        run: npm test -- --grep "L-AS-001"

      - name: Validate input schemas
        run: npm test -- --grep "L-AS-002"

      - name: Validate endpoints
        run: npm run test:e2e -- --grep "L-AS-003"

      - name: Validate headers
        run: npm run test:e2e -- --grep "L-AS-004"
```

---

## 違反時の対応

1. **レスポンス形式違反**: フロントエンド影響調査、即座に修正
2. **バリデーション不足**: セキュリティレビュー、スキーマ追加
3. **ヘッダー不足**: ミドルウェア修正、再デプロイ
