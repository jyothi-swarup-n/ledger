import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, Briefcase, CreditCard, Plus, Receipt, User } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';

interface RecentStreamProps {
  onNavigate: (tab: string) => void;
  onSelectTransaction?: (transaction: Transaction) => void;
}

export const RecentStream: React.FC<RecentStreamProps> = ({ onNavigate, onSelectTransaction }) => {
  const { transactions, categories, selectedMonth, formatINR } = useFinance();
  const [filter, setFilter] = useState<'all' | 'income' | 'work' | 'personal'>('all');
  const filtered = useMemo(() => transactions.filter((tx) => {
    if (!tx.date.startsWith(`${selectedMonth}-`)) return false;
    const category = categories.find((item) => item.id === tx.categoryId);
    if (filter === 'income') return category?.name === 'Income' || tx.categoryId === 'cat_income' || tx.direction === 'Credit';
    if (filter === 'work') return tx.type === 'Work' && category?.name !== 'Income' && !category?.isTransfer;
    if (filter === 'personal') return tx.type === 'Personal' && category?.name !== 'Income' && !category?.isTransfer;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date)), [transactions, categories, selectedMonth, filter]);

  return (
    <section className="records-stream" data-testid="recent-stream-section" aria-labelledby="stream-title">
      <div className="records-section-heading">
        <div className="records-heading-with-icon"><Receipt size={17} className="records-lime" aria-hidden="true" />
          <h2 id="stream-title" className="records-section-title" data-testid="recent-stream-title">Recent Stream <span className="records-count" data-testid="transaction-count">{filtered.length}</span></h2></div>
        <button type="button" className="records-text-action" onClick={() => onNavigate('log')} data-testid="new-entry-button"><Plus size={14} />New Entry</button>
      </div>
      <div className="records-stream-filters" role="group" aria-label="Transaction filter" data-testid="transaction-filters">
        {(['all', 'income', 'work', 'personal'] as const).map((mode) => (
          <button type="button" key={mode} onClick={() => setFilter(mode)} aria-pressed={filter === mode}
            className={filter === mode ? 'is-active' : ''} data-testid={`stream-filter-${mode}`}>{mode}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="records-stream-empty" data-testid="transactions-empty-state">
          <Receipt size={24} aria-hidden="true" />
          <span data-testid="transactions-empty-title">{filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}</span>
          <button type="button" className="records-text-action" onClick={() => onNavigate('log')} data-testid="log-first-transaction-button"><Plus size={14} />Log a transaction</button>
        </div>
      ) : <div className="records-transaction-list" data-testid="transaction-list">
        {filtered.slice(0, 10).map((tx) => {
          const category = categories.find((item) => item.id === tx.categoryId);
          const credit = tx.direction === 'Credit' || category?.name === 'Income' || tx.categoryId === 'cat_income';
          const Icon = credit ? ArrowDownLeft : category?.isTransfer ? CreditCard : tx.type === 'Work' ? Briefcase : User;
          return (
            <button type="button" key={tx.id} className="records-transaction" onClick={() => onSelectTransaction?.(tx)} data-testid={`transaction-${tx.id}`}>
              <span className={`records-transaction-icon ${credit ? 'records-lime' : tx.type === 'Work' ? 'records-blue' : 'records-coral'}`}><Icon size={18} /></span>
              <span className="records-transaction-detail">
                <strong data-testid={`transaction-description-${tx.id}`}>{tx.description}</strong>
                <span data-testid={`transaction-meta-${tx.id}`}><span className="records-tag">{tx.type}</span>{category?.name || 'Expense'} · {tx.date}</span>
              </span>
              <span className={`records-transaction-amount ${credit ? 'records-lime' : 'records-coral'}`}>
                <strong data-testid={`transaction-amount-${tx.id}`}>{credit ? '+' : '−'}{formatINR(tx.amount)}</strong>
                <small data-testid={`transaction-direction-${tx.id}`}>{credit ? 'Credit / Income' : `${tx.type} Debit`}</small>
              </span>
            </button>
          );
        })}
      </div>}
    </section>
  );
};