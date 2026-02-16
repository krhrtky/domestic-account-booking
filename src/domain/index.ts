// Entities
export { Household, Member, Expense, type DataSource } from './entities'

// Value Objects
export {
  Money,
  ExpenseRatio,
  type MemberRole,
  ExpenseCategory,
  type ExpenseCategoryType,
  YearMonth,
  Payer,
  type PayerType,
  Settlement,
  type PaymentInstruction,
} from './value-objects'

// Domain Services
export { SettlementCalculator, settlementCalculator } from './services'

// Repository Interfaces
export type { IHouseholdRepository } from './repositories/IHouseholdRepository'
export type { IExpenseRepository } from './repositories/IExpenseRepository'

// Errors
export { DomainError, InvariantViolationError, InvalidArgumentError } from './errors'
