import React from 'react';
import { Wallet, PlusCircle, PieChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MonthSelect } from '../MonthSelect';

export const NetWorth: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { monthSummary, formatINR } = useFinance();
  const amount = formatINR(monthSummary.totalNetWorth);
  return (
    <section className="records-net-worth" data-testid="net-worth-section" aria-labelledby="net-worth-title">
      <div className="records-section-heading">
        <div className="records-heading-with-icon">
          <Wallet size={17} className="records-lime" aria-hidden="true" />
          <h2 id="net-worth-title" className="records-eyebrow" data-testid="net-worth-label">Net worth</h2>
        </div>
        <MonthSelect testId="net-worth-month-select" />
      </div>
      <h1 className={`records-total ${amount.length > 14 ? 'records-total-long' : ''}`} data-testid="net-worth-amount">{amount}</h1>
      <div className="records-balance-breakdown">
        <span className="records-blue" data-testid="bank-float">Bank Float: {formatINR(monthSummary.liquidCash, { hideDecimals: true })}</span>
        <span className="records-balance-dot" aria-hidden="true">·</span>
        <span className="records-coral" data-testid="card-debt">Card Debt: {monthSummary.totalCreditCardDebt > 0 ? '−' : ''}{formatINR(monthSummary.totalCreditCardDebt, { hideDecimals: true })}</span>
      </div>
      <div className="records-quick-actions">
        <button type="button" className="records-action" onClick={() => onNavigate('log')} data-testid="add-transaction-button">
          <PlusCircle size={18} className="records-lime" aria-hidden="true" /><span>Add Transaction</span>
        </button>
        <button type="button" className="records-action" onClick={() => onNavigate('budgets')} data-testid="view-budgets-button">
          <PieChart size={18} className="records-blue" aria-hidden="true" /><span>View Budgets</span>
        </button>
      </div>
    </section>
  );
};