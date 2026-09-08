export type FinanceType = 'Work' | 'Personal';
export type CategoryScope = 'Work' | 'Personal' | 'Both';
export type TransactionDirection = 'Credit' | 'Debit';

export interface GoogleAccountInfo {
  email: string;
  name: string;
  avatar?: string;
  connectedAt: string;
  lastBackupAt?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  lastLogin?: string;
  googleAccount?: GoogleAccountInfo;
  profileAliases?: {
    Work: string;
    Personal: string;
    [key: string]: string;
  };
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  individualBudget: number; // in INR (₹)
  recurringDueDate?: number; // day of month, e.g. 5, 14, 28
}

export interface Category {
  id: string;
  name: string;
  type: CategoryScope;
  subcategories?: Subcategory[];
  icon?: string;
  isTransfer?: boolean; // e.g. "Credit Card Payment" - excluded from income/expense totals
}

export interface BankAccount {
  id: string;
  name: string; // e.g. IndusInd, IDFC, Kotak
  initialOpeningBalance: number;
  accountNumberMask?: string;
  color?: string;
}

export interface CreditCard {
  id: string;
  name: string; // e.g. SBM, Airtel Axis, Axis MyZone
  creditLimit: number; // in INR (₹)
  initialOpeningBalance: number; // opening debt
  cardNumberMask?: string;
  dueDateDay?: number;
  autoPay?: boolean;
  color?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: FinanceType; // Work / Personal
  categoryId: string;
  subcategoryId?: string;
  accountOrCardId: string; // BankAccount or CreditCard id
  direction: TransactionDirection; // Credit / Debit
  amount: number; // in INR (₹)
  notes?: string;
  receiptImage?: string;
  splitWith?: string[];
  createdAt: string;
}

// Computed monthly snapshot for an account
export interface BankAccountMonthLedger {
  account: BankAccount;
  openingBalance: number;
  credit: number;
  debit: number;
  balance: number; // opening + credit - debit
}

// Computed monthly snapshot for a credit card
export interface CreditCardMonthLedger {
  card: CreditCard;
  openingBalance: number;
  newSpendThisMonth: number; // Debit
  paymentsThisMonth: number; // Credit
  outstandingBalance: number; // opening + newSpend - payments
  availableCredit: number; // limit - outstandingBalance
}

// Monthly budget target overrides per category/subcategory
export interface MonthBudgetTarget {
  id: string;
  userId: string;
  monthKey: string; // "YYYY-MM" e.g. "2026-09"
  categoryId: string;
  subcategoryId?: string;
  amount: number;
}

export interface CategoryBudgetStatus {
  category: Category;
  budget: number;
  paidUsed: number;
  remaining: number;
  percentage: number;
  subcategoriesStatus: {
    subcategory: Subcategory;
    budget: number;
    paidUsed: number;
    remaining: number;
    percentage: number;
  }[];
}

export interface MonthSummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "September 2026"
  totalInflow: number;
  totalOutflow: number;
  workExpenseTotal: number;
  personalExpenseTotal: number;
  totalNetWorth: number;
  liquidCash: number;
  vaultsAndInvestments?: number;
  totalCreditCardDebt: number;
  workBudgetTotal: number;
  workBudgetUsed: number;
  workBudgetRemaining: number;
  personalBudgetTotal: number;
  personalBudgetUsed: number;
  personalBudgetRemaining: number;
}

export interface GoogleAccountInfo {
  email: string;
  name: string;
  avatarUrl?: string;
  connectedAt: string;
}
