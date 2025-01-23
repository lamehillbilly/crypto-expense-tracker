// types.ts

// Token interface from API
export interface Token {
    decimals: number;
    id: string;
    name: string;
    price: number;
    symbol: string;
  }
  
  export type TransactionType = 'Expense' | 'Held for Taxes' | 'Trades' | 'Income' | 'Claims';
  
  // Enhanced expense interface
  export interface ExpenseDetails {
    category?: string;
    description: string;
    vendor?: string;
  }
  
  // Interface for claims
  export interface ClaimDetails {
    totalAmount: number;
    tokenTags?: Token[];
    heldForTaxes: boolean;
    taxPercentage?: number;
    taxAmount?: number;
  }
  
  export interface Trade {
    id: number;
    tokenName: string;
    purchaseAmount: number;
    purchaseDate: string;
    status: 'open' | 'closed';
    closeAmount?: number;
    closeDate?: string;
    pnl?: number;
    daysHeld?: number;
  }
  
  export interface Entry {
    id: number;
    type: TransactionType;
    amount: number;
    date: string;
    txn?: string;
    tokenName?: string;
    purchaseAmount: number;
    purchaseDate: string;
    status: 'open' | 'closed';
    closeAmount?: number;
    closeDate?: string;
    pnl?: number;
    daysHeld?: number;
    expenseDetails?: ExpenseDetails;
    claimDetails?: ClaimDetails;
  }
  
  export interface PieChartData {
    name: string;
    value: number;
  }
  
  export interface FormState {
    selectedType: TransactionType | '';
    amount: string;
    txn: string;
    date: string;
    selectedTrade: string;
    tokenName: string;
    expenseDetails?: ExpenseDetails;
    claimDetails?: ClaimDetails;
  }

  export interface TaxSummary {
    byYear: any;
    totalHeld: number;
    byMonth: {
      [key: string]: number;
    };
    totalClaims: number;
    averageTaxRate: number;
  }