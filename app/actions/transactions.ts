'use server'

import { createClient } from '@/lib/supabase/server'
import { parseCSV } from '@/lib/csv-parser'
import { z } from 'zod'
import { ExpenseType, PayerType } from '@/lib/types'

const UploadCSVSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1).max(255),
  payerType: z.enum(['UserA', 'UserB', 'Common'])
})

const UpdateExpenseTypeSchema = z.object({
  transactionId: z.string().uuid(),
  expenseType: z.enum(['Household', 'Personal'])
})

const GetTransactionsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  expenseType: z.enum(['Household', 'Personal']).optional(),
  payerType: z.enum(['UserA', 'UserB', 'Common']).optional()
})

export async function uploadCSV(
  csvContent: string,
  fileName: string,
  payerType: PayerType
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = UploadCSVSchema.safeParse({ csvContent, fileName, payerType })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const parseResult = await parseCSV(csvContent, fileName)
  if (!parseResult.success) {
    return { error: parseResult.errors.join(', ') }
  }

  const transactions = parseResult.data.map(t => ({
    group_id: currentUser.group_id,
    user_id: user.id,
    date: t.date,
    amount: t.amount,
    description: t.description,
    payer_type: payerType,
    expense_type: 'Household' as ExpenseType,
    source_file_name: t.source_file_name,
    uploaded_by: user.id
  }))

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select()

  if (error) {
    return { error: 'Failed to save transactions' }
  }

  return { success: true, count: data.length }
}

export async function getTransactions(filters?: {
  month?: string
  expenseType?: ExpenseType
  payerType?: PayerType
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (filters) {
    const parsed = GetTransactionsSchema.safeParse(filters)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('group_id', currentUser.group_id)
    .order('date', { ascending: false })

  if (filters?.month) {
    const year = filters.month.substring(0, 4)
    const month = filters.month.substring(5, 7)
    const nextMonth = parseInt(month) === 12 
      ? '01' 
      : String(parseInt(month) + 1).padStart(2, '0')
    const nextYear = parseInt(month) === 12 
      ? String(parseInt(year) + 1) 
      : year
    query = query
      .gte('date', year + '-' + month + '-01')
      .lt('date', nextYear + '-' + nextMonth + '-01')
  }

  if (filters?.expenseType) {
    query = query.eq('expense_type', filters.expenseType)
  }

  if (filters?.payerType) {
    query = query.eq('payer_type', filters.payerType)
  }

  const { data, error } = await query

  if (error) {
    return { error: 'Failed to fetch transactions' }
  }

  return { success: true, transactions: data }
}

export async function updateTransactionExpenseType(
  transactionId: string,
  expenseType: ExpenseType
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = UpdateExpenseTypeSchema.safeParse({ transactionId, expenseType })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ expense_type: expenseType })
    .eq('id', transactionId)
    .eq('group_id', currentUser.group_id)

  if (error) {
    return { error: 'Failed to update transaction' }
  }

  return { success: true }
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('group_id', currentUser.group_id)

  if (error) {
    return { error: 'Failed to delete transaction' }
  }

  return { success: true }
}
