// types.ts

import { ReactNode } from "react";

// Token interface from API
export interface Token {
    decimals: number;
    id: string;
    name: string;
    price: number;
    symbol: string;
  }
  
  export type TransactionType = 'Expense' | 'Income' | 'Trades' | 'Claims';
  
  // Enhanced expense interface
  export interface ExpenseDetails {
    color: string | undefined;
    icon: string | undefined;
    taxDeductible: boolean;
    description: string;
    vendor: string;
    category?: string;
  }
  
  // Interface for claims
  export interface ClaimDetails {
    taxPercentage: ReactNode;
    tokenTags: string[];
    tokenClaims: TokenClaim[];
    totalAmount: number;
    heldForTaxes: boolean;
    taxAmount?: number;
    date: string;
  }
  
  export interface Trade {
    pnl: null;
    daysHeld: null;
    purchaseAmount: any;
    id: number;
    tokenName: string;
    amount: number;
    purchaseDate: string;
    closeAmount?: number;
    closeDate?: string;
    status: 'open' | 'closed';
  }
  
  export interface TradeDetails {
    tokenName: string;
    purchaseAmount: number;
    purchaseDate: string;
    closeAmount?: number;
    closeDate?: string;
  }
  
  export interface Entry {
    tokenTotals: {};
    totalAmount: any;
    tradeDetails: TradeDetails;
    id: string;
    type: TransactionType;
    amount: number;
    date: string;
    txn?: string;
    tokenName?: string;
    purchaseAmount: number;
    purchaseDate: string;
    status?: 'open' | 'closed';
    pnl?: number;
    daysHeld?: number;
    expenseDetails?: ExpenseDetails;
    claimDetails?: ClaimDetails;
    tokenSymbol?: string;
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

  export interface TokenClaim {
    totalAmount: number;
    tokenClaims: boolean;
    tokenId: string;
    tokenSymbol: string;
    amount: number;
  }
  
  export interface DailyClaimAggregate {
    date: string;
    claims: ClaimDetails[];
    totalAmount: number;
    tokenTotals: Record<string, number>;
  }

  export interface Claim {
    id: string;
    date: string;
    totalAmount: number;
    tokenTotals?: Record<string, number>;
    taxAmount?: number;
    txn?: string;
  }

  export interface Category {
    id: string;
    name: string;
    taxDeductible: boolean;
  }