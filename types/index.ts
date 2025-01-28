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
  details?: EntryDetails;
}

export type TransactionType = 'Income' | 'Expense' | 'Claims' | 'Trade'; 

export interface Token {
  id: string;
  symbol: string;
  name: string;
}

export interface Entry {
  id: string | number;
  date: string;
  totalAmount: number;
  tokenTotals?: Record<string, number>;
  taxAmount?: number;
  txn?: string;
}

export interface Claim extends Entry {
  id: string;
}
interface TokenDetail {
  tokenSymbol: string;
  amount: number;
}

interface ClaimRequestBody {
  date: string;
  tokenDetails: TokenDetail[];
  totalAmount: number;
  heldForTaxes: boolean;
  taxAmount?: number;
  txn?: string;
}

interface EntryDetails {
  description?: string;
  category?: string;
  vendor?: string;
  taxDeductible?: boolean;
  icon?: string;
  color?: string;
}