export interface Entry {
  id?: number;
  type: TransactionType;
  amount: number;
  date: string;
  txn?: string | null;
  expenseDetails?: ExpenseDetails | null;
  pnl?: number;
  tokenSymbol?: string;
  status?: 'open' | 'closed';
}

export type TransactionType = 'Income' | 'Expense' | 'Claims' | 'Trade'; 