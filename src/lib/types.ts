export type PayerType = "UserA" | "UserB";
export type ExpenseType = "Household" | "Personal";

export interface Transaction {
  id: string;
  group_id: string;
  user_id: string;
  date: string;
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
  balance_a: number;
  ratio_a: number;
  ratio_b: number;
  paid_by_a_personal: number;
  paid_by_b_personal: number;
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
