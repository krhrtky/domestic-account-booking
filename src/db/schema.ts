import { pgTable, uuid, text, integer, numeric, date, timestamp, check, foreignKey, index } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const authUsers = pgTable('auth_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_auth_users_email').on(table.email),
}))

export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  groupId: uuid('group_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  groupIdx: index('idx_users_group').on(table.groupId),
}))

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
  fkUserA: foreignKey({ columns: [table.userAId], foreignColumns: [users.id], name: 'fk_groups_user_a' }).onDelete('cascade'),
  fkUserB: foreignKey({ columns: [table.userBId], foreignColumns: [users.id], name: 'fk_groups_user_b' }).onDelete('set null'),
}))

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  inviterId: uuid('inviter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inviteeEmail: text('invitee_email').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  groupIdx: index('idx_invitations_group').on(table.groupId),
  emailIdx: index('idx_invitations_email').on(table.inviteeEmail),
}))

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  payerType: text('payer_type').notNull(),
  payerUserId: uuid('payer_user_id').references(() => users.id, { onDelete: 'set null' }),
  actualPayerType: text('actual_payer_type').notNull(),
  actualPayerUserId: uuid('actual_payer_user_id').references(() => users.id, { onDelete: 'set null' }),
  expenseType: text('expense_type').notNull().default('Household'),
  sourceFileName: text('source_file_name'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => ({
  groupIdx: index('idx_transactions_group').on(table.groupId),
  userIdx: index('idx_transactions_user').on(table.userId),
  dateIdx: index('idx_transactions_date').on(table.date),
  expenseTypeIdx: index('idx_transactions_expense_type').on(table.expenseType),
  payerUserIdx: index('idx_transactions_payer_user').on(table.payerUserId),
  actualPayerTypeIdx: index('idx_transactions_actual_payer_type').on(table.actualPayerType),
  actualPayerUserIdx: index('idx_transactions_actual_payer_user').on(table.actualPayerUserId),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  authUser: one(authUsers, {
    fields: [users.id],
    references: [authUsers.id],
  }),
  group: one(groups, {
    fields: [users.groupId],
    references: [groups.id],
  }),
  transactions: many(transactions),
  uploadedTransactions: many(transactions),
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  userA: one(users, {
    fields: [groups.userAId],
    references: [users.id],
    relationName: 'userA',
  }),
  userB: one(users, {
    fields: [groups.userBId],
    references: [users.id],
    relationName: 'userB',
  }),
  members: many(users),
  transactions: many(transactions),
  invitations: many(invitations),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  group: one(groups, {
    fields: [transactions.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  payerUser: one(users, {
    fields: [transactions.payerUserId],
    references: [users.id],
    relationName: 'payerUser',
  }),
  actualPayerUser: one(users, {
    fields: [transactions.actualPayerUserId],
    references: [users.id],
    relationName: 'actualPayerUser',
  }),
  uploadedByUser: one(users, {
    fields: [transactions.uploadedBy],
    references: [users.id],
    relationName: 'uploadedBy',
  }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  group: one(groups, {
    fields: [invitations.groupId],
    references: [groups.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}))
