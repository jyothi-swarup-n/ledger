import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  WalletCards,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit2,
  Calendar,
  Briefcase,
  User as UserIcon,
  Flame,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { CategoryBudgetStatus, Subcategory } from '../types';

export const BudgetView: React.FC = () => {
  const {
    selectedMonth,
    workCategoryBudgets,
    personalCategoryBudgets,
    monthSummary,
    updateBudgetTarget,
    addSubcategory,
    categories,
    formatINR
  } = useFinance();

  const [activeScope, setActiveScope] = useState<'Work' | 'Personal'>('Work');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cat_software: true,
    cat_salaries: true,
    cat_subscriptions: true,
    cat_groceries: true
  });

  // Edit budget modal state
  const [editingItem, setEditingItem] = useState<{
    categoryId: string;
    subcategoryId?: string;
    name: string;
    currentAmount: number;
  } | null>(null);
  const [newBudgetVal, setNewBudgetVal] = useState('');

  // Add new subcategory modal state
  const [isAddingSub, setIsAddingSub] = useState<string | null>(null);
  const [subName, setSubName] = useState('');
  const [subBudget, setSubBudget] = useState('');
  const [subDueDate, setSubDueDate] = useState('');

  const currentBudgets = activeScope === 'Work' ? workCategoryBudgets : personalCategoryBudgets;
  const totalBudget = activeScope === 'Work' ? monthSummary.workBudgetTotal : monthSummary.personalBudgetTotal;
  const totalUsed = activeScope === 'Work' ? monthSummary.workBudgetUsed : monthSummary.personalBudgetUsed;
  const totalRemaining = totalBudget - totalUsed;
  const percentElapsed = totalBudget > 0 ? Math.min(100, Math.round((totalUsed / totalBudget) * 100)) : 0;

  // Days left in current month calculation
  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
  const currentDay = 5; // Sep 5, 2026 reference
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const safeDailyPace = totalRemaining > 0 ? Math.round(totalRemaining / daysRemaining) : 0;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const amt = parseFloat(newBudgetVal);
    if (!isNaN(amt) && amt >= 0) {
      updateBudgetTarget(editingItem.categoryId, editingItem.subcategoryId, amt);
    }
    setEditingItem(null);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddingSub || !subName.trim()) return;
    const bAmt = parseFloat(subBudget) || 0;
    const dueD = parseInt(subDueDate) || undefined;
    addSubcategory(isAddingSub, {
      name: subName.trim(),
      individualBudget: bAmt,
      recurringDueDate: dueD
    });
    setIsAddingSub(null);
    setSubName('');
    setSubBudget('');
    setSubDueDate('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Scope Switcher (Arsonist Holdings Work Budget vs Personal Budget) */}
      <div className="flex bg-[#141824] border-2 border-[#2a334a] p-1 rounded-xl shadow-brutal-sm">
        <button
          onClick={() => setActiveScope('Work')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeScope === 'Work'
              ? 'bg-[#3872ff] text-white shadow-brutal-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Work (Arsonist Holdings)</span>
        </button>

        <button
          onClick={() => setActiveScope('Personal')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeScope === 'Personal'
              ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Personal Budget</span>
        </button>
      </div>

      {/* 2. Burn Rate Engine Hero Card */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${activeScope === 'Work' ? 'text-[#3872ff]' : 'text-[#c3f400]'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              BURN RATE ENGINE • {activeScope.toUpperCase()}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0b0e14] text-zinc-300 border border-[#2a334a]">
            Day {currentDay} of {daysInMonth}
          </span>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-bold text-white tracking-tight">
                {formatINR(totalUsed)}
              </span>
              <span className="text-sm text-zinc-400">/ {formatINR(totalBudget)}</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                percentElapsed > 100
                  ? 'bg-[#ff4d6d]/20 text-[#ff4d6d] border border-[#ff4d6d]'
                  : percentElapsed > 75
                  ? 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]'
                  : 'bg-[#c3f400]/20 text-[#c3f400] border border-[#c3f400]'
              }`}
            >
              {percentElapsed}% Elapsed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#0b0e14] border border-[#2a334a] rounded-full overflow-hidden mt-2 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentElapsed > 100
                  ? 'bg-[#ff4d6d]'
                  : percentElapsed > 75
                  ? 'bg-[#ffb703]'
                  : activeScope === 'Work'
                  ? 'bg-[#3872ff]'
                  : 'bg-[#c3f400]'
              }`}
              style={{ width: `${Math.min(100, percentElapsed)}%` }}
            />
          </div>
        </div>

        {/* Pacing statistics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2a334a] text-xs">
          <div className="bg-[#0b0e14] border border-[#2a334a] p-2 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Remaining Float</span>
            <span className={`text-base font-bold font-mono ${totalRemaining < 0 ? 'text-[#ff4d6d]' : 'text-[#c3f400]'}`}>
              {formatINR(totalRemaining)}
            </span>
          </div>

          <div className="bg-[#0b0e14] border border-[#2a334a] p-2 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Safe Daily Velocity</span>
            <span className="text-base font-bold font-mono text-white">
              {formatINR(safeDailyPace, { hideDecimals: true })} <span className="text-xs text-zinc-400 font-normal">/ day</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. Budget Envelopes & Subcategories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WalletCards className="w-4 h-4 text-[#c3f400]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Categorized Envelopes ({currentBudgets.length})
            </h2>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Automatic Carry-forward Active
          </span>
        </div>

        <div className="space-y-2.5">
          {currentBudgets.map((item) => {
            const isExpanded = !!expandedCategories[item.category.id];
            const hasSubs = (item.category.subcategories || []).length > 0;
            const isOver = item.remaining < 0;
            const isNear = item.percentage > 85 && !isOver;

            return (
              <div
                key={item.category.id}
                className="bg-[#141824] border-2 border-[#2a334a] rounded-xl overflow-hidden shadow-brutal transition-all"
              >
                {/* Category Header Row */}
                <div className="p-3.5 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          activeScope === 'Work' ? 'bg-[#181d33] text-[#3872ff]' : 'bg-[#14221a] text-[#c3f400]'
                        }`}
                      >
                        ⚡
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white block truncate">
                          {item.category.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {item.subcategoriesStatus.length} Subcategories
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          {formatINR(item.paidUsed)}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          of {formatINR(item.budget)}
                        </span>
                      </div>

                      {hasSubs && (
                        <button
                          onClick={() => toggleCategory(item.category.id)}
                          className="w-7 h-7 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-center text-zinc-300 hover:text-white"
                          title={isExpanded ? 'Collapse Subcategories' : 'Expand Subcategories'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Envelope Progress Bar */}
                  <div className="w-full h-2 bg-[#0b0e14] border border-[#2a334a] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-[#ff4d6d]'
                          : isNear
                          ? 'bg-[#ffb703]'
                          : activeScope === 'Work'
                          ? 'bg-[#3872ff]'
                          : 'bg-[#c3f400]'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>

                  {/* Envelope Footer Info */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold font-mono ${
                        isOver ? 'text-[#ff4d6d]' : 'text-[#c3f400]'
                      }`}
                    >
                      {isOver ? `Over by ${formatINR(Math.abs(item.remaining))}` : `${formatINR(item.remaining)} remaining`}
                    </span>

                    <button
                      onClick={() =>
                        setEditingItem({
                          categoryId: item.category.id,
                          name: item.category.name,
                          currentAmount: item.budget
                        })
                      }
                      className="text-[10px] uppercase font-bold text-zinc-400 hover:text-[#c3f400] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Adjust Limit</span>
                    </button>
                  </div>
                </div>

                {/* Subcategories Expandable Breakdown */}
                {hasSubs && isExpanded && (
                  <div className="bg-[#0b0e14] border-t border-[#2a334a] p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 border-b border-[#2a334a]/60 pb-1">
                      <span>Subcategory Item</span>
                      <span>Paid / Target</span>
                    </div>

                    {item.subcategoriesStatus.map((sub) => {
                      const subOver = sub.remaining < 0;
                      return (
                        <div
                          key={sub.subcategory.id}
                          className="py-1.5 flex items-center justify-between text-xs border-b border-[#2a334a]/30 last:border-0 hover:bg-[#141824]/40 px-1 rounded transition-colors"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-zinc-200 truncate">
                              {sub.subcategory.name}
                            </span>
                            {sub.subcategory.recurringDueDate && (
                              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#c3f400]" />
                                <span>Recurring on Day {sub.subcategory.recurringDueDate}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <div className="text-right">
                              <span className="font-bold text-white block">
                                {formatINR(sub.paidUsed)}
                              </span>
                              <span className="text-[10px] text-zinc-400 block">
                                / {formatINR(sub.budget)}
                              </span>
                            </div>

                            <button
                              onClick={() =>
                                setEditingItem({
                                  categoryId: item.category.id,
                                  subcategoryId: sub.subcategory.id,
                                  name: sub.subcategory.name,
                                  currentAmount: sub.budget
                                })
                              }
                              className="p-1 rounded bg-[#1f2638] text-zinc-400 hover:text-[#c3f400]"
                              title="Edit Subcategory Budget"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => setIsAddingSub(item.category.id)}
                      className="w-full py-1.5 mt-1 border border-dashed border-[#2a334a] hover:border-[#c3f400] text-zinc-400 hover:text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#c3f400]" />
                      <span>Add Subcategory to {item.category.name}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. TOTAL ROW (Matching Excel Book.xlsx TOTAL Row) */}
        <div className="w-full bg-[#0b0e14] border-2 border-[#c3f400] p-4 rounded-xl shadow-brutal-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c3f400]">
              TOTAL {activeScope.toUpperCase()} BUDGET (BOOK.XLSX)
            </span>
            <span className="text-xs text-zinc-400">Sum of all envelopes</span>
          </div>

          <div className="text-right font-mono">
            <span className="text-lg sm:text-xl font-bold text-white block">
              {formatINR(totalUsed)}
            </span>
            <span className="text-xs text-[#c3f400] block font-bold">
              Ceiling: {formatINR(totalBudget)}
            </span>
          </div>
        </div>
      </section>

      {/* Adjust Budget Target Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141824] border-2 border-[#c3f400] rounded-xl p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Adjust Budget Limit
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Set monthly budget ceiling for <strong className="text-[#c3f400]">{editingItem.name}</strong> for accounting month {selectedMonth}:
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Budget Target Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    defaultValue={editingItem.currentAmount}
                    onChange={(e) => setNewBudgetVal(e.target.value)}
                    placeholder="e.g. 25000"
                    autoFocus
                    className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 pl-8 pr-3 text-white font-mono font-bold focus:outline-none focus:border-[#c3f400]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold shadow-brutal-sm hover:brightness-105"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {isAddingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141824] border-2 border-[#3872ff] rounded-xl p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Add Subcategory
              </h3>
              <button
                onClick={() => setIsAddingSub(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Supabase DB / Canva Pro"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-bold focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Monthly Budget Target (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={subBudget}
                  onChange={(e) => setSubBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Recurring Due Day (1-31, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={subDueDate}
                  onChange={(e) => setSubDueDate(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSub(null)}
                  className="flex-1 py-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#3872ff] text-white text-xs font-bold shadow-brutal-sm hover:brightness-105"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
