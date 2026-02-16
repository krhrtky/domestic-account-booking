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

## 3. Implementation Model（実装モデル）- DDD

**目的**: Eric Evans の Domain-Driven Design パターンに基づく実装設計。

### 技術スタック

- **Runtime**: Next.js 15 (App Router)
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Auth**: NextAuth

---

### 3.1 Bounded Context（境界づけられたコンテキスト）

```
┌─────────────────────────────────────────────────────────────────┐
│                  Household Settlement Context                    │
│                      （世帯精算コンテキスト）                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Household Aggregate                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  Household  │  │   Member    │  │  Expense    │     │   │
│  │  │ (Root)      │──│  (Entity)   │  │  (Entity)   │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │         │                                               │   │
│  │         │ owns                                          │   │
│  │         ▼                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ ExpenseRatio│  │   Payer     │  │  Category   │     │   │
│  │  │ (Value Obj) │  │ (Value Obj) │  │ (Value Obj) │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Domain Services                        │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐       │   │
│  │  │ SettlementCalculator│  │   ExpenseImporter   │       │   │
│  │  └─────────────────────┘  └─────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Anti-Corruption Layer
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Identity Context                             │
│                      （認証コンテキスト）                         │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  AuthUser   │  │   Session   │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Aggregate（集約）

#### Household Aggregate（世帯集約）

**Aggregate Root**: `Household`

```
┌─────────────────────────────────────────────────────────────────┐
│                    Household Aggregate                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────┐                       │
│   │ <<aggregate root>>                  │                       │
│   │ Household                           │                       │
│   ├─────────────────────────────────────┤                       │
│   │ - id: HouseholdId                   │                       │
│   │ - name: string                      │                       │
│   │ - ratio: ExpenseRatio               │◄─── Value Object      │
│   │ - memberA: Member                   │                       │
│   │ - memberB: Member?                  │                       │
│   │ - expenses: Expense[]               │                       │
│   ├─────────────────────────────────────┤                       │
│   │ + updateRatio(ratio): void          │                       │
│   │ + addExpense(expense): void         │                       │
│   │ + inviteMember(email): Invitation   │                       │
│   │ + calculateSettlement(month): Settlement                    │
│   └─────────────────────────────────────┘                       │
│                    │                                             │
│         ┌─────────┴─────────┐                                   │
│         ▼                   ▼                                   │
│   ┌───────────┐      ┌───────────────┐                          │
│   │ <<entity>>│      │  <<entity>>   │                          │
│   │  Member   │      │   Expense     │                          │
│   ├───────────┤      ├───────────────┤                          │
│   │ - id      │      │ - id          │                          │
│   │ - name    │      │ - date        │                          │
│   │ - email   │      │ - amount      │                          │
│   │ - role    │      │ - description │                          │
│   └───────────┘      │ - category    │                          │
│                      │ - payer       │                          │
│                      └───────────────┘                          │
│                                                                  │
│   【不変条件 (Invariants)】                                      │
│   • ratio.userA + ratio.userB = 100                             │
│   • memberA.id ≠ memberB.id                                     │
│   • expenses は必ず Household 経由でアクセス                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**集約境界のルール**:
- Expense は Household を経由してのみアクセス可能
- 外部からは HouseholdId でのみ参照
- Expense の変更は Household のメソッド経由で行う

---

### 3.3 Entity（エンティティ）

#### Household（世帯）- Aggregate Root

```typescript
// src/domain/entities/Household.ts

class Household {
  private constructor(
    private readonly _id: HouseholdId,
    private _name: string,
    private _ratio: ExpenseRatio,
    private readonly _memberA: Member,
    private _memberB: Member | null,
    private _expenses: Expense[]
  ) {}

  static create(memberA: Member, name?: string): Household {
    return new Household(
      HouseholdId.generate(),
      name ?? 'Household',
      ExpenseRatio.equal(),  // 50:50
      memberA,
      null,
      []
    )
  }

  updateRatio(ratio: ExpenseRatio): void {
    this._ratio = ratio
  }

  addExpense(expense: Expense): void {
    this._expenses.push(expense)
  }

  get id(): HouseholdId { return this._id }
  get ratio(): ExpenseRatio { return this._ratio }
  get memberA(): Member { return this._memberA }
  get memberB(): Member | null { return this._memberB }
}
```

#### Member（メンバー）- Entity

```typescript
// src/domain/entities/Member.ts

class Member {
  constructor(
    private readonly _id: MemberId,
    private _name: string,
    private readonly _email: Email,
    private _role: MemberRole  // 'UserA' | 'UserB'
  ) {}

  get id(): MemberId { return this._id }
  get name(): string { return this._name }
  get role(): MemberRole { return this._role }
}
```

#### Expense（支出）- Entity

```typescript
// src/domain/entities/Expense.ts

class Expense {
  constructor(
    private readonly _id: ExpenseId,
    private readonly _householdId: HouseholdId,
    private readonly _date: Date,
    private readonly _amount: Money,
    private readonly _description: string,
    private _category: ExpenseCategory,
    private _payer: Payer,
    private readonly _recordedBy: MemberId,
    private readonly _source: DataSource | null
  ) {}

  changeCategory(category: ExpenseCategory): void {
    this._category = category
  }

  changePayer(payer: Payer): void {
    this._payer = payer
  }

  get id(): ExpenseId { return this._id }
  get amount(): Money { return this._amount }
  get category(): ExpenseCategory { return this._category }
  get payer(): Payer { return this._payer }
  get isHousehold(): boolean { return this._category.isHousehold() }
}
```

---

### 3.4 Value Object（値オブジェクト）

#### ExpenseRatio（負担割合）

```typescript
// src/domain/value-objects/ExpenseRatio.ts

class ExpenseRatio {
  private constructor(
    private readonly _userA: number,
    private readonly _userB: number
  ) {
    if (_userA < 0 || _userA > 100) {
      throw new DomainError('負担割合Aは0〜100の範囲で入力してください')
    }
    if (_userB < 0 || _userB > 100) {
      throw new DomainError('負担割合Bは0〜100の範囲で入力してください')
    }
    if (_userA + _userB !== 100) {
      throw new DomainError('負担割合の合計は100%である必要があります')
    }
  }

  static of(userA: number, userB: number): ExpenseRatio {
    return new ExpenseRatio(userA, userB)
  }

  static equal(): ExpenseRatio {
    return new ExpenseRatio(50, 50)
  }

  get userA(): number { return this._userA }
  get userB(): number { return this._userB }

  calculateExpectedAmount(total: Money, role: MemberRole): Money {
    const ratio = role === 'UserA' ? this._userA : this._userB
    return total.multiply(ratio / 100)
  }

  equals(other: ExpenseRatio): boolean {
    return this._userA === other._userA && this._userB === other._userB
  }
}
```

#### Money（金額）

```typescript
// src/domain/value-objects/Money.ts

class Money {
  private constructor(private readonly _amount: number) {
    if (_amount < 0) {
      throw new DomainError('金額は0以上である必要があります')
    }
  }

  static of(amount: number | string): Money {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Money(value)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount)
  }

  subtract(other: Money): Money {
    return new Money(this._amount - other._amount)
  }

  multiply(factor: number): Money {
    return new Money(this._amount * factor)
  }

  round(): Money {
    return new Money(Math.round(this._amount))
  }

  get value(): number { return this._amount }

  equals(other: Money): boolean {
    return this._amount === other._amount
  }
}
```

#### Payer（支払者）

```typescript
// src/domain/value-objects/Payer.ts

class Payer {
  private constructor(
    private readonly _userId: MemberId | null,
    private readonly _type: PayerType
  ) {}

  static fromUser(userId: MemberId, type: PayerType): Payer {
    return new Payer(userId, type)
  }

  static fromType(type: PayerType): Payer {
    return new Payer(null, type)
  }

  /**
   * 支払者を特定する
   * userId があればそれを使用、なければ type で判定
   */
  matchesMember(memberId: MemberId, memberRole: MemberRole): boolean {
    if (this._userId) {
      return this._userId.equals(memberId)
    }
    return this._type === memberRole
  }

  get type(): PayerType { return this._type }
  get userId(): MemberId | null { return this._userId }
}

type PayerType = 'UserA' | 'UserB'
```

#### ExpenseCategory（費用種別）

```typescript
// src/domain/value-objects/ExpenseCategory.ts

class ExpenseCategory {
  private constructor(private readonly _value: 'Household' | 'Personal') {}

  static household(): ExpenseCategory {
    return new ExpenseCategory('Household')
  }

  static personal(): ExpenseCategory {
    return new ExpenseCategory('Personal')
  }

  static fromString(value: string): ExpenseCategory {
    if (value === 'Household' || value === 'Personal') {
      return new ExpenseCategory(value)
    }
    throw new DomainError(`無効な費用種別: ${value}`)
  }

  isHousehold(): boolean { return this._value === 'Household' }
  isPersonal(): boolean { return this._value === 'Personal' }

  get value(): string { return this._value }

  equals(other: ExpenseCategory): boolean {
    return this._value === other._value
  }
}
```

#### YearMonth（年月）

```typescript
// src/domain/value-objects/YearMonth.ts

class YearMonth {
  private static readonly FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/

  private constructor(
    private readonly _year: number,
    private readonly _month: number
  ) {}

  static of(year: number, month: number): YearMonth {
    if (month < 1 || month > 12) {
      throw new DomainError('月は1〜12の範囲で入力してください')
    }
    return new YearMonth(year, month)
  }

  static parse(value: string): YearMonth {
    if (!YearMonth.FORMAT.test(value)) {
      throw new DomainError('月の形式が正しくありません。YYYY-MM形式で入力してください')
    }
    const [year, month] = value.split('-').map(Number)
    return new YearMonth(year, month)
  }

  toString(): string {
    return `${this._year}-${String(this._month).padStart(2, '0')}`
  }

  contains(date: Date): boolean {
    const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10)
    return dateStr.startsWith(this.toString())
  }

  equals(other: YearMonth): boolean {
    return this._year === other._year && this._month === other._month
  }
}
```

---

### 3.5 Domain Service（ドメインサービス）

#### SettlementCalculator（精算計算サービス）

```typescript
// src/domain/services/SettlementCalculator.ts

class SettlementCalculator {
  calculate(
    expenses: Expense[],
    household: Household,
    targetMonth: YearMonth
  ): Settlement {
    // 1. 対象月の共有費用をフィルタ
    const householdExpenses = expenses.filter(
      e => e.isHousehold && targetMonth.contains(e.date)
    )

    // 2. ユーザーAの支払額を集計
    const paidByA = householdExpenses
      .filter(e => e.payer.matchesMember(household.memberA.id, 'UserA'))
      .reduce((sum, e) => sum.add(e.amount), Money.zero())

    // 3. ユーザーBの支払額を集計
    const paidByB = householdExpenses
      .filter(e => household.memberB &&
                   e.payer.matchesMember(household.memberB.id, 'UserB'))
      .reduce((sum, e) => sum.add(e.amount), Money.zero())

    // 4. 合計を算出
    const total = paidByA.add(paidByB)

    // 5. 精算額を計算
    const expectedA = household.ratio.calculateExpectedAmount(total, 'UserA')
    const balanceA = paidByA.subtract(expectedA).round()

    return Settlement.create(
      targetMonth,
      total,
      paidByA,
      paidByB,
      balanceA,
      household.ratio
    )
  }
}
```

#### Settlement（精算結果）- Value Object

```typescript
// src/domain/value-objects/Settlement.ts

class Settlement {
  private constructor(
    private readonly _month: YearMonth,
    private readonly _totalHousehold: Money,
    private readonly _paidByA: Money,
    private readonly _paidByB: Money,
    private readonly _balanceA: Money,
    private readonly _ratio: ExpenseRatio
  ) {}

  static create(
    month: YearMonth,
    total: Money,
    paidByA: Money,
    paidByB: Money,
    balanceA: Money,
    ratio: ExpenseRatio
  ): Settlement {
    return new Settlement(month, total, paidByA, paidByB, balanceA, ratio)
  }

  /**
   * 精算の方向と金額を取得
   * @returns { from: 'A' | 'B', to: 'A' | 'B', amount: Money } | null
   */
  getPaymentInstruction(): PaymentInstruction | null {
    if (this._balanceA.value > 0) {
      return { from: 'B', to: 'A', amount: Money.of(this._balanceA.value) }
    } else if (this._balanceA.value < 0) {
      return { from: 'A', to: 'B', amount: Money.of(-this._balanceA.value) }
    }
    return null  // 精算不要
  }

  get month(): YearMonth { return this._month }
  get totalHousehold(): Money { return this._totalHousehold }
  get balanceA(): Money { return this._balanceA }
}

interface PaymentInstruction {
  from: 'A' | 'B'
  to: 'A' | 'B'
  amount: Money
}
```

---

### 3.6 Repository（リポジトリ）

#### インターフェース定義

```typescript
// src/domain/repositories/IHouseholdRepository.ts

interface IHouseholdRepository {
  findById(id: HouseholdId): Promise<Household | null>
  findByMemberId(memberId: MemberId): Promise<Household | null>
  save(household: Household): Promise<void>
}

// src/domain/repositories/IExpenseRepository.ts

interface IExpenseRepository {
  findByHouseholdAndMonth(
    householdId: HouseholdId,
    month: YearMonth
  ): Promise<Expense[]>
  save(expense: Expense): Promise<void>
  saveBatch(expenses: Expense[]): Promise<void>
}
```

#### Infrastructure 実装

```typescript
// src/infrastructure/repositories/DrizzleHouseholdRepository.ts

class DrizzleHouseholdRepository implements IHouseholdRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByMemberId(memberId: MemberId): Promise<Household | null> {
    const result = await this.db
      .select()
      .from(groups)
      .innerJoin(users, eq(users.groupId, groups.id))
      .where(eq(users.id, memberId.value))
      .limit(1)

    if (result.length === 0) return null

    return this.toDomain(result[0])
  }

  async save(household: Household): Promise<void> {
    await this.db
      .update(groups)
      .set({
        name: household.name,
        ratioA: household.ratio.userA,
        ratioB: household.ratio.userB,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(groups.id, household.id.value))
  }

  private toDomain(row: GroupRow): Household {
    // DB行 → ドメインオブジェクト変換
  }
}
```

---

### 3.7 Application Service（アプリケーションサービス）

```typescript
// src/application/services/SettlementService.ts

class SettlementService {
  constructor(
    private readonly householdRepo: IHouseholdRepository,
    private readonly expenseRepo: IExpenseRepository,
    private readonly calculator: SettlementCalculator
  ) {}

  async getSettlement(
    memberId: MemberId,
    targetMonth: YearMonth
  ): Promise<SettlementDTO> {
    // 1. 世帯を取得
    const household = await this.householdRepo.findByMemberId(memberId)
    if (!household) {
      throw new ApplicationError('世帯が見つかりません')
    }

    // 2. 支出を取得
    const expenses = await this.expenseRepo.findByHouseholdAndMonth(
      household.id,
      targetMonth
    )

    // 3. 精算を計算
    const settlement = this.calculator.calculate(expenses, household, targetMonth)

    // 4. DTOに変換
    return SettlementDTO.fromDomain(settlement, household)
  }
}
```

#### Server Actions（Next.js統合）

```typescript
// app/actions/transactions.ts

export async function getSettlementData(targetMonth: string) {
  // バリデーション
  const validated = GetSettlementDataSchema.safeParse({ targetMonth })
  if (!validated.success) {
    return { error: 'Invalid month format' }
  }

  // 認証
  const user = await requireAuth()

  // アプリケーションサービス呼び出し
  const service = container.resolve(SettlementService)
  const settlement = await service.getSettlement(
    MemberId.of(user.id),
    YearMonth.parse(targetMonth)
  )

  return { success: true, settlement }
}
```

---

### 3.8 レイヤーアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Next.js App Router (React Server Components)          │   │
│  │   Server Actions (app/actions/*.ts)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Application Layer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Application Services (src/application/services/)       │   │
│  │   ├─ SettlementService                                   │   │
│  │   ├─ ExpenseUploadService                                │   │
│  │   └─ HouseholdManagementService                          │   │
│  │   DTOs (src/application/dtos/)                           │   │
│  │   Zod Schemas (validation)                               │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        Domain Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Entities (src/domain/entities/)                        │   │
│  │   ├─ Household (Aggregate Root)                          │   │
│  │   ├─ Member                                              │   │
│  │   └─ Expense                                             │   │
│  │   Value Objects (src/domain/value-objects/)              │   │
│  │   ├─ ExpenseRatio, Money, Payer, ExpenseCategory         │   │
│  │   └─ YearMonth, Settlement                               │   │
│  │   Domain Services (src/domain/services/)                 │   │
│  │   └─ SettlementCalculator                                │   │
│  │   Repository Interfaces (src/domain/repositories/)       │   │
│  │   └─ IHouseholdRepository, IExpenseRepository            │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Repository Implementations (src/infrastructure/)       │   │
│  │   ├─ DrizzleHouseholdRepository                          │   │
│  │   └─ DrizzleExpenseRepository                            │   │
│  │   Database (src/db/)                                     │   │
│  │   ├─ schema.ts (Drizzle ORM)                             │   │
│  │   └─ client.ts                                           │   │
│  │   External Services                                      │   │
│  │   ├─ CSV Parser (src/lib/csv-parser.ts)                  │   │
│  │   └─ Auth (NextAuth)                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.9 現在の実装とDDDモデルのマッピング

| DDD概念 | 理想の配置 | 現在の実装 |
|--------|-----------|-----------|
| **Aggregate Root** | `src/domain/entities/Household.ts` | `groups` テーブル (schema.ts) |
| **Entity** | `src/domain/entities/` | DTOとして `types.ts` |
| **Value Object** | `src/domain/value-objects/` | プリミティブ型 (`number`, `string`) |
| **Domain Service** | `src/domain/services/` | `src/lib/settlement.ts` ✓ |
| **Repository Interface** | `src/domain/repositories/` | 未実装（直接DB操作） |
| **Repository Impl** | `src/infrastructure/` | `app/actions/` 内にインライン |
| **Application Service** | `src/application/services/` | `app/actions/*.ts` |

---

### 3.10 実装上の注意点

#### 支払者判定のフォールバック

```typescript
// Payer Value Object のロジック
matchesMember(memberId: MemberId, memberRole: MemberRole): boolean {
  if (this._userId) {
    return this._userId.equals(memberId)  // userId 優先
  }
  return this._type === memberRole        // type でフォールバック
}
```

#### 金額の型変換

```typescript
// Money Value Object が parseFloat を内包
static of(amount: number | string): Money {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Money(value)
}
```

#### 精算額の丸め

```typescript
// Money Value Object のメソッド
round(): Money {
  return new Money(Math.round(this._amount))
}
```

---

## 視点間のマッピング

| Conceptual | Specification | DDD Implementation |
|------------|---------------|-------------------|
| 世帯 | Household | `Household` (Aggregate Root) |
| 人 | Person | `Member` (Entity) |
| 支出 | Expense | `Expense` (Entity in Aggregate) |
| 共有費用 | ExpenseCategory.Household | `ExpenseCategory.household()` |
| 個人支出 | ExpenseCategory.Personal | `ExpenseCategory.personal()` |
| 負担割合 | ratioA, ratioB | `ExpenseRatio` (Value Object) |
| 精算 | Settlement | `Settlement` (Value Object) |
| 支払者 | paidBy + payerType | `Payer` (Value Object) |
| 金額 | Money | `Money` (Value Object) |
| 年月 | YearMonth | `YearMonth` (Value Object) |

---

## 参考文献

- Martin Fowler, "Purpose-Driven Modeling", IEEE Software, Jan/Feb 2002
- Steve Cook & John Daniels, "Designing Object Systems", Prentice Hall, 1994
- Eric Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software", Addison-Wesley, 2003
- Vaughn Vernon, "Implementing Domain-Driven Design", Addison-Wesley, 2013
