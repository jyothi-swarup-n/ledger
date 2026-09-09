import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLedgerStorage } from '../hooks/useLedgerStorage';
import { authApi, clearTokens, getRefreshToken, ledgerApi } from '../services/api';
import {
  User,
  Transaction,
  BankAccount,
  CreditCard,
  Category,
  Subcategory,
  MonthBudgetTarget,
  BankAccountMonthLedger,
  CreditCardMonthLedger,
  CategoryBudgetStatus,
  MonthSummary,
  GoogleAccountInfo
} from '../types';
import {
  INITIAL_USER,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  STARTER_CATEGORIES
} from '../data/seedData';

interface FinanceContextType {
  currentUser: User | null;
  selectedMonth: string; // "YYYY-MM", e.g. "2026-09"
  setSelectedMonth: (monthKey: string) => void;
  availableMonths: string[]; // List of available/relevant months
  
  // Entities
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  
  // Ledger calculations for current month
  bankLedgers: BankAccountMonthLedger[];
  cardLedgers: CreditCardMonthLedger[];
  
  // Monthly overview
  monthSummary: MonthSummary;
  monthIncomeTransactions: Transaction[];
  monthWorkExpenseTransactions: Transaction[];
  monthPersonalExpenseTransactions: Transaction[];
  
  // Budgets for current month
  workCategoryBudgets: CategoryBudgetStatus[];
  personalCategoryBudgets: CategoryBudgetStatus[];
  
  // CRUD Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Budget overrides
  updateBudgetTarget: (categoryId: string, subcategoryId: string | undefined, amount: number) => void;
  
  // Account & Card Management
  addBankAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  
  // Category & Subcategory Management
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, sub: Omit<Subcategory, 'id' | 'categoryId'>) => void;
  updateSubcategory: (subcategoryId: string, updates: Partial<Subcategory>) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  
  // User Auth & Profiles
  usersList: User[];
  establishSession: (backendUser: any) => void;
  loginUser: (email: string, passwordHash?: string) => boolean;
  signupUser: (name: string, email: string, passwordHash: string) => boolean;
  loginWithGoogle: (email: string, name?: string) => boolean;
  logoutUser: () => void;
  updateUserProfile: (name: string, passwordHash?: string) => void;
  deleteUserAccount: () => Promise<void>;
  loadDemoData: () => void;
  resetUserData: () => void;
  
  // Google Account & Cloud Backup
  googleAccount: GoogleAccountInfo | null;
  connectGoogleAccount: (email: string, name?: string) => void;
  disconnectGoogleAccount: () => void;
  triggerGoogleBackup: () => Promise<void>;
  isGoogleBackingUp: boolean;
  lastGoogleBackup: string | null;

  // Profile Aliases & Management
  profileAliases: { Work: string; Personal: string; [key: string]: string };
  updateProfileAlias: (key: string, newName: string) => void;
  addProfileScope: (key: string, name: string) => void;

  // Cloud & VPS Sync (Backwards Compatibility)
  vpsStatus?: {
    host: string;
    isOnline: boolean;
    lastSynced: string;
    protocol: string;
  };
  triggerManualSync?: () => Promise<void>;
  exportDataJSON: () => string;
  exportDataCSV: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  
  // Formatters
  formatINR: (amount: number, options?: { showSign?: boolean; hideDecimals?: boolean }) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_USERS_KEY = 'kinetic_ledger_users_v2';
const STORAGE_CURRENT_USER_ID = 'kinetic_ledger_active_user_id';
const STORAGE_DATA_PREFIX = 'kinetic_ledger_data_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User state
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_CURRENT_USER_ID);
      if (activeId) {
        const saved = localStorage.getItem(STORAGE_USERS_KEY);
        const list: User[] = saved ? JSON.parse(saved) : [];
        const found = list.find((u) => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // 2. Month period state (defaulting to September 2026)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // 3. User-scoped ledger, hydrated before any persistence can run.
  const {
    bankAccounts, setBankAccounts, creditCards, setCreditCards,
    categories, setCategories, transactions, setTransactions, budgetTargets, setBudgetTargets,
  } = useLedgerStorage(currentUser?.id ?? null);

  const syncReadyRef = useRef(false);
  const syncInFlightRef = useRef(false);

  // 4. Google Account Cloud Backup state & Profile Aliases
  const [isGoogleBackingUp, setIsGoogleBackingUp] = useState(false);
  const [lastGoogleBackup, setLastGoogleBackup] = useState<string | null>('Today, 12:00 AM');
  const [profileAliases, setProfileAliases] = useState<{ Work: string; Personal: string; [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('kinetic_ledger_profile_aliases');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      Work: 'Work (Arsonist Holdings)',
      Personal: 'Personal'
    };
  });

  const updateProfileAlias = (key: string, newName: string) => {
    if (!newName.trim()) return;
    setProfileAliases((prev) => {
      const updated = { ...prev, [key]: newName.trim() };
      localStorage.setItem('kinetic_ledger_profile_aliases', JSON.stringify(updated));
      return updated;
    });
  };

  const addProfileScope = (key: string, name: string) => {
    if (!key.trim() || !name.trim()) return;
    setProfileAliases((prev) => {
      const updated = { ...prev, [key.trim()]: name.trim() };
      localStorage.setItem('kinetic_ledger_profile_aliases', JSON.stringify(updated));
      return updated;
    });
  };

  const connectGoogleAccount = (email: string, name?: string) => {
    if (!currentUser) return;
    const gAccount: GoogleAccountInfo = {
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0],
      connectedAt: new Date().toISOString(),
      lastBackupAt: new Date().toISOString()
    };
    const updatedUser: User = {
      ...currentUser,
      googleAccount: gAccount
    };
    setCurrentUser(updatedUser);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setLastGoogleBackup('Just now');
  };

  const disconnectGoogleAccount = () => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      googleAccount: undefined
    };
    setCurrentUser(updatedUser);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const triggerGoogleBackup = async () => {
    setIsGoogleBackingUp(true);
    // Simulate real cloud transmission of encrypted user ledger
    await new Promise((res) => setTimeout(res, 850));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastGoogleBackup(`Today at ${nowStr}`);
    if (currentUser?.googleAccount) {
      const updatedAccount = { ...currentUser.googleAccount, lastBackupAt: new Date().toISOString() };
      const updatedUser = { ...currentUser, googleAccount: updatedAccount };
      setCurrentUser(updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    }
    setIsGoogleBackingUp(false);
  };

  const googleAccount = currentUser?.googleAccount || null;

  const syncPayload = useCallback(() => ({
    bank_accounts: bankAccounts.map((item) => ({ ...item })),
    credit_cards: creditCards.map((item) => ({ ...item })),
    categories: categories.map((item) => ({ ...item })),
    transactions: transactions.map((item) => ({ ...item })),
    budget_targets: budgetTargets.map((item) => ({ ...item })),
  }), [bankAccounts, creditCards, categories, transactions, budgetTargets]);

  const applyServerSnapshot = useCallback((snapshot: any) => {
    const visible = (items: any[]) => items.filter((item) => !item.deleted).map(({ user_id, updated_at, deleted, ...item }) => item);
    const serverCategories = visible(snapshot.categories || []).map((category: Category) => ({
      ...category,
      subcategories: (category.subcategories || []).map((subcategory: Subcategory) => ({
        ...subcategory,
        categoryId: category.id,
      })),
    }));
    setBankAccounts(visible(snapshot.bank_accounts || []));
    setCreditCards(visible(snapshot.credit_cards || []));
    setCategories(serverCategories);
    setTransactions(visible(snapshot.transactions || []));
    setBudgetTargets(visible(snapshot.budget_targets || []));
  }, [setBankAccounts, setCreditCards, setCategories, setTransactions, setBudgetTargets]);

  const syncWithBackend = useCallback(async () => {
    if (!currentUser || syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const snapshot = await ledgerApi.pull();
      const serverHasData = [
        snapshot.bank_accounts,
        snapshot.credit_cards,
        snapshot.categories,
        snapshot.transactions,
        snapshot.budget_targets,
      ].some((items) => items.length > 0);

      if (snapshot.full && serverHasData) {
        applyServerSnapshot(snapshot);
      } else if (snapshot.full) {
        const localHasData = Object.values(syncPayload()).some((items: any[]) => items.length > 0);
        if (localHasData) await ledgerApi.push(syncPayload());
      } else {
        applyServerSnapshot(snapshot);
      }
      localStorage.setItem(`kinetic_ledger_last_sync_${currentUser.id}`, snapshot.server_time);
      setVpsStatus((prev) => ({ ...prev, lastSynced: 'Just now', isOnline: true }));
    } catch (error) {
      console.error('Ledger sync failed:', error);
      setVpsStatus((prev) => ({ ...prev, isOnline: false }));
    } finally {
      syncReadyRef.current = true;
      syncInFlightRef.current = false;
    }
  }, [currentUser, applyServerSnapshot, syncPayload]);

  const pushTombstone = useCallback(async (collection: string, id: string) => {
    const payload = {
      bank_accounts: [],
      credit_cards: [],
      categories: [],
      transactions: [],
      budget_targets: [],
    } as Record<string, any[]>;
    payload[collection] = [{ id, updated_at: new Date().toISOString(), deleted: true }];
    await ledgerApi.push(payload as any);
  }, []);

  useEffect(() => {
    syncReadyRef.current = false;
    if (currentUser) void syncWithBackend();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || !syncReadyRef.current || syncInFlightRef.current) return;
    const timer = window.setTimeout(() => {
      ledgerApi.push(syncPayload()).catch((error) => {
        console.error('Ledger push failed:', error);
        setVpsStatus((prev) => ({ ...prev, isOnline: false }));
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentUser?.id, bankAccounts, creditCards, categories, transactions, budgetTargets, syncPayload]);

  // VPS compatibility state (deprecated in favor of Google Cloud Backup)
  const [vpsStatus, setVpsStatus] = useState({
    host: 'arsonist.online',
    isOnline: true,
    lastSynced: '2 mins ago',
    protocol: 'Encrypted Cloud Storage'
  });

  // Save users list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usersList));
    } catch (e) {
      console.error(e);
    }
  }, [usersList]);

  // Save current active user ID
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_CURRENT_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_ID);
    }
  }, [currentUser]);

  // Available chronological months (from transactions, plus Aug, Sep, Oct 2026)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>(['2026-08', '2026-09', '2026-10']);
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort();
  }, [transactions]);

  // Helper to format currency in INR (₹)
  const formatINR = (amount: number, options?: { showSign?: boolean; hideDecimals?: boolean }) => {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    const fractionDigits = options?.hideDecimals ? 0 : 2;
    
    // Format using standard Indian numbering format (lakhs/crores)
    const formattedNum = absVal.toLocaleString('en-IN', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });

    const sign = isNegative ? '-' : options?.showSign && amount > 0 ? '+' : '';
    return `${sign}₹${formattedNum}`;
  };

  // Helper to get all months up to target month in chronological order
  const getMonthsUpTo = (targetMonth: string): string[] => {
    const all = Array.from(new Set([...availableMonths, targetMonth])).sort();
    return all.filter((m) => m <= targetMonth);
  };

  // =========================================================================
  // CALCULATION ENGINE (Section 6)
  // Recomputes monthly carry-forward balances and ledgers across all periods
  // =========================================================================
  const { bankLedgersMap, cardLedgersMap } = useMemo(() => {
    // For each account and card, we calculate month-by-month rollover from the first month up to any month
    const bankMap = new Map<string, Map<string, BankAccountMonthLedger>>();
    const cardMap = new Map<string, Map<string, CreditCardMonthLedger>>();

    // Initial setup for all accounts & cards
    bankAccounts.forEach((acc) => bankMap.set(acc.id, new Map()));
    creditCards.forEach((card) => cardMap.set(card.id, new Map()));

    // Chronological processing of all available months
    const sortedMonths = [...availableMonths].sort();

    // Track running closing balances
    const runningBankClosing = new Map<string, number>();
    const runningCardClosing = new Map<string, number>();

    bankAccounts.forEach((acc) => runningBankClosing.set(acc.id, acc.initialOpeningBalance));
    creditCards.forEach((card) => runningCardClosing.set(card.id, card.initialOpeningBalance));

    for (let i = 0; i < sortedMonths.length; i++) {
      const m = sortedMonths[i];
      const monthTxs = transactions.filter((t) => t.date.startsWith(m));

      // 1. Bank Accounts
      bankAccounts.forEach((acc) => {
        const opening = runningBankClosing.get(acc.id) ?? acc.initialOpeningBalance;
        
        // Compute Credit and Debit for this month
        let credit = 0;
        let debit = 0;
        monthTxs.forEach((tx) => {
          if (tx.accountOrCardId === acc.id) {
            if (tx.direction === 'Credit') credit += tx.amount;
            if (tx.direction === 'Debit') debit += tx.amount;
          }
        });

        const closing = opening + credit - debit;
        runningBankClosing.set(acc.id, closing);

        const ledger: BankAccountMonthLedger = {
          account: acc,
          openingBalance: opening,
          credit,
          debit,
          balance: closing
        };
        bankMap.get(acc.id)?.set(m, ledger);
      });

      // 2. Credit Cards
      creditCards.forEach((card) => {
        const opening = runningCardClosing.get(card.id) ?? card.initialOpeningBalance;

        let newSpend = 0; // Debit (purchases)
        let payments = 0; // Credit (payments toward card)
        monthTxs.forEach((tx) => {
          if (tx.accountOrCardId === card.id) {
            if (tx.direction === 'Debit') newSpend += tx.amount;
            if (tx.direction === 'Credit') payments += tx.amount;
          }
        });

        const closingOutstanding = opening + newSpend - payments;
        runningCardClosing.set(card.id, closingOutstanding);

        const ledger: CreditCardMonthLedger = {
          card,
          openingBalance: opening,
          newSpendThisMonth: newSpend,
          paymentsThisMonth: payments,
          outstandingBalance: closingOutstanding,
          availableCredit: card.creditLimit - closingOutstanding
        };
        cardMap.get(card.id)?.set(m, ledger);
      });
    }

    return { bankLedgersMap: bankMap, cardLedgersMap: cardMap };
  }, [availableMonths, bankAccounts, creditCards, transactions]);

  // Current month's ledgers
  const bankLedgers = useMemo(() => {
    return bankAccounts.map((acc) => {
      const monthData = bankLedgersMap.get(acc.id)?.get(selectedMonth);
      if (monthData) return monthData;
      return {
        account: acc,
        openingBalance: acc.initialOpeningBalance,
        credit: 0,
        debit: 0,
        balance: acc.initialOpeningBalance
      };
    });
  }, [bankAccounts, bankLedgersMap, selectedMonth]);

  const cardLedgers = useMemo(() => {
    return creditCards.map((card) => {
      const monthData = cardLedgersMap.get(card.id)?.get(selectedMonth);
      if (monthData) return monthData;
      return {
        card,
        openingBalance: card.initialOpeningBalance,
        newSpendThisMonth: 0,
        paymentsThisMonth: 0,
        outstandingBalance: card.initialOpeningBalance,
        availableCredit: card.creditLimit - card.initialOpeningBalance
      };
    });
  }, [creditCards, cardLedgersMap, selectedMonth]);

  // Filter current month transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  // Income list: Chronological list of Income-category transactions for the month (Section 5.3)
  const monthIncomeTransactions = useMemo(() => {
    return currentMonthTransactions.filter((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      return cat?.name === 'Income' || tx.categoryId === 'cat_income';
    });
  }, [currentMonthTransactions, categories]);

  // Work expenses list
  const monthWorkExpenseTransactions = useMemo(() => {
    return currentMonthTransactions.filter((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      // Exclude Income and Transfer categories from Expense list (Section 6.2 & Section 12.12)
      if (cat?.name === 'Income' || cat?.isTransfer) return false;
      return tx.type === 'Work';
    });
  }, [currentMonthTransactions, categories]);

  // Personal expenses list
  const monthPersonalExpenseTransactions = useMemo(() => {
    return currentMonthTransactions.filter((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (cat?.name === 'Income' || cat?.isTransfer) return false;
      return tx.type === 'Personal';
    });
  }, [currentMonthTransactions, categories]);

  // =========================================================================
  // BUDGET CALCULATIONS (Section 5.6 & 6.2)
  // Work Budget ("Arsonist Holdings") and Personal Budget
  // =========================================================================
  const getBudgetStatusForScope = (scope: 'Work' | 'Personal'): CategoryBudgetStatus[] => {
    const scopeCategories = categories.filter((cat) => {
      if (cat.name === 'Income' || cat.isTransfer) return false;
      return cat.type === scope || cat.type === 'Both';
    });

    return scopeCategories.map((cat) => {
      const subs = cat.subcategories || [];

      // Subcategories breakdown
      const subcategoriesStatus = subs.map((sub) => {
        // Find if user set a custom target for this month
        const targetOverride = budgetTargets.find(
          (bt) => bt.monthKey === selectedMonth && bt.subcategoryId === sub.id
        );
        const targetAmount = targetOverride ? targetOverride.amount : sub.individualBudget;

        // Paid/used: sum of expense transactions in this month with this subcategory & scope
        const paidUsed = currentMonthTransactions
          .filter(
            (tx) =>
              tx.subcategoryId === sub.id &&
              (cat.type === 'Both' ? tx.type === scope : true) &&
              tx.direction === 'Debit'
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        const remaining = targetAmount - paidUsed;
        const percentage = targetAmount > 0 ? (paidUsed / targetAmount) * 100 : 0;

        return {
          subcategory: sub,
          budget: targetAmount,
          paidUsed,
          remaining,
          percentage
        };
      });

      // Category total budget:
      // If subcategories exist: sum of subcategory budgets (Section 4.5)
      // Otherwise entered directly from override or default
      let categoryBudget = 0;
      if (subs.length > 0) {
        categoryBudget = subcategoriesStatus.reduce((acc, curr) => acc + curr.budget, 0);
      } else {
        const catOverride = budgetTargets.find(
          (bt) => bt.monthKey === selectedMonth && bt.categoryId === cat.id && !bt.subcategoryId
        );
        categoryBudget = catOverride ? catOverride.amount : 0;
      }

      // Category total Paid/Used: sum of all transactions posted against this category in this month & scope
      const categoryPaidUsed = currentMonthTransactions
        .filter(
          (tx) =>
            tx.categoryId === cat.id &&
            (cat.type === 'Both' ? tx.type === scope : true) &&
            tx.direction === 'Debit'
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const categoryRemaining = categoryBudget - categoryPaidUsed;
      const categoryPercentage = categoryBudget > 0 ? (categoryPaidUsed / categoryBudget) * 100 : 0;

      return {
        category: cat,
        budget: categoryBudget,
        paidUsed: categoryPaidUsed,
        remaining: categoryRemaining,
        percentage: categoryPercentage,
        subcategoriesStatus
      };
    });
  };

  const workCategoryBudgets = useMemo(
    () => getBudgetStatusForScope('Work'),
    [categories, budgetTargets, selectedMonth, currentMonthTransactions]
  );

  const personalCategoryBudgets = useMemo(
    () => getBudgetStatusForScope('Personal'),
    [categories, budgetTargets, selectedMonth, currentMonthTransactions]
  );

  // =========================================================================
  // MONTH SUMMARY TOTALS (Dashboard Metrics)
  // =========================================================================
  const monthSummary: MonthSummary = useMemo(() => {
    const [year, monthNum] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Total Inflow: all Credit transactions in month (excluding transfer CC payments)
    const totalInflow = currentMonthTransactions
      .filter((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        return !cat?.isTransfer && tx.direction === 'Credit';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Total Outflow: all Debit transactions in month (excluding transfer CC payments)
    const totalOutflow = currentMonthTransactions
      .filter((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        return !cat?.isTransfer && tx.direction === 'Debit';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const workExpenseTotal = monthWorkExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const personalExpenseTotal = monthPersonalExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Total Liquid Cash across bank accounts
    const liquidCash = bankLedgers.reduce((acc, curr) => acc + curr.balance, 0);

    // Total Credit Card debt outstanding
    const totalCreditCardDebt = cardLedgers.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

    // Total Net Worth is the pure ledger balance: Total Liquid Bank Cash minus Credit Card Debt
    const totalNetWorth = liquidCash - totalCreditCardDebt;

    // Budgets
    const workBudgetTotal = workCategoryBudgets.reduce((acc, curr) => acc + curr.budget, 0);
    const workBudgetUsed = workCategoryBudgets.reduce((acc, curr) => acc + curr.paidUsed, 0);
    const workBudgetRemaining = workBudgetTotal - workBudgetUsed;

    const personalBudgetTotal = personalCategoryBudgets.reduce((acc, curr) => acc + curr.budget, 0);
    const personalBudgetUsed = personalCategoryBudgets.reduce((acc, curr) => acc + curr.paidUsed, 0);
    const personalBudgetRemaining = personalBudgetTotal - personalBudgetUsed;

    return {
      monthKey: selectedMonth,
      monthLabel,
      totalInflow,
      totalOutflow,
      workExpenseTotal,
      personalExpenseTotal,
      totalNetWorth,
      liquidCash,
      vaultsAndInvestments: 0,
      totalCreditCardDebt,
      workBudgetTotal,
      workBudgetUsed,
      workBudgetRemaining,
      personalBudgetTotal,
      personalBudgetUsed,
      personalBudgetRemaining
    };
  }, [
    selectedMonth,
    currentMonthTransactions,
    categories,
    monthWorkExpenseTransactions,
    monthPersonalExpenseTransactions,
    bankLedgers,
    cardLedgers,
    workCategoryBudgets,
    personalCategoryBudgets
  ]);

  // =========================================================================
  // TRANSACTION CRUD
  // =========================================================================
  const addTransaction = (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    void pushTombstone('transactions', id).catch((error) => console.error('Transaction tombstone failed:', error));
  };

  // =========================================================================
  // BUDGET TARGETS
  // =========================================================================
  const updateBudgetTarget = (categoryId: string, subcategoryId: string | undefined, amount: number) => {
    if (!currentUser) return;
    setBudgetTargets((prev) => {
      const filtered = prev.filter(
        (bt) =>
          !(
            bt.monthKey === selectedMonth &&
            bt.categoryId === categoryId &&
            bt.subcategoryId === subcategoryId
          )
      );
      const newTarget: MonthBudgetTarget = {
        id: `bt_${Date.now()}`,
        userId: currentUser.id,
        monthKey: selectedMonth,
        categoryId,
        subcategoryId,
        amount
      };
      return [...filtered, newTarget];
    });
  };

  // =========================================================================
  // BANK ACCOUNT & CARD CRUD
  // =========================================================================
  const addBankAccount = (acc: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = {
      ...acc,
      id: `bank_${Date.now()}`
    };
    setBankAccounts((prev) => [...prev, newAcc]);
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
    void pushTombstone('bank_accounts', id).catch((error) => console.error('Account tombstone failed:', error));
  };

  const addCreditCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...card,
      id: `card_${Date.now()}`
    };
    setCreditCards((prev) => [...prev, newCard]);
  };

  const updateCreditCard = (id: string, updates: Partial<CreditCard>) => {
    setCreditCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
    void pushTombstone('credit_cards', id).catch((error) => console.error('Card tombstone failed:', error));
  };

  // =========================================================================
  // CATEGORIES & SUBCATEGORIES CRUD
  // =========================================================================
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat_${Date.now()}`
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    void pushTombstone('categories', id).catch((error) => console.error('Category tombstone failed:', error));
  };

  const addSubcategory = (categoryId: string, sub: Omit<Subcategory, 'id' | 'categoryId'>) => {
    const newSub: Subcategory = {
      ...sub,
      id: `sub_${Date.now()}`,
      categoryId
    };
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === categoryId) {
          const existingSubs = c.subcategories || [];
          return { ...c, subcategories: [...existingSubs, newSub] };
        }
        return c;
      })
    );
  };

  const updateSubcategory = (subcategoryId: string, updates: Partial<Subcategory>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.subcategories && c.subcategories.some((s) => s.id === subcategoryId)) {
          return {
            ...c,
            subcategories: c.subcategories.map((s) =>
              s.id === subcategoryId ? { ...s, ...updates } : s
            )
          };
        }
        return c;
      })
    );
  };

  const deleteSubcategory = (subcategoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.subcategories) {
          return {
            ...c,
            subcategories: c.subcategories.filter((s) => s.id !== subcategoryId)
          };
        }
        return c;
      })
    );
  };

  // =========================================================================
  // MULTI-USER AUTH & PROFILE (Section 5.1)
  // =========================================================================
  // Establish a session from a real backend auth response (email/OTP, login, Google).
  const establishSession = (backendUser: any) => {
    if (!backendUser || !backendUser.id) return;
    const providers: string[] = backendUser.auth_providers || [];
    const mapped: User = {
      id: backendUser.id,
      name: backendUser.name || undefined,
      email: (backendUser.email || '').toLowerCase(),
      createdAt: backendUser.created_at || new Date().toISOString(),
      lastLogin: backendUser.last_login || new Date().toISOString(),
      profileAliases: backendUser.profile_aliases || undefined,
      googleAccount: providers.includes('google')
        ? {
            email: (backendUser.email || '').toLowerCase(),
            name: backendUser.name || (backendUser.email || '').split('@')[0],
            connectedAt: new Date().toISOString(),
            lastBackupAt: new Date().toISOString(),
          }
        : undefined,
    };
    setUsersList((prev) => [...prev.filter((u) => u.id !== mapped.id), mapped]);
    setCurrentUser(mapped);
  };

  const loginUser = (email: string, passwordHash?: string): boolean => {
    const found = usersList.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      if (passwordHash && found.passwordHash && found.passwordHash !== passwordHash) {
        return false;
      }
      const updated = { ...found, lastLogin: new Date().toISOString() };
      setUsersList((prev) => prev.map((u) => (u.id === found.id ? updated : u)));
      setCurrentUser(updated);
      return true;
    }
    return false;
  };

  const signupUser = (name: string, email: string, passwordHash: string): boolean => {
    const exists = usersList.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) return false;

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim() || undefined,
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Clean slate for new signups
    const userKey = `${STORAGE_DATA_PREFIX}${newUser.id}`;
    localStorage.setItem(
      userKey,
      JSON.stringify({
        bankAccounts: [],
        creditCards: [],
        categories: STARTER_CATEGORIES,
        transactions: [],
        budgetTargets: []
      })
    );

    setUsersList((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setBankAccounts([]);
    setCreditCards([]);
    setCategories(STARTER_CATEGORIES);
    setTransactions([]);
    setBudgetTargets([]);
    return true;
  };

  const loginWithGoogle = (email: string, name?: string): boolean => {
    const normalized = email.trim().toLowerCase();
    let user = usersList.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      user = {
        id: `user_g_${Date.now()}`,
        name: name?.trim() || email.split('@')[0],
        email: normalized,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        googleAccount: {
          email: normalized,
          name: name?.trim() || email.split('@')[0],
          connectedAt: new Date().toISOString(),
          lastBackupAt: new Date().toISOString()
        }
      };
      // Clean slate for new Google user
      const userKey = `${STORAGE_DATA_PREFIX}${user.id}`;
      localStorage.setItem(
        userKey,
        JSON.stringify({
          bankAccounts: [],
          creditCards: [],
          categories: STARTER_CATEGORIES,
          transactions: [],
          budgetTargets: []
        })
      );
      setUsersList((prev) => [...prev, user!]);
      setBankAccounts([]);
      setCreditCards([]);
      setCategories(STARTER_CATEGORIES);
      setTransactions([]);
      setBudgetTargets([]);
    } else {
      const updated: User = {
        ...user,
        lastLogin: new Date().toISOString(),
        googleAccount: user.googleAccount || {
          email: normalized,
          name: name?.trim() || email.split('@')[0],
          connectedAt: new Date().toISOString(),
          lastBackupAt: new Date().toISOString()
        }
      };
      setUsersList((prev) => prev.map((u) => (u.id === user!.id ? updated : u)));
      user = updated;
    }
    setCurrentUser(user);
    return true;
  };

  const loadDemoData = () => {
    if (!currentUser) return;
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgetTargets([]);
  };

  const resetUserData = () => {
    if (!currentUser) return;
    void ledgerApi.reset().catch((error) => console.error('Backend ledger reset failed:', error));
    setBankAccounts([]);
    setCreditCards([]);
    setCategories(STARTER_CATEGORIES);
    setTransactions([]);
    setBudgetTargets([]);
  };

  const logoutUser = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) void authApi.logout(refreshToken).catch(() => undefined);
    clearTokens();
    setCurrentUser(null);
  };

  const updateUserProfile = (name: string, passwordHash?: string) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      name: name.trim() || undefined,
      ...(passwordHash ? { passwordHash } : {})
    };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const deleteUserAccount = async () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    await authApi.deleteAccount().catch((error) => {
      console.error('Backend account deletion failed:', error);
    });
    clearTokens();
    // Clear storage for this user
    localStorage.removeItem(`${STORAGE_DATA_PREFIX}${userId}`);
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    // Switch to first remaining user or null
    const remaining = usersList.filter((u) => u.id !== userId);
    if (remaining.length > 0) {
      setCurrentUser(remaining[0]);
    } else {
      setCurrentUser(null);
    }
  };

  // =========================================================================
  // VPS SYNC & EXPORT/IMPORT
  // =========================================================================
  const triggerManualSync = async () => {
    await syncWithBackend();
  };

  const exportDataJSON = (): string => {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      bankAccounts,
      creditCards,
      categories,
      transactions,
      budgetTargets
    };
    return JSON.stringify(payload, null, 2);
  };

  const exportDataCSV = (): string => {
    const headers = [
      'Date',
      'Description',
      'Type',
      'Category',
      'Subcategory',
      'Account/Card',
      'Direction',
      'Amount (INR)'
    ];

    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
      let subName = '';
      if (t.subcategoryId) {
        const catObj = categories.find((c) => c.id === t.categoryId);
        subName = catObj?.subcategories?.find((s) => s.id === t.subcategoryId)?.name || t.subcategoryId;
      }
      const accName =
        bankAccounts.find((b) => b.id === t.accountOrCardId)?.name ||
        creditCards.find((c) => c.id === t.accountOrCardId)?.name ||
        t.accountOrCardId;

      return [
        `"${t.date}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.type}"`,
        `"${cat}"`,
        `"${subName}"`,
        `"${accName}"`,
        `"${t.direction}"`,
        t.amount
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.bankAccounts) setBankAccounts(parsed.bankAccounts);
      if (parsed.creditCards) setCreditCards(parsed.creditCards);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.transactions) setTransactions(parsed.transactions);
      if (parsed.budgetTargets) setBudgetTargets(parsed.budgetTargets);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        bankAccounts,
        creditCards,
        categories,
        transactions,
        bankLedgers,
        cardLedgers,
        monthSummary,
        monthIncomeTransactions,
        monthWorkExpenseTransactions,
        monthPersonalExpenseTransactions,
        workCategoryBudgets,
        personalCategoryBudgets,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetTarget,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        usersList,
        establishSession,
        loginUser,
        signupUser,
        loginWithGoogle,
        logoutUser,
        updateUserProfile,
        deleteUserAccount,
        loadDemoData,
        resetUserData,
        googleAccount,
        connectGoogleAccount,
        disconnectGoogleAccount,
        triggerGoogleBackup,
        isGoogleBackingUp,
        lastGoogleBackup,
        profileAliases,
        updateProfileAlias,
        addProfileScope,
        vpsStatus,
        triggerManualSync,
        exportDataJSON,
        exportDataCSV,
        importDataJSON,
        formatINR
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
