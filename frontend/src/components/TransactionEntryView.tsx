import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  PlusCircle,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  FileText,
  CheckCircle2,
  Briefcase,
  User as UserIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { FinanceType, TransactionDirection } from '../types';

interface TransactionEntryViewProps {
  onTransactionSaved?: () => void;
}

export const TransactionEntryView: React.FC<TransactionEntryViewProps> = ({ onTransactionSaved }) => {
  const {
    categories,
    bankAccounts,
    creditCards,
    addTransaction,
    selectedMonth,
    formatINR,
    profileAliases
  } = useFinance();

  // Form State
  const [date, setDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-05`;
  });

  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('Debit');
  const [type, setType] = useState<FinanceType>('Work');
  const [categoryId, setCategoryId] = useState<string>(() => categories.find((category) => category.type === 'Work' || category.type === 'Both')?.id || '');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  
  // Destination mode: Account vs Card toggle
  const [destMode, setDestMode] = useState<'Account' | 'Card'>('Account');
  const [accountOrCardId, setAccountOrCardId] = useState<string>(bankAccounts[0]?.id || '');
  
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [successBanner, setSuccessBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize accountOrCardId when switching between Account and Card modes
  useEffect(() => {
    if (destMode === 'Account') {
      if (!bankAccounts.some((b) => b.id === accountOrCardId)) {
        setAccountOrCardId(bankAccounts[0]?.id || '');
      }
    } else {
      if (!creditCards.some((c) => c.id === accountOrCardId)) {
        setAccountOrCardId(creditCards[0]?.id || '');
      }
    }
  }, [destMode, bankAccounts, creditCards, accountOrCardId]);

  // Filter categories by selected Type: Work, Personal, or Both
  const filteredCategories = useMemo(() => categories.filter(
    (c) => c.type === type || c.type === 'Both'
  ), [categories, type]);

  // When Type changes, make sure categoryId is valid
  useEffect(() => {
    setCategoryId((previous) => filteredCategories.some((c) => c.id === previous) ? previous : filteredCategories[0]?.id || '');
  }, [filteredCategories]);

  // When Category changes, auto-select first subcategory or clear
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubcategories = useMemo(() => selectedCategoryObj?.subcategories || [], [selectedCategoryObj]);

  useEffect(() => {
    if (availableSubcategories.length > 0) {
      setSubcategoryId(availableSubcategories[0].id);
    } else {
      setSubcategoryId('');
    }
  }, [categoryId, availableSubcategories]);

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (successBanner) return;
    setError(null);
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description for the transaction.');
      return;
    }
    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setError('Select a category before saving.');
      return;
    }
    const instruments = destMode === 'Account' ? bankAccounts : creditCards;
    if (!instruments.some((instrument) => instrument.id === accountOrCardId)) {
      setError(`Add a ${destMode === 'Account' ? 'bank account' : 'credit card'} in Accounts before saving.`);
      return;
    }

    addTransaction({
      date,
      description: description.trim(),
      type,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      accountOrCardId,
      direction,
      amount: numAmount,
      notes: notes.trim() || undefined
    });

    // Success feedback
    setSuccessBanner(true);
    setTimeout(() => {
      setSuccessBanner(false);
      setDescription('');
      setAmount('');
      setNotes('');
      onTransactionSaved?.();
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto" data-testid="transaction-entry-view">
      {/* Success Notification */}
      {successBanner && (
        <div role="status" data-testid="transaction-save-confirmation" className="bg-[#142b1e] border-2 border-[#c3f400] text-white p-4 rounded-xl shadow-brutal-lg flex items-center justify-between animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-[#c3f400]" />
            <div>
              <span className="text-xs font-bold text-white block">TRANSACTION COMMITTED</span>
              <span className="text-[11px] text-zinc-300">
                All dependent views, ledgers & budgets updated instantaneously.
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#c3f400]">⚡ RECALCULATED</span>
        </div>
      )}

      {/* Main Single Form Card */}
      <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 sm:p-5 shadow-brutal-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#2a334a] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-center text-[#c3f400]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">
                Log New Transaction
              </h1>
              <span className="text-[10px] text-zinc-400">
                Single entry automatically updates accounts, ledgers & budgets
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="transaction-entry-form">
          {error && <p role="alert" data-testid="transaction-entry-error" className="text-sm text-[#ff7b72]">{error}</p>}
          {/* 1. Debit / Credit Button (Top priority as requested) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
              Transaction Flow (Debit / Credit)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-1 rounded-xl border-2 border-[#2a334a]">
              <button
                type="button"
                onClick={() => setDirection('Debit')}
                data-testid="transaction-direction-debit"
                aria-pressed={direction === 'Debit'}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === 'Debit'
                    ? 'bg-[#ff4d6d] text-white shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Debit (Expense)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('Credit')}
                data-testid="transaction-direction-credit"
                aria-pressed={direction === 'Credit'}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === 'Credit'
                    ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Credit (Income)</span>
              </button>
            </div>
          </div>

          {/* 2. Work / Personal Button (Under Debit/Credit as requested) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
              Profile Scope (Work / Personal)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-1 rounded-xl border-2 border-[#2a334a]">
              <button
                type="button"
                onClick={() => setType('Work')}
                data-testid="transaction-scope-work"
                aria-pressed={type === 'Work'}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Work'
                    ? 'bg-[#3872ff] text-white shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{profileAliases['Work'] || 'Work'}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Personal')}
                data-testid="transaction-scope-personal"
                aria-pressed={type === 'Personal'}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Personal'
                    ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>{profileAliases['Personal'] || 'Personal'}</span>
              </button>
            </div>
          </div>

          {/* 3. Amount Input & Display */}
          <div className="bg-[#0b0e14] border-2 border-[#2a334a] rounded-xl p-3.5 text-center shadow-inner">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
              TRANSACTION AMOUNT (INR)
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-2xl font-bold text-[#c3f400] font-mono">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                data-testid="transaction-amount-input"
                aria-label="Transaction amount in INR"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-center bg-transparent text-3xl sm:text-4xl font-bold font-mono text-white focus:outline-none placeholder-zinc-700"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-[#2a334a]/60">
              {[500, 1000, 5000, 25000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickAddAmount(chip)}
                  data-testid={`transaction-quick-amount-${chip}`}
                  className="px-2 py-0.5 rounded bg-[#141824] border border-[#2a334a] text-[10px] font-mono font-bold text-zinc-300 hover:text-[#c3f400] hover:border-[#c3f400]"
                >
                  +{chip.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#c3f400]" />
                <span>Description (Required)</span>
              </label>
              <input
                type="text"
                required
                value={description}
                data-testid="transaction-description-input"
                aria-label="Transaction description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. AWS Production Bill, Nature Basket, Salary"
                className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#c3f400]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#c3f400]" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                data-testid="transaction-date-input"
                aria-label="Transaction date"
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#c3f400]"
              />
            </div>
          </div>

          {/* 5. Category & Subcategory Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#c3f400]" />
                <span>Category ({type})</span>
              </label>
              <select
                value={categoryId}
                data-testid="transaction-category-select"
                aria-label="Transaction category"
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#c3f400]"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id} data-testid={`transaction-category-option-${c.id}`}>
                    {c.name} {c.isTransfer ? '(Transfer)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {availableSubcategories.length > 0 ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">
                  Subcategory
                </label>
                <select
                  value={subcategoryId}
                  data-testid="transaction-subcategory-select"
                  aria-label="Transaction subcategory"
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#c3f400]"
                >
                  <option value="" data-testid="transaction-subcategory-option-none">-- General / None --</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id} data-testid={`transaction-subcategory-option-${sub.id}`}>
                      {sub.name} (Budget: {formatINR(sub.individualBudget, { hideDecimals: true })})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1 opacity-50">
                <label className="text-[10px] font-bold uppercase text-zinc-500">
                  Subcategory
                </label>
                <div data-testid="transaction-subcategories-empty" className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 px-3 text-xs text-zinc-500 italic">
                  No subcategories for this category
                </div>
              </div>
            )}
          </div>

          {/* 6. Button for Account / Card & Filtered Dropdown (Under subcategory as requested) */}
          <div className="space-y-2 pt-1 border-t border-[#2a334a]/60">
            <label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center justify-between">
              <span>Payment Instrument Selection</span>
              <span className="text-[#c3f400]">Filtered instrument</span>
            </label>

            {/* Button toggle: Account vs Card */}
            <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-1 rounded-xl border border-[#2a334a]">
              <button
                type="button"
                onClick={() => setDestMode('Account')}
                data-testid="transaction-instrument-bank"
                aria-pressed={destMode === 'Account'}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  destMode === 'Account'
                    ? 'bg-[#1f2638] text-[#c3f400] border border-[#c3f400] shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Account Only</span>
              </button>

              <button
                type="button"
                onClick={() => setDestMode('Card')}
                data-testid="transaction-instrument-card"
                aria-pressed={destMode === 'Card'}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  destMode === 'Card'
                    ? 'bg-[#1f2638] text-[#ff4d6d] border border-[#ff4d6d] shadow-brutal-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit Card Only</span>
              </button>
            </div>

            {/* Dropdown showing ONLY accounts or ONLY cards */}
            <div className="space-y-1">
              <select
                value={accountOrCardId}
                data-testid="transaction-instrument-select"
                aria-label="Payment account or card"
                onChange={(e) => setAccountOrCardId(e.target.value)}
                className="w-full bg-[#0b0e14] border-2 border-[#2a334a] focus:border-[#c3f400] rounded-lg py-2.5 px-3 text-xs font-bold text-white focus:outline-none shadow-brutal-sm"
              >
                {destMode === 'Account' ? (
                  bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id} data-testid={`transaction-bank-option-${acc.id}`}>
                      🏦 {acc.name} ({acc.accountNumberMask || 'Bank'})
                    </option>
                  ))
                ) : (
                  creditCards.map((card) => (
                    <option key={card.id} value={card.id} data-testid={`transaction-card-option-${card.id}`}>
                      💳 {card.name} ({card.cardNumberMask || 'Card'} • Limit: {formatINR(card.creditLimit, { hideDecimals: true })})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 7. Optional Notes (Split & Receipt removed as requested) */}
          <div className="space-y-1 pt-1">
            <input
              type="text"
              value={notes}
              data-testid="transaction-notes-input"
              aria-label="Transaction notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes, invoice memo or tax reference..."
              className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-[#c3f400]"
            />
          </div>

          {/* 8. Save Primary Action Button */}
          <button
            type="submit"
            data-testid="transaction-submit-button"
            disabled={successBanner}
            className="w-full py-3.5 rounded-xl bg-[#c3f400] hover:bg-[#b2e000] text-[#0b0e14] font-bold text-sm tracking-wider uppercase shadow-brutal-lg active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            <span>COMMIT TRANSACTION TO BOOK</span>
          </button>
        </form>
      </div>

      {/* Transfer Guidance */}
      <div className="p-3 bg-[#0b0e14] border border-[#2a334a] rounded-xl text-xs text-zinc-400 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[#c3f400] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-200 block">Transfer Between Accounts:</span>
          <span>
            To record a credit card settlement, select <strong>Debit</strong> from your Bank Account with category <em>"Credit Card Payment"</em>, and a <strong>Credit</strong> to your Credit Card.
          </span>
        </div>
      </div>
    </div>
  );
};
