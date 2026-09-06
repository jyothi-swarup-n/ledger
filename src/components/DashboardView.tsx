import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  CreditCard as CreditCardIcon,
  Building2,
  ArrowRight,
  Receipt,
  Trash2,
  CheckCircle2,
  Briefcase,
  User as UserIcon,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { Transaction } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectTransaction }) => {
  const {
    monthSummary,
    bankLedgers,
    cardLedgers,
    transactions,
    categories,
    selectedMonth,
    formatINR
  } = useFinance();

  const [timeframe, setTimeframe] = useState<'7D' | '30D'>('30D');
  const [streamFilter, setStreamFilter] = useState<'all' | 'income' | 'work' | 'personal'>('all');
  const [selectedPointInfo, setSelectedPointInfo] = useState<{
    dateLabel: string;
    inflow: number;
    outflow: number;
    x: number;
  } | null>(null);

  // Recent transactions for current selected month
  const currentMonthTx = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return currentMonthTx.filter((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (streamFilter === 'income') return cat?.name === 'Income' || tx.categoryId === 'cat_income' || tx.direction === 'Credit';
      if (streamFilter === 'work') return tx.type === 'Work' && cat?.name !== 'Income' && !cat?.isTransfer;
      if (streamFilter === 'personal') return tx.type === 'Personal' && cat?.name !== 'Income' && !cat?.isTransfer;
      return true;
    });
  }, [currentMonthTx, categories, streamFilter]);

  // =========================================================================
  // DYNAMIC CHART DATA ENGINE (Reflecting 100% Real Data)
  // =========================================================================
  const chartData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();

    if (timeframe === '7D') {
      // Show latest 7 days (e.g. days 1 to 7 or last 7 active days)
      const points = [];
      const numDays = Math.min(7, daysInMonth);
      for (let d = 1; d <= numDays; d++) {
        const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        let inflow = 0;
        let outflow = 0;
        currentMonthTx.forEach((tx) => {
          if (tx.date === dateStr) {
            const cat = categories.find((c) => c.id === tx.categoryId);
            if (!cat?.isTransfer) {
              if (tx.direction === 'Credit') inflow += tx.amount;
              if (tx.direction === 'Debit') outflow += tx.amount;
            }
          }
        });
        points.push({
          label: `Day ${d}`,
          dateStr,
          inflow,
          outflow
        });
      }
      return points;
    } else {
      // 30D: Divide into 6 chronological 5-day intervals across the month
      const intervals = [
        { label: 'D 1-5', start: 1, end: 5 },
        { label: 'D 6-10', start: 6, end: 10 },
        { label: 'D 11-15', start: 11, end: 15 },
        { label: 'D 16-20', start: 16, end: 20 },
        { label: 'D 21-25', start: 21, end: 25 },
        { label: 'D 26-30', start: 26, end: Math.min(31, daysInMonth) }
      ];

      return intervals.map((inv) => {
        let inflow = 0;
        let outflow = 0;
        currentMonthTx.forEach((tx) => {
          const dayNum = parseInt(tx.date.split('-')[2]);
          if (dayNum >= inv.start && dayNum <= inv.end) {
            const cat = categories.find((c) => c.id === tx.categoryId);
            if (!cat?.isTransfer) {
              if (tx.direction === 'Credit') inflow += tx.amount;
              if (tx.direction === 'Debit') outflow += tx.amount;
            }
          }
        });
        return {
          label: inv.label,
          dateStr: `${inv.label} (${selectedMonth})`,
          inflow,
          outflow
        };
      });
    }
  }, [timeframe, currentMonthTx, selectedMonth, categories]);

  // Compute SVG coordinates based on maximum value
  const { inflowPath, outflowPath, inflowArea, outflowArea, chartPoints } = useMemo(() => {
    const width = 340;
    const height = 110;
    const padding = 15;

    const maxVal = Math.max(
      10000,
      ...chartData.map((d) => Math.max(d.inflow, d.outflow))
    );

    const step = chartData.length > 1 ? (width - padding * 2) / (chartData.length - 1) : 0;

    const points = chartData.map((d, i) => {
      const x = padding + i * step;
      // Inflow y
      const inflowY = height - (d.inflow / maxVal) * (height - 30) - 10;
      // Outflow y
      const outflowY = height - (d.outflow / maxVal) * (height - 30) - 10;
      return {
        ...d,
        x,
        inflowY,
        outflowY
      };
    });

    // Construct smooth or line path
    let inflowP = '';
    let outflowP = '';
    points.forEach((p, idx) => {
      if (idx === 0) {
        inflowP += `M ${p.x} ${p.inflowY}`;
        outflowP += `M ${p.x} ${p.outflowY}`;
      } else {
        const prev = points[idx - 1];
        const cx1 = prev.x + (p.x - prev.x) / 2;
        const cx2 = prev.x + (p.x - prev.x) / 2;
        inflowP += ` C ${cx1} ${prev.inflowY}, ${cx2} ${p.inflowY}, ${p.x} ${p.inflowY}`;
        outflowP += ` C ${cx1} ${prev.outflowY}, ${cx2} ${p.outflowY}, ${p.x} ${p.outflowY}`;
      }
    });

    const inflowA = `${inflowP} L ${points[points.length - 1]?.x || width} ${height} L ${points[0]?.x || 0} ${height} Z`;
    const outflowA = `${outflowP} L ${points[points.length - 1]?.x || width} ${height} L ${points[0]?.x || 0} ${height} Z`;

    return {
      inflowPath: inflowP,
      outflowPath: outflowP,
      inflowArea: inflowA,
      outflowArea: outflowA,
      chartPoints: points
    };
  }, [chartData]);

  // Calculate monthly burn percentage
  const totalMonthlyBudget = monthSummary.workBudgetTotal + monthSummary.personalBudgetTotal;
  const totalSpent = monthSummary.workBudgetUsed + monthSummary.personalBudgetUsed;
  const burnPercentage = totalMonthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / totalMonthlyBudget) * 100)) : 0;
  const remainingBudget = Math.max(0, totalMonthlyBudget - totalSpent);

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Hero Net Worth Statement Card */}
      <section className="w-full bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg relative overflow-hidden">
        {/* Geometric watermark */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#c3f400]/5 pointer-events-none flex items-center justify-center">
          <Building2 className="w-24 h-24 text-[#c3f400]/10" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#c3f400]" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-300 font-bold">
              TOTAL MANAGED ASSETS & NET WORTH
            </span>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#0b0e14] border border-[#c3f400]/40 text-[#c3f400] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-brutal-sm">
            <TrendingUp className="w-3 h-3" />
            <span>{selectedMonth}</span>
          </div>
        </div>

        <div className="mt-2 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-none font-mono">
            {formatINR(monthSummary.totalNetWorth)}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="font-bold text-[#3872ff]">
              Bank Float: {formatINR(monthSummary.liquidCash, { hideDecimals: true })}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="text-[#ff4d6d] font-bold">
              Card Debt: -{formatINR(monthSummary.totalCreditCardDebt, { hideDecimals: true })}
            </span>
          </div>
        </div>

        {/* Action Bar (Simplified, without quick split, vault, or export) */}
        <div className="mt-4 pt-3 border-t border-[#2a334a] flex items-center justify-between gap-2">
          <button
            onClick={() => onNavigateTab('log')}
            className="flex-1 bg-[#0b0e14] hover:bg-[#1f2638] border border-[#2a334a] hover:border-[#c3f400] text-white py-2 px-2 rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-[#c3f400]" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Add Transaction
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('budgets')}
            className="flex-1 bg-[#0b0e14] hover:bg-[#1f2638] border border-[#2a334a] hover:border-[#3872ff] text-white py-2 px-2 rounded-lg shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
          >
            <PieChart className="w-4 h-4 text-[#3872ff]" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              View Budgets
            </span>
          </button>
        </div>
      </section>

      {/* 2. Cash Flow Engine (Velocity Dynamics & SVG Wave, 7D vs 30D) */}
      <section className="w-full bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              CASH FLOW ENGINE
            </span>
            <span className="text-base font-bold text-white tracking-tight">
              Velocity Dynamics ({timeframe})
            </span>
          </div>
          {/* Timeframe selector: strictly 7D and 30D */}
          <div className="flex items-center gap-1 bg-[#0b0e14] p-0.5 rounded-lg border border-[#2a334a]">
            {(['7D', '30D'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  setSelectedPointInfo(null);
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  timeframe === t
                    ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Income vs Outflow Metric Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0b0e14] border border-[#2a334a] p-2.5 rounded-lg flex items-center justify-between shadow-brutal-sm">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Inflow</span>
              <span className="text-base sm:text-lg font-bold text-[#3872ff] font-mono truncate">
                {formatINR(monthSummary.totalInflow, { hideDecimals: true })}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#3872ff]/20 border border-[#3872ff]/40 flex items-center justify-center text-[#3872ff] shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-[#2a334a] p-2.5 rounded-lg flex items-center justify-between shadow-brutal-sm">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Outflow</span>
              <span className="text-base sm:text-lg font-bold text-[#ff4d6d] font-mono truncate">
                {formatINR(monthSummary.totalOutflow, { hideDecimals: true })}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#ff4d6d]/20 border border-[#ff4d6d]/40 flex items-center justify-center text-[#ff4d6d] shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Real Data Interactive SVG Chart Wave */}
        <div className="relative w-full pt-2 pb-1">
          {selectedPointInfo && (
            <div
              className="absolute -top-3 z-20 bg-[#0b0e14] border-2 border-[#c3f400] text-white px-2.5 py-1 rounded-lg shadow-brutal text-[10px] font-bold flex flex-col transition-all duration-150 transform -translate-x-1/2"
              style={{ left: `${Math.max(45, Math.min(290, selectedPointInfo.x))}px` }}
            >
              <span className="text-zinc-400 font-mono">{selectedPointInfo.dateLabel}</span>
              <div className="flex gap-2">
                <span className="text-[#3872ff]">+{formatINR(selectedPointInfo.inflow, { hideDecimals: true })}</span>
                <span className="text-[#ff4d6d]">-{formatINR(selectedPointInfo.outflow, { hideDecimals: true })}</span>
              </div>
            </div>
          )}

          <svg className="w-full h-32 overflow-visible" fill="none" viewBox="0 0 340 120">
            <defs>
              <linearGradient id="dashInflowGrad" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3872ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3872ff" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="dashOutflowGrad" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ff4d6d" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid tracks */}
            <line x1="0" y1="20" x2="340" y2="20" stroke="#2a334a" strokeDasharray="3 3" opacity="0.5" />
            <line x1="0" y1="60" x2="340" y2="60" stroke="#2a334a" strokeDasharray="3 3" opacity="0.5" />
            <line x1="0" y1="100" x2="340" y2="100" stroke="#2a334a" strokeDasharray="3 3" opacity="0.5" />

            {/* Inflow Wave (Blue) */}
            {inflowArea && <path d={inflowArea} fill="url(#dashInflowGrad)" />}
            {inflowPath && (
              <path
                d={inflowPath}
                stroke="#3872ff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/* Outflow Wave (Red/Coral) */}
            {outflowArea && <path d={outflowArea} fill="url(#dashOutflowGrad)" />}
            {outflowPath && (
              <path
                d={outflowPath}
                stroke="#ff4d6d"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Data Nodes */}
            {chartPoints.map((pt, idx) => (
              <g
                key={idx}
                className="cursor-pointer group"
                onClick={() =>
                  setSelectedPointInfo({
                    dateLabel: pt.label,
                    inflow: pt.inflow,
                    outflow: pt.outflow,
                    x: pt.x
                  })
                }
              >
                <circle cx={pt.x} cy={pt.inflowY} r="4" fill="#3872ff" stroke="#0b0e14" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.outflowY} r="4" fill="#ff4d6d" stroke="#0b0e14" strokeWidth="2" />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-zinc-400 text-[10px] pt-1 border-t border-[#2a334a]/60">
          <span className="font-mono">{chartData[0]?.label || 'Start'}</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#3872ff]" /> Inflow
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-[#ff4d6d]" /> Outflow
            </span>
          </div>
          <span className="font-mono">{chartData[chartData.length - 1]?.label || 'End'}</span>
        </div>
      </section>

      {/* 3. Allocated Liquidity & Accounts Shelf (Without Vault) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCardIcon className="w-4 h-4 text-[#c3f400]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Allocated Accounts & Ledgers
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('accounts')}
            className="text-[11px] font-bold text-[#c3f400] uppercase tracking-wider hover:underline flex items-center gap-0.5"
          >
            <span>Manage ({bankLedgers.length + cardLedgers.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Swipe Deck (Only real Bank Accounts & Credit Cards) */}
        <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
          {/* Bank Accounts */}
          {bankLedgers.map((item) => (
            <div
              key={item.account.id}
              onClick={() => onNavigateTab('accounts')}
              className="min-w-[190px] sm:min-w-[210px] bg-[#141824] border-2 border-[#2a334a] p-3 rounded-xl shadow-brutal flex flex-col justify-between space-y-2 cursor-pointer hover:border-[#c3f400] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-[#1f2638] flex items-center justify-center text-[#3872ff]">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0b0e14] text-zinc-300 border border-[#2a334a]">
                  BANK
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block truncate">
                  {item.account.name} ({item.account.accountNumberMask || '••••'})
                </span>
                <span className="text-base font-bold text-white block mt-0.5 font-mono">
                  {formatINR(item.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#2a334a] text-[10px]">
                <span className="text-[#c3f400] font-bold">Active Float</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          ))}

          {/* Credit Cards */}
          {cardLedgers.map((item) => (
            <div
              key={item.card.id}
              onClick={() => onNavigateTab('accounts')}
              className="min-w-[200px] sm:min-w-[220px] bg-[#1a1215] border-2 border-[#ff4d6d]/40 p-3 rounded-xl shadow-brutal flex flex-col justify-between space-y-2 cursor-pointer hover:border-[#ff4d6d] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-[#33141c] flex items-center justify-center text-[#ff4d6d]">
                  <CreditCardIcon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0b0e14] text-[#ff4d6d] border border-[#ff4d6d]/30">
                  CARD
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block truncate">
                  {item.card.name} ({item.card.cardNumberMask || '••••'})
                </span>
                <span className="text-base font-bold text-[#ff4d6d] block mt-0.5 font-mono">
                  {formatINR(item.outstandingBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#2a334a] text-[10px]">
                <span className="text-zinc-400">Avail: <strong className="text-white font-mono">{formatINR(item.availableCredit, { hideDecimals: true })}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Burn Rate Engine vs Envelope Ceiling */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Current Spend vs Monthly Envelope
          </span>
          <span className="text-xs font-mono font-bold text-[#c3f400]">
            {burnPercentage}% Utilized
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-[#0b0e14] rounded-full overflow-hidden border border-[#2a334a]">
          <div
            className={`h-full transition-all duration-300 ${
              burnPercentage > 90 ? 'bg-[#ff4d6d]' : 'bg-[#c3f400]'
            }`}
            style={{ width: `${burnPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
          <span>Spent: <strong className="text-white">{formatINR(totalSpent, { hideDecimals: true })}</strong></span>
          <span>Remaining: <strong className="text-[#c3f400]">{formatINR(remainingBudget, { hideDecimals: true })}</strong></span>
        </div>
      </section>

      {/* 5. Recent Activity Stream (Strictly +/- signs as requested) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Stream ({filteredTransactions.length})
          </h2>
          <button
            onClick={() => onNavigateTab('log')}
            className="text-[11px] font-bold text-[#c3f400] uppercase tracking-wider hover:underline"
          >
            + New Entry
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(['all', 'income', 'work', 'personal'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setStreamFilter(mode)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                streamFilter === mode
                  ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                  : 'bg-[#0b0e14] border border-[#2a334a] text-zinc-400 hover:text-white'
              }`}
            >
              {mode === 'work' ? 'Work' : mode}
            </button>
          ))}
        </div>

        {/* Transaction Items */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center bg-[#0b0e14] border border-[#2a334a] rounded-lg">
              <span className="text-xs text-zinc-500 font-mono">
                No transactions recorded for this filter in {selectedMonth}
              </span>
            </div>
          ) : (
            filteredTransactions.slice(0, 10).map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              // Inflow rule: Income category or direction is Credit
              const isCreditOrIncome = tx.direction === 'Credit' || cat?.name === 'Income' || tx.categoryId === 'cat_income';
              const isTransfer = cat?.isTransfer;

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#c3f400] flex items-center justify-between transition-all cursor-pointer group shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isCreditOrIncome
                          ? 'bg-[#142b1e] border-[#c3f400] text-[#c3f400]'
                          : isTransfer
                          ? 'bg-[#1f2638] border-[#3872ff] text-[#3872ff]'
                          : tx.type === 'Work'
                          ? 'bg-[#181d33] border-[#3872ff] text-[#3872ff]'
                          : 'bg-[#291419] border-[#ff4d6d] text-[#ff4d6d]'
                      }`}
                    >
                      {isCreditOrIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isTransfer ? (
                        <CreditCardIcon className="w-4 h-4" />
                      ) : tx.type === 'Work' ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#c3f400] transition-colors">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                            tx.type === 'Work'
                              ? 'bg-[#1f2638] text-[#3872ff]'
                              : 'bg-[#291419] text-[#ff4d6d]'
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="text-zinc-400 truncate">{cat?.name || 'Expense'}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 whitespace-nowrap">{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Strictly enforce + for Inflows/Credits, and - for Debits/Expenses */}
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        isCreditOrIncome ? 'text-[#c3f400]' : 'text-[#ff4d6d]'
                      }`}
                    >
                      {isCreditOrIncome ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {isCreditOrIncome ? 'Credit / Income' : `${tx.type} Debit`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
