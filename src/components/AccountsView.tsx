import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  CreditCard as CreditCardIcon,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { BankAccount, CreditCard } from '../types';

export const AccountsView: React.FC = () => {
  const {
    bankLedgers,
    cardLedgers,
    selectedMonth,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    formatINR
  } = useFinance();

  const [activeLedgerTab, setActiveLedgerTab] = useState<'banks' | 'cards'>('banks');

  // Bank modal state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankOpenBal, setBankOpenBal] = useState('');
  const [bankMask, setBankMask] = useState('');

  // Card modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardOpenBal, setCardOpenBal] = useState('');
  const [cardMask, setCardMask] = useState('');
  const [cardDueDate, setCardDueDate] = useState('15');

  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankName('');
    setBankOpenBal('');
    setBankMask('•••• 1234');
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (acc: BankAccount) => {
    setEditingBank(acc);
    setBankName(acc.name);
    setBankOpenBal(acc.initialOpeningBalance.toString());
    setBankMask(acc.accountNumberMask || '');
    setIsBankModalOpen(true);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;
    const openBal = parseFloat(bankOpenBal) || 0;

    if (editingBank) {
      updateBankAccount(editingBank.id, {
        name: bankName.trim(),
        initialOpeningBalance: openBal,
        accountNumberMask: bankMask.trim()
      });
    } else {
      addBankAccount({
        name: bankName.trim(),
        initialOpeningBalance: openBal,
        accountNumberMask: bankMask.trim(),
        color: '#3872ff'
      });
    }
    setIsBankModalOpen(false);
  };

  const handleOpenAddCard = () => {
    setEditingCard(null);
    setCardName('');
    setCardLimit('');
    setCardOpenBal('0');
    setCardMask('•••• 5678');
    setCardDueDate('15');
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (c: CreditCard) => {
    setEditingCard(c);
    setCardName(c.name);
    setCardLimit(c.creditLimit.toString());
    setCardOpenBal(c.initialOpeningBalance.toString());
    setCardMask(c.cardNumberMask || '');
    setCardDueDate(c.dueDateDay ? c.dueDateDay.toString() : '15');
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    const limit = parseFloat(cardLimit) || 100000;
    const openBal = parseFloat(cardOpenBal) || 0;
    const dDay = parseInt(cardDueDate) || 15;

    if (editingCard) {
      updateCreditCard(editingCard.id, {
        name: cardName.trim(),
        creditLimit: limit,
        initialOpeningBalance: openBal,
        cardNumberMask: cardMask.trim(),
        dueDateDay: dDay
      });
    } else {
      addCreditCard({
        name: cardName.trim(),
        creditLimit: limit,
        initialOpeningBalance: openBal,
        cardNumberMask: cardMask.trim(),
        dueDateDay: dDay,
        autoPay: true,
        color: '#ffb703'
      });
    }
    setIsCardModalOpen(false);
  };

  // Aggregates
  const totalLiquidCash = bankLedgers.reduce((acc, curr) => acc + curr.balance, 0);
  const totalCardDebt = cardLedgers.reduce((acc, curr) => acc + curr.outstandingBalance, 0);
  const totalAvailableCredit = cardLedgers.reduce((acc, curr) => acc + curr.availableCredit, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Top Managed Balance Card */}
      <section className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#c3f400]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              ARSONIST HOLDINGS LEDGER RECONCILIATION
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0b0e14] text-[#c3f400] border border-[#2a334a]">
            {selectedMonth}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#0b0e14] border border-[#2a334a] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Liquid Bank Float</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-[#3872ff] block mt-1">
              {formatINR(totalLiquidCash)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{bankLedgers.length} Accounts Active</span>
          </div>

          <div className="bg-[#0b0e14] border border-[#2a334a] p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Credit Outstanding</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-[#ff4d6d] block mt-1">
              {formatINR(totalCardDebt)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Avail: {formatINR(totalAvailableCredit, { hideDecimals: true })}</span>
          </div>
        </div>
      </section>

      {/* 2. Sub-Navigation Tabs (Bank Accounts vs Credit Cards) */}
      <div className="flex bg-[#141824] border-2 border-[#2a334a] p-1 rounded-xl shadow-brutal-sm">
        <button
          onClick={() => setActiveLedgerTab('banks')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeLedgerTab === 'banks'
              ? 'bg-[#3872ff] text-white shadow-brutal-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bank Accounts ({bankLedgers.length})</span>
        </button>

        <button
          onClick={() => setActiveLedgerTab('cards')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeLedgerTab === 'cards'
              ? 'bg-[#ff4d6d] text-white shadow-brutal-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCardIcon className="w-4 h-4" />
          <span>Credit Cards ({cardLedgers.length})</span>
        </button>
      </div>

      {/* 3. Bank Accounts Ledger Module (Section 4.3, 5.4) */}
      {activeLedgerTab === 'banks' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Bank Accounts Ledger (Book.xlsx)
            </h2>
            <button
              onClick={handleOpenAddBank}
              className="px-2.5 py-1 rounded bg-[#0b0e14] border border-[#2a334a] hover:border-[#3872ff] text-xs font-bold text-white flex items-center gap-1 shadow-brutal-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#3872ff]" />
              <span>Add Bank</span>
            </button>
          </div>

          <div className="space-y-3">
            {bankLedgers.map((item) => (
              <div
                key={item.account.id}
                className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-center text-[#3872ff]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {item.account.name}
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.account.accountNumberMask || '•••• 4912'} • Primary Commercial
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditBank(item.account)}
                      className="p-1.5 rounded bg-[#0b0e14] border border-[#2a334a] text-zinc-400 hover:text-white"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {bankLedgers.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${item.account.name}?`)) {
                            deleteBankAccount(item.account.id);
                          }
                        }}
                        className="p-1.5 rounded bg-[#0b0e14] border border-[#2a334a] text-zinc-400 hover:text-[#ff4d6d]"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-Field Ledger Breakdown from Requirements Section 4.3 */}
                <div className="grid grid-cols-4 gap-1.5 bg-[#0b0e14] p-2 rounded-lg border border-[#2a334a] text-center font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block truncate">
                      Opening Bal
                    </span>
                    <span className="text-xs font-bold text-zinc-200 block mt-0.5 truncate">
                      {formatINR(item.openingBalance, { hideDecimals: true })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#c3f400] block truncate">
                      Credit (+)
                    </span>
                    <span className="text-xs font-bold text-[#c3f400] block mt-0.5 truncate">
                      +{formatINR(item.credit, { hideDecimals: true })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#ff4d6d] block truncate">
                      Debit (-)
                    </span>
                    <span className="text-xs font-bold text-[#ff4d6d] block mt-0.5 truncate">
                      -{formatINR(item.debit, { hideDecimals: true })}
                    </span>
                  </div>

                  <div className="bg-[#141824] rounded p-0.5 border border-[#2a334a]">
                    <span className="text-[9px] uppercase font-bold text-white block truncate">
                      Closing Bal
                    </span>
                    <span className="text-xs font-bold text-[#3872ff] block mt-0.5 truncate">
                      {formatINR(item.balance, { hideDecimals: true })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span>Reconciled with Book.xlsx engine</span>
                  <span className="font-mono text-zinc-300">Net Flow: {formatINR(item.credit - item.debit, { showSign: true, hideDecimals: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Credit Cards Ledger Module (Section 4.4, 5.5) */}
      {activeLedgerTab === 'cards' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Credit Cards Ledger (Book.xlsx)
            </h2>
            <button
              onClick={handleOpenAddCard}
              className="px-2.5 py-1 rounded bg-[#0b0e14] border border-[#2a334a] hover:border-[#ff4d6d] text-xs font-bold text-white flex items-center gap-1 shadow-brutal-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#ff4d6d]" />
              <span>Add Card</span>
            </button>
          </div>

          <div className="space-y-3">
            {cardLedgers.map((item) => (
              <div
                key={item.card.id}
                className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#0b0e14] border border-[#ff4d6d]/40 flex items-center justify-center text-[#ff4d6d]">
                      <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {item.card.name}
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.card.cardNumberMask || '•••• 8812'} • Due Day {item.card.dueDateDay || 15}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditCard(item.card)}
                      className="p-1.5 rounded bg-[#0b0e14] border border-[#2a334a] text-zinc-400 hover:text-white"
                      title="Edit Card Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cardLedgers.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${item.card.name}?`)) {
                            deleteCreditCard(item.card.id);
                          }
                        }}
                        className="p-1.5 rounded bg-[#0b0e14] border border-[#2a334a] text-zinc-400 hover:text-[#ff4d6d]"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 5-Field Breakdown from Requirements Section 4.4 */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-[#0b0e14] p-2 rounded-lg border border-[#2a334a] text-center font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block truncate">
                      Credit Limit
                    </span>
                    <span className="text-xs font-bold text-white block mt-0.5 truncate">
                      {formatINR(item.card.creditLimit, { hideDecimals: true })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block truncate">
                      Opening Bal
                    </span>
                    <span className="text-xs font-bold text-zinc-300 block mt-0.5 truncate">
                      {formatINR(item.openingBalance, { hideDecimals: true })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#ff4d6d] block truncate">
                      New Spend
                    </span>
                    <span className="text-xs font-bold text-[#ff4d6d] block mt-0.5 truncate">
                      +{formatINR(item.newSpendThisMonth, { hideDecimals: true })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#c3f400] block truncate">
                      Payments
                    </span>
                    <span className="text-xs font-bold text-[#c3f400] block mt-0.5 truncate">
                      -{formatINR(item.paymentsThisMonth, { hideDecimals: true })}
                    </span>
                  </div>

                  <div className="col-span-3 sm:col-span-1 bg-[#1a1215] rounded p-0.5 border border-[#ff4d6d]/40">
                    <span className="text-[9px] uppercase font-bold text-[#ff4d6d] block truncate">
                      Outstanding
                    </span>
                    <span className="text-xs font-bold text-[#ff4d6d] block mt-0.5 truncate">
                      {formatINR(item.outstandingBalance, { hideDecimals: true })}
                    </span>
                  </div>
                </div>

                {/* Available Limit Gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">Available Credit</span>
                    <span className="text-[#c3f400] font-bold font-mono">
                      {formatINR(item.availableCredit)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b0e14] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c3f400] rounded-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((item.card.creditLimit - item.outstandingBalance) /
                              item.card.creditLimit) *
                              100
                          )
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bank Account Add/Edit Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141824] border-2 border-[#3872ff] rounded-xl p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, Axis Bank"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-bold focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Account Number Mask (optional)
                </label>
                <input
                  type="text"
                  value={bankMask}
                  onChange={(e) => setBankMask(e.target.value)}
                  placeholder="e.g. •••• 9921"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={bankOpenBal}
                  onChange={(e) => setBankOpenBal(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#3872ff]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#3872ff] text-white text-xs font-bold shadow-brutal-sm hover:brightness-105"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Card Add/Edit Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141824] border-2 border-[#ff4d6d] rounded-xl p-5 shadow-brutal-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
              </h3>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Card Name
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. ICICI Amazon Pay, OneCard"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-bold focus:outline-none focus:border-[#ff4d6d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#ff4d6d]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Initial Opening Debt / Balance (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cardOpenBal}
                  onChange={(e) => setCardOpenBal(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#ff4d6d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                    Card Mask
                  </label>
                  <input
                    type="text"
                    value={cardMask}
                    onChange={(e) => setCardMask(e.target.value)}
                    placeholder="•••• 4412"
                    className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-[#ff4d6d]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                    Due Date Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={cardDueDate}
                    onChange={(e) => setCardDueDate(e.target.value)}
                    placeholder="18"
                    className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-[#ff4d6d]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#ff4d6d] text-white text-xs font-bold shadow-brutal-sm hover:brightness-105"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
