import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { users, groups, transactions, invitations, authUsers } from './schema'

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type AuthUser = InferSelectModel<typeof authUsers>
export type NewAuthUser = InferInsertModel<typeof authUsers>

export type Group = InferSelectModel<typeof groups>
export type NewGroup = InferInsertModel<typeof groups>

export type Transaction = InferSelectModel<typeof transactions>
export type NewTransaction = InferInsertModel<typeof transactions>

export type Invitation = InferSelectModel<typeof invitations>
export type NewInvitation = InferInsertModel<typeof invitations>

export type PayerType = 'UserA' | 'UserB' | 'Common'
export type ExpenseType = 'Household' | 'Personal'
