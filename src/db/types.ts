import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { users, groups, transactions, invitations, customAuthUsers } from './schema'

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type CustomAuthUser = InferSelectModel<typeof customAuthUsers>
export type NewCustomAuthUser = InferInsertModel<typeof customAuthUsers>

export type Group = InferSelectModel<typeof groups>
export type NewGroup = InferInsertModel<typeof groups>

export type Transaction = InferSelectModel<typeof transactions>
export type NewTransaction = InferInsertModel<typeof transactions>

export type Invitation = InferSelectModel<typeof invitations>
export type NewInvitation = InferInsertModel<typeof invitations>

export type PayerType = 'UserA' | 'UserB' | 'Common'
export type ExpenseType = 'Household' | 'Personal'
