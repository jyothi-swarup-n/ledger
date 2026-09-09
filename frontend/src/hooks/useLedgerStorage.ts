import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { BankAccount, Category, CreditCard, MonthBudgetTarget, Transaction } from '../types';
import { STARTER_CATEGORIES } from '../data/seedData';

interface LedgerData {
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  budgetTargets: MonthBudgetTarget[];
}
interface LedgerSnapshot { userId: string | null; data: LedgerData; }
const storageKey = (userId: string) => `kinetic_ledger_data_${userId}`;
const emptyLedger = (): LedgerData => ({ bankAccounts: [], creditCards: [], categories: STARTER_CATEGORIES, transactions: [], budgetTargets: [] });

function readLedger(userId: string | null): LedgerSnapshot {
  const data = emptyLedger();
  if (userId) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null');
      if (saved && typeof saved === 'object') {
        for (const key of Object.keys(data) as (keyof LedgerData)[]) {
          if (Array.isArray(saved[key])) Object.assign(data, { [key]: saved[key] });
        }
      }
    } catch (error) {
      console.error('Failed to load user ledger:', error);
    }
  }
  return { userId, data };
}

// Hydrate before the first persist, including StrictMode's repeated mount effects.
// The owner guard also prevents one user's ledger being written into another's key.
export const useLedgerStorage = (userId: string | null) => {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>(() => readLedger(userId));
  useEffect(() => {
    if (snapshot.userId !== userId) setSnapshot(readLedger(userId));
  }, [userId, snapshot.userId]);
  useEffect(() => {
    if (!userId || snapshot.userId !== userId) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(snapshot.data));
    } catch (error) {
      console.error('Failed to persist user ledger:', error);
    }
  }, [userId, snapshot]);

  const updateField = useCallback(<K extends keyof LedgerData>(key: K, value: SetStateAction<LedgerData[K]>) => {
    setSnapshot((previous) => {
      const base = previous.userId === userId ? previous : readLedger(userId);
      const next = typeof value === 'function' ? value(base.data[key]) : value;
      return { userId, data: { ...base.data, [key]: next } };
    });
  }, [userId]);
  const setBankAccounts = useCallback<Dispatch<SetStateAction<BankAccount[]>>>((value) => updateField('bankAccounts', value), [updateField]);
  const setCreditCards = useCallback<Dispatch<SetStateAction<CreditCard[]>>>((value) => updateField('creditCards', value), [updateField]);
  const setCategories = useCallback<Dispatch<SetStateAction<Category[]>>>((value) => updateField('categories', value), [updateField]);
  const setTransactions = useCallback<Dispatch<SetStateAction<Transaction[]>>>((value) => updateField('transactions', value), [updateField]);
  const setBudgetTargets = useCallback<Dispatch<SetStateAction<MonthBudgetTarget[]>>>((value) => updateField('budgetTargets', value), [updateField]);
  return {
    ...(snapshot.userId === userId ? snapshot.data : emptyLedger()),
    setBankAccounts, setCreditCards, setCategories, setTransactions, setBudgetTargets,
  };
};