# Purpose-Driven Modeling

Martin Fowler / John Daniels の3つの視点に基づくデータモデリング

---

## 1. Conceptual Model（概念モデル）

**目的**: ビジネスドメインの本質を捉える。実装を意識しない。

### ドメイン概念図

```
┌─────────────────────────────────────────────────────────────────┐
│                        世帯精算ドメイン                           │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐         所属          ┌──────────┐
    │   人     │◄───────────────────────│  世帯   │
    │          │        (2名)          │          │
    └────┬─────┘                       └────┬─────┘
         │                                  │
         │ 行う                              │ 持つ
         │                                  │
         ▼                                  ▼
    ┌──────────┐                      ┌──────────┐
    │  支出    │                      │ 負担割合 │
    │          │                      │          │
    └────┬─────┘                      └──────────┘
         │
         │ 分類される
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────┐        ┌──────────┐
│ 共有費用 │        │ 個人支出 │
│          │        │（精算対象外）│
└────┬─────┘        └──────────┘
     │
     │ 集計される
     ▼
┌──────────┐
│  精算    │
│          │
└──────────┘
```

### 概念定義

| 概念 | 定義 | ビジネスルール |
|------|------|---------------|
| **世帯** | 2名で構成される経済的共同体 | 必ず2名。1名でも機能するが精算は発生しない |
| **人** | 世帯の構成員 | 世帯に属する。支出を行う主体 |
| **負担割合** | 各人が共有費用を負担する比率 | 合計100%。例: 50:50, 60:40 |
| **支出** | 金銭の支払い行為 | 日付・金額・内容・支払者を持つ |
| **共有費用** | 世帯として共同で負担すべき支出 | 食費、光熱費、家賃など |
| **個人支出** | 各人が個別に負担すべき支出 | 趣味、個人の買い物など。精算対象外 |
| **精算** | 一定期間の共有費用を負担割合で清算する行為 | 月次で実施。過払い分を相殺 |

### ビジネスルール

1. **精算の原則**: 共有費用のみが精算対象
2. **負担の公平性**: 各人は負担割合に応じた額を負担すべき
3. **立替の清算**: 実際の支払額と負担すべき額の差額を清算
4. **期間**: 月単位で精算を行う

---

## 2. Specification Model（仕様モデル）

**目的**: インターフェースと振る舞いを定義。「何をするか」を記述。

### エンティティ仕様

```
┌─────────────────────────────────────┐
│ <<entity>> Household                │
├─────────────────────────────────────┤
│ + id: Identifier                    │
│ + name: String                      │
│ + ratioA: Percentage                │
│ + ratioB: Percentage                │
│ + memberA: Person                   │
│ + memberB: Person?                  │
├─────────────────────────────────────┤
│ + updateRatio(a, b): void           │
│ + invite(email): Invitation         │
│ + getSettlement(month): Settlement  │
│ <<invariant>> ratioA + ratioB = 100 │
│ <<invariant>> memberA ≠ memberB     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<entity>> Person                   │
├─────────────────────────────────────┤
│ + id: Identifier                    │
│ + name: String                      │
│ + email: Email                      │
│ + household: Household?             │
├─────────────────────────────────────┤
│ + joinHousehold(h): void            │
│ + leaveHousehold(): void            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<entity>> Expense                  │
├─────────────────────────────────────┤
│ + id: Identifier                    │
│ + date: Date                        │
│ + amount: Money                     │
│ + description: String               │
│ + category: ExpenseCategory         │
│ + paidBy: Person                    │
│ + payerType: PayerType              │
│ + recordedBy: Person                │
│ + source: DataSource?               │
├─────────────────────────────────────┤
│ + changeCategory(c): void           │
│ + changePayer(p): void              │
│ <<note>> paidBy が null の場合      │
│          payerType で判定           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<value>> PayerType                 │
├─────────────────────────────────────┤
│ - UserA: ユーザーA                  │
│ - UserB: ユーザーB                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<value>> ExpenseCategory           │
├─────────────────────────────────────┤
│ - Household: 共有費用（デフォルト） │
│ - Personal: 個人支出                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<value>> Settlement                │
├─────────────────────────────────────┤
│ + month: YearMonth                  │
│ + totalHousehold: Money             │
│ + paidByA: Money                    │
│ + paidByB: Money                    │
│ + balanceA: Money (rounded)         │
│ + ratioA: Percentage                │
│ + ratioB: Percentage                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<service>> SettlementCalculator    │
├─────────────────────────────────────┤
│ + calculate(                        │
│     expenses: Expense[],            │
│     household: Household,           │
│     month: YearMonth                │
│   ): Settlement                     │
│ <<precondition>>                    │
│   ratioA + ratioB = 100             │
│   month matches YYYY-MM             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <<service>> ExpenseImporter         │
├─────────────────────────────────────┤
│ + detectHeaders(csv): ColumnMapping │
│ + parse(csv, mapping): Expense[]    │
│ + import(expenses): ImportResult    │
└─────────────────────────────────────┘
```

### ユースケース仕様

| ユースケース | 入力 | 出力 | 事前条件 | 事後条件 |
|-------------|------|------|---------|---------|
| 支出を記録する | date, amount, description, payer | Expense | 認証済み, 世帯に所属 | 支出が保存される |
| CSVを取り込む | CSVファイル, 支払者 | ImportResult | 認証済み, 5MB以下 | 支出が一括登録 |
| 精算を確認する | 月 (YYYY-MM) | Settlement | 認証済み, 世帯に所属 | - |
| 費用種別を変更 | expenseId, category | - | 自世帯の支出 | 種別が更新 |
| 負担割合を変更 | ratioA, ratioB | - | 合計100% | 割合が更新 |

### 精算計算仕様

```
精算額計算:

  事前条件:
    ratioA: 0〜100 の範囲
    ratioB: 0〜100 の範囲
    ratioA + ratioB = 100
    targetMonth: YYYY-MM 形式

  入力:
    expenses: 取引リスト
    household: 世帯情報（負担割合、メンバーID）
    targetMonth: 対象月

  処理:
    1. 対象月の Household 費用をフィルタ

    2. ユーザーAの支払額を集計
       paidByA = Σ (expenses where actualPayer = A).amount
       ※ actual_payer_user_id があればそれで判定
       ※ なければ actual_payer_type で判定

    3. ユーザーBの支払額を集計（独立して計算）
       paidByB = Σ (expenses where actualPayer = B).amount

    4. 合計を算出
       totalHousehold = paidByA + paidByB

    5. 精算額を計算（整数に丸め）
       expectedA = totalHousehold × (ratioA / 100)
       balanceA = round(paidByA - expectedA)

  出力:
    balanceA > 0 → BがAに |balanceA| を支払う
    balanceA < 0 → AがBに |balanceA| を支払う
    balanceA = 0 → 精算不要
```

---

## 3. Implementation Model（実装モデル）

**目的**: 具体的なコード設計。言語・フレームワーク固有の実装。

### 技術スタック

- **Runtime**: Next.js 15 (App Router)
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Auth**: NextAuth

### データベーススキーマ

```typescript
// src/db/schema.ts

// 認証ユーザー
export const authUsers = pgTable('auth_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_auth_users_email').on(table.email),
}));

// ユーザープロファイル
export const users = pgTable('users', {
  id: uuid('id').primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  groupId: uuid('group_id'),  // 外部キー制約なし（循環参照回避）
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  groupIdx: index('idx_users_group').on(table.groupId),
}));

// 世帯グループ
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().default('Household'),
  ratioA: integer('ratio_a').notNull().default(50),
  ratioB: integer('ratio_b').notNull().default(50),
  userAId: uuid('user_a_id').notNull(),
  userBId: uuid('user_b_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  userAIdx: index('idx_groups_user_a').on(table.userAId),
  userBIdx: index('idx_groups_user_b').on(table.userBId),
  ratioSumCheck: check('ratio_sum', sql`${table.ratioA} + ${table.ratioB} = 100`),
  uniqueUserPairCheck: check('unique_user_pair', sql`${table.userAId} != ${table.userBId}`),
  fkUserA: foreignKey({
    columns: [table.userAId],
    foreignColumns: [users.id],
    name: 'fk_groups_user_a'
  }).onDelete('cascade'),
  fkUserB: foreignKey({
    columns: [table.userBId],
    foreignColumns: [users.id],
    name: 'fk_groups_user_b'
  }).onDelete('set null'),
}));

// 取引（支出）
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  payerType: text('payer_type').notNull(),              // 'UserA' | 'UserB'
  payerUserId: uuid('payer_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  actualPayerType: text('actual_payer_type').notNull(), // 'UserA' | 'UserB'
  actualPayerUserId: uuid('actual_payer_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  expenseType: text('expense_type').notNull().default('Household'), // 'Household' | 'Personal'
  sourceFileName: text('source_file_name'),
  uploadedBy: uuid('uploaded_by')
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});
```

### ドメイン型

```typescript
// src/lib/types.ts

export type PayerType = 'UserA' | 'UserB';
export type ExpenseType = 'Household' | 'Personal';

export interface Transaction {
  id: string;
  group_id: string;
  user_id: string;
  date: string;                          // YYYY-MM-DD
  amount: number;
  description: string;
  payer_type: PayerType;
  payer_user_id?: string | null;
  actual_payer_type: PayerType;
  actual_payer_user_id?: string | null;
  expense_type: ExpenseType;
  source_file_name?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  ratio_a: number;                       // 0-100
  ratio_b: number;                       // 0-100
  user_a_id: string;
  user_b_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  month: string;                         // YYYY-MM
  total_household: number;
  paid_by_a_household: number;
  paid_by_b_household: number;
  balance_a: number;                     // 正=受取、負=支払い（整数に丸め）
  ratio_a: number;
  ratio_b: number;
}

export interface ColumnMapping {
  dateColumn: string | null;
  amountColumn: string | null;
  descriptionColumn: string | null;
  payerColumn: string | null;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  payer: string;
}

export interface UploadResult {
  success: boolean;
  insertedCount: number;
  fileName: string;
  duplicates?: number;
}
```

### ビジネスロジック

```typescript
// src/lib/settlement.ts

import type { Transaction, Group, Settlement } from './types'

const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const validateRatio = (ratioA: number, ratioB: number): void => {
  if (ratioA < 0 || ratioA > 100) {
    throw new Error('負担割合Aは0〜100の範囲で入力してください')
  }
  if (ratioB < 0 || ratioB > 100) {
    throw new Error('負担割合Bは0〜100の範囲で入力してください')
  }
  if (ratioA + ratioB !== 100) {
    throw new Error('負担割合の合計は100%である必要があります')
  }
}

const validateMonthFormat = (month: string): void => {
  if (!MONTH_FORMAT_REGEX.test(month)) {
    throw new Error('月の形式が正しくありません。YYYY-MM形式で入力してください')
  }
}

export const calculateSettlement = (
  transactions: Transaction[],
  group: Group,
  targetMonth: string
): Settlement => {
  // 事前条件の検証
  validateRatio(group.ratio_a, group.ratio_b)
  validateMonthFormat(targetMonth)

  // 1. 対象月のHousehold費用をフィルタ
  const householdTransactions = transactions.filter((t) => {
    const dateStr =
      typeof t.date === 'string'
        ? t.date
        : (t.date as unknown as Date).toISOString().slice(0, 10)
    return t.expense_type === 'Household' && dateStr.startsWith(targetMonth)
  })

  // 金額を数値に変換するヘルパー
  const toNumber = (val: number | string): number =>
    typeof val === 'string' ? parseFloat(val) : val

  // 2. ユーザーAの支払額を集計
  //    actual_payer_user_id があればそれで判定、なければ actual_payer_type で判定
  const paidByA = householdTransactions
    .filter((t) => {
      if (t.actual_payer_user_id) {
        return t.actual_payer_user_id === group.user_a_id
      }
      return t.actual_payer_type === 'UserA'
    })
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  // 3. ユーザーBの支払額を集計（独立して計算）
  const paidByB = householdTransactions
    .filter((t) => {
      if (t.actual_payer_user_id) {
        return t.actual_payer_user_id === group.user_b_id
      }
      return t.actual_payer_type === 'UserB'
    })
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  // 4. 合計を算出
  const totalHousehold = paidByA + paidByB

  // 5. 精算額を計算（整数に丸め）
  const ratioA = group.ratio_a / 100
  const balanceA = Math.round(paidByA - totalHousehold * ratioA)

  return {
    month: targetMonth,
    total_household: totalHousehold,
    paid_by_a_household: paidByA,
    paid_by_b_household: paidByB,
    balance_a: balanceA,
    ratio_a: group.ratio_a,
    ratio_b: group.ratio_b,
  }
}
```

### Server Actions

```typescript
// app/actions/transactions.ts

export async function getSettlementData(targetMonth: string) {
  const validated = GetSettlementDataSchema.safeParse({ targetMonth });
  if (!validated.success) return { error: 'Invalid month format' };

  const user = await requireAuth();
  const group = await getGroupByUserId(user.id);

  const transactions = await db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.groupId, group.id),
      like(schema.transactions.date, `${targetMonth}%`)
    ),
  });

  const settlement = calculateSettlement(transactions, group, targetMonth);

  return { success: true, settlement };
}
```

---

## 視点間のマッピング

| Conceptual | Specification | Implementation |
|------------|---------------|----------------|
| 世帯 | Household | `groups` テーブル |
| 人 | Person | `users` + `auth_users` |
| 支出 | Expense | `transactions` テーブル |
| 共有費用 | ExpenseCategory.Household | `expense_type = 'Household'` (デフォルト) |
| 個人支出 | ExpenseCategory.Personal | `expense_type = 'Personal'` |
| 負担割合 | ratioA, ratioB | `ratio_a`, `ratio_b` カラム (notNull, default 50) |
| 精算 | Settlement | `calculateSettlement()` 関数の戻り値 |
| 支払者 | paidBy + payerType | `actual_payer_user_id` (優先) + `actual_payer_type` (フォールバック) |

---

## 実装上の注意点

### 支払者判定のフォールバック

支払者の判定は2段階で行われる：

1. `actual_payer_user_id` が設定されていればそれを使用
2. 設定されていなければ `actual_payer_type` ('UserA' | 'UserB') で判定

これにより、ユーザーIDが不明な場合でも支払者を特定できる。

### 金額の型変換

DBから取得した `amount` は文字列の場合があるため、計算時に `parseFloat()` で数値に変換する。

### 精算額の丸め

端数処理として `Math.round()` を使用し、整数に丸める。

---

## 参考文献

- Martin Fowler, "Purpose-Driven Modeling", IEEE Software, Jan/Feb 2002
- Steve Cook & John Daniels, "Designing Object Systems", Prentice Hall, 1994
