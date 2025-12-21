export type PayerType = 'UserA' | 'UserB' | 'Common';
export type ExpenseType = 'Household' | 'Personal';

export interface Transaction {
  id: string;
  group_id: string;
  user_id: string;
  date: string;
  amount: number;
  description: string;
  payer_type: PayerType;
  payer_user_id?: string | null;
  expense_type: ExpenseType;
  source_file_name?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  ratio_a: number;
  ratio_b: number;
  user_a_id: string;
  user_b_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  month: string;
  total_household: number;
  paid_by_a_household: number;
  paid_by_b_household: number;
  paid_by_common: number;
  balance_a: number;
  ratio_a: number;
  ratio_b: number;
}

export interface ColumnMapping {
  dateColumn: string | null;
  amountColumn: string | null;
  descriptionColumn: string | null;
  payerColumn: string | null;
}
