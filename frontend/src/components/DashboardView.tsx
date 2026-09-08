import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { NetWorth } from './dashboard/NetWorth';
import { CashFlow } from './dashboard/CashFlow';
import { Liquidity } from './dashboard/Liquidity';
import { RecentStream } from './dashboard/RecentStream';
import { Transaction } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectTransaction }) => {
  const { monthSummary, formatINR } = useFinance();
  const budget = monthSummary.workBudgetTotal + monthSummary.personalBudgetTotal;
  const spent = monthSummary.workBudgetUsed + monthSummary.personalBudgetUsed;
  const percentage = budget > 0 ? Math.round(spent / budget * 100) : 0;
  return (
    <div className="records-dashboard" data-testid="dashboard-view">
      <NetWorth onNavigate={onNavigateTab} />
      <CashFlow />
      <Liquidity onNavigate={onNavigateTab} />
      <section className="records-burn" data-testid="monthly-spend-section" aria-label="Monthly spend">
        <div className="records-section-heading">
          <span className="records-eyebrow" data-testid="monthly-spend-label">Monthly spend</span>
          <span className={percentage > 90 ? 'records-coral' : 'records-lime'} data-testid="budget-utilization">{percentage}% utilized</span>
        </div>
        <div className="records-progress" role="progressbar" aria-label="Monthly budget used" aria-valuemin={0}
          aria-valuemax={100} aria-valuenow={Math.min(100, percentage)} aria-valuetext={`${percentage}% utilized`} data-testid="monthly-spend-progress">
          <div style={{ width: `${Math.min(100, percentage)}%` }} className={percentage > 90 ? 'is-over-budget' : ''} />
        </div>
        <div className="records-spend-totals">
          <span data-testid="budget-spent">Spent <strong>{formatINR(spent, { hideDecimals: true })}</strong></span>
          <span data-testid="budget-remaining">Remaining <strong className="records-lime">{formatINR(Math.max(0, budget - spent), { hideDecimals: true })}</strong></span>
        </div>
      </section>
      <RecentStream onNavigate={onNavigateTab} onSelectTransaction={onSelectTransaction} />
    </div>
  );
};