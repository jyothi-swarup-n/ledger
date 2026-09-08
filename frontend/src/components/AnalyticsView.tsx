import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  TrendingUp,
  AlertOctagon,
  PieChart,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Lock,
  Zap,
  ArrowDownLeft
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const {
    monthSummary,
    transactions,
    categories,
    selectedMonth,
    formatINR,
    profileAliases
  } = useFinance();

  const [guardrailLocked, setGuardrailLocked] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 1. Current Month Transactions
  const currentMonthTx = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 2. Compute exact Category spend distribution for current month
  const { sortedCategories, totalDebitSpend } = useMemo(() => {
    const categorySpendMap = new Map<string, { name: string; amount: number; type: string }>();

    currentMonthTx.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      // Only debits that are not transfers or income
      if (tx.direction === 'Debit' && !cat?.isTransfer && cat?.name !== 'Income') {
        const catName = cat?.name || 'Uncategorized';
        const existing = categorySpendMap.get(catName) || { name: catName, amount: 0, type: tx.type };
        categorySpendMap.set(catName, {
          name: catName,
          amount: existing.amount + tx.amount,
          type: tx.type
        });
      }
    });

    const totalDebitSpend = Array.from(categorySpendMap.values()).reduce((sum, c) => sum + c.amount, 0);
    const sorted = Array.from(categorySpendMap.values())
      .map((c) => ({
        ...c,
        percentage: totalDebitSpend > 0 ? Math.round((c.amount / totalDebitSpend) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { sortedCategories: sorted, totalDebitSpend };
  }, [currentMonthTx, categories]);

  // 3. Mathematical Days & Pacing
  const { daysInMonth, currentDayNumber, dailyBurnRate, projectedMonthEndOutflow, projectedSavings } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const totalDays = new Date(year, month, 0).getDate();

    // Determine current day from latest transaction date in this month or today
    let maxDay = 1;
    currentMonthTx.forEach((tx) => {
      const d = parseInt(tx.date.split('-')[2]);
      if (d > maxDay) maxDay = d;
    });

    const dayNum = Math.min(totalDays, Math.max(1, maxDay));
    const dailyRate = dayNum > 0 ? totalDebitSpend / dayNum : 0;
    const projectedOutflow = dailyRate * totalDays;
    const projectedSavings = monthSummary.totalInflow - projectedOutflow;

    return {
      daysInMonth: totalDays,
      currentDayNumber: dayNum,
      dailyBurnRate: dailyRate,
      projectedMonthEndOutflow: projectedOutflow,
      projectedSavings
    };
  }, [selectedMonth, currentMonthTx, totalDebitSpend, monthSummary.totalInflow]);

  // 4. Subscriptions & Recurring Debits (Detected from transactions with repeating software/services keywords)
  const recurringSubscriptions = useMemo(() => {
    const keywords = ['aws', 'figma', 'github', 'openai', 'netflix', 'spotify', 'reclaim', 'icloud', 'domain', 'internet', 'broadband', 'zoom', 'adobe'];
    const subs: { name: string; amount: number; type: string; date: string }[] = [];

    currentMonthTx.forEach((tx) => {
      if (tx.direction === 'Debit') {
        const descLower = tx.description.toLowerCase();
        const matches = keywords.some((kw) => descLower.includes(kw));
        if (matches) {
          subs.push({
            name: tx.description,
            amount: tx.amount,
            type: tx.type,
            date: tx.date
          });
        }
      }
    });

    return subs;
  }, [currentMonthTx]);

  const totalSubsCost = recurringSubscriptions.reduce((acc, curr) => acc + curr.amount, 0);

  // 5. Compute SVG Donut Segment Offsets
  const circumference = 2 * Math.PI * 38; // ~238.76
  const donutSegments = useMemo(() => {
    let accumulated = 0;
    const colors = ['#3872ff', '#c3f400', '#ff4d6d', '#ffb703', '#9d4edd', '#06d6a0'];

    return sortedCategories.map((cat, idx) => {
      const strokeDash = (cat.percentage / 100) * circumference;
      const strokeOffset = -accumulated;
      accumulated += strokeDash;
      return {
        ...cat,
        color: colors[idx % colors.length],
        strokeDash: `${strokeDash} ${circumference}`,
        strokeOffset
      };
    });
  }, [sortedCategories, circumference]);

  const totalMonthlyBudget = monthSummary.workBudgetTotal + monthSummary.personalBudgetTotal;
  const budgetUtilization = totalMonthlyBudget > 0 ? Math.min(100, Math.round((totalDebitSpend / totalMonthlyBudget) * 100)) : 0;
  const netOperatingMargin = monthSummary.totalInflow > 0
    ? Math.round(((monthSummary.totalInflow - monthSummary.totalOutflow) / monthSummary.totalInflow) * 100)
    : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto bg-[#141824] border-2 border-[#c3f400] text-white p-3 rounded-xl shadow-brutal-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#c3f400]" />
            <span className="text-xs font-bold text-white">{toastMsg}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#c3f400]">OK</span>
        </div>
      )}

      {/* 1. Header (No export button as requested) */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#c3f400]" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              AUDIT & INTELLIGENCE
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0b0e14] text-[#c3f400] border border-[#2a334a] font-mono">
            {selectedMonth} LEDGER
          </span>
        </div>
        <h1 className="text-base font-bold text-white tracking-tight">
          Financial Diagnostics & Performance
        </h1>
        <p className="text-xs text-zinc-400">
          Real-time metrics calculated dynamically from all logged {selectedMonth} transactions.
        </p>
      </section>

      {/* 2. Real Pacing Engine: Velocity vs Monthly Envelope */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              PACING ENGINE
            </span>
            <span className="text-sm font-bold text-white">
              Burn Velocity (Day {currentDayNumber} of {daysInMonth})
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              budgetUtilization <= 100
                ? 'bg-[#142b1e] text-[#c3f400] border-[#c3f400]/40'
                : 'bg-[#291419] text-[#ff4d6d] border-[#ff4d6d]/40'
            }`}
          >
            {budgetUtilization}% Budget Used
          </span>
        </div>

        {/* Pacing Visualizer */}
        <div className="bg-[#0b0e14] p-3 rounded-xl border border-[#2a334a] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Total Spent to Date:</span>
            <span className="font-mono text-white font-bold">
              {formatINR(totalDebitSpend)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Average Daily Burn:</span>
            <span className="font-mono text-[#ff4d6d] font-bold">
              {formatINR(dailyBurnRate, { hideDecimals: true })} / day
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Monthly Envelope Budget:</span>
            <span className="font-mono text-[#3872ff] font-bold">
              {formatINR(totalMonthlyBudget, { hideDecimals: true })}
            </span>
          </div>

          {/* Progress Bar of Month Elapsed vs Spend Elapsed */}
          <div className="pt-2 border-t border-[#2a334a]/60 space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>Spend Progress vs Month Progress</span>
              <span className="text-[#c3f400]">
                Day {currentDayNumber} ({Math.round((currentDayNumber / daysInMonth) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#141824] rounded-full overflow-hidden border border-[#2a334a]">
              <div
                className="h-full bg-[#c3f400] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((currentDayNumber / daysInMonth) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Distribution (Dynamic SVG Donut Chart from Real Data) */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-[#3872ff]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Category Distribution ({selectedMonth})
            </h2>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {sortedCategories.length} Categories
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="p-6 text-center bg-[#0b0e14] border border-[#2a334a] rounded-lg">
            <span className="text-xs text-zinc-500 font-mono">No expense debits recorded in {selectedMonth}</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#1f2638" strokeWidth="12" fill="none" />
                {donutSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={seg.strokeDash}
                    strokeDashoffset={seg.strokeOffset}
                    fill="none"
                  />
                ))}
              </svg>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400 leading-none">
                  Top Outflow
                </span>
                <span className="text-sm font-bold text-white font-mono mt-1">
                  {sortedCategories[0]?.percentage || 0}%
                </span>
                <span className="text-[9px] text-[#3872ff] font-bold truncate max-w-[80px]">
                  {sortedCategories[0]?.name || ''}
                </span>
              </div>
            </div>

            {/* Category Badges Breakdown */}
            <div className="w-full space-y-1.5 text-xs">
              {donutSegments.slice(0, 5).map((cat) => (
                <div
                  key={cat.name}
                  className="p-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-zinc-200 truncate text-[11px]">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-white font-bold text-xs">{formatINR(cat.amount, { hideDecimals: true })}</span>
                    <span className="text-[10px] text-zinc-400 font-bold">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. Subscriptions & Recurring Stack Detection */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-[#ffb703]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Recurring & Software Services
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f2638] text-[#ffb703] font-bold font-mono">
            {recurringSubscriptions.length} Active Services
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
          <div className="bg-[#0b0e14] border border-[#2a334a] p-2.5 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block font-sans">Total Services Stack</span>
            <span className="text-sm font-bold text-white block mt-0.5 font-mono">{formatINR(totalSubsCost)}</span>
          </div>
          <div className="bg-[#0b0e14] border border-[#2a334a] p-2.5 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block font-sans">Share of Total Outflow</span>
            <span className="text-sm font-bold text-[#3872ff] block mt-0.5 font-mono">
              {totalDebitSpend > 0 ? Math.round((totalSubsCost / totalDebitSpend) * 100) : 0}%
            </span>
          </div>
        </div>

        {recurringSubscriptions.length > 0 && (
          <div className="space-y-1.5">
            {recurringSubscriptions.map((sub, i) => (
              <div key={i} className="p-2 bg-[#0b0e14] border border-[#2a334a] rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-zinc-200 truncate">{sub.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#1f2638] text-zinc-400">{sub.type}</span>
                </div>
                <span className="font-mono font-bold text-[#ff4d6d]">-{formatINR(sub.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. True Monthly Inflow vs Outflow Net Summary */}
      <section className="bg-gradient-to-b from-[#141824] to-[#0d121c] border-2 border-[#c3f400] rounded-xl p-4 shadow-brutal-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#c3f400]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Ledger Operating Margin & Forecast
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c3f400] text-[#0b0e14] font-mono">
            {netOperatingMargin}% Margin
          </span>
        </div>

        <div className="bg-[#0b0e14]/90 border border-[#2a334a] p-3 rounded-lg space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">Total Month Inflow:</span>
            <span className="text-sm font-bold text-[#3872ff] font-mono">
              +{formatINR(monthSummary.totalInflow)}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">Total Month Outflow:</span>
            <span className="text-sm font-bold text-[#ff4d6d] font-mono">
              -{formatINR(monthSummary.totalOutflow)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#2a334a] flex items-baseline justify-between">
            <span className="text-xs text-zinc-300 font-bold">Net Balance (Savings):</span>
            <span
              className={`text-base font-bold font-mono ${
                monthSummary.totalInflow - monthSummary.totalOutflow >= 0 ? 'text-[#c3f400]' : 'text-[#ff4d6d]'
              }`}
            >
              {monthSummary.totalInflow - monthSummary.totalOutflow >= 0 ? '+' : ''}
              {formatINR(monthSummary.totalInflow - monthSummary.totalOutflow)}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setGuardrailLocked(!guardrailLocked);
            showToast(guardrailLocked ? 'Spending guardrail unlocked' : 'Spending guardrail locked: alert notifications enabled');
          }}
          className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-brutal-sm transition-all ${
            guardrailLocked
              ? 'bg-[#ff4d6d] text-white border border-white'
              : 'bg-[#c3f400] text-[#0b0e14] hover:bg-[#b2e000]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{guardrailLocked ? 'GUARDRAIL LOCK ACTIVE (ALERTS ON)' : 'ACTIVATE SPENDING GUARDRAIL LOCK'}</span>
        </button>
      </section>
    </div>
  );
};
