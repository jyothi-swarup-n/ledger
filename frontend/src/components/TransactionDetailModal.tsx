import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, FinanceType, TransactionDirection } from '../types';
import { Trash2, Edit2, Calendar, FileText, Tag, CreditCard, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose
}) => {
  const {
    categories,
    bankAccounts,
    creditCards,
    updateTransaction,
    deleteTransaction,
    formatINR
  } = useFinance();

  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [date, setDate] = useState(transaction?.date || '');
  const [type, setType] = useState<FinanceType>(transaction?.type || 'Work');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [accountOrCardId, setAccountOrCardId] = useState(transaction?.accountOrCardId || '');
  const [direction, setDirection] = useState<TransactionDirection>(transaction?.direction || 'Debit');

  if (!transaction) return null;

  const currentCategory = categories.find((c) => c.id === transaction.categoryId);
  const currentAccount =
    bankAccounts.find((b) => b.id === transaction.accountOrCardId)?.name ||
    creditCards.find((c) => c.id === transaction.accountOrCardId)?.name ||
    transaction.accountOrCardId;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    updateTransaction(transaction.id, {
      description: description.trim(),
      amount: numAmt,
      date,
      type,
      categoryId,
      accountOrCardId,
      direction
    });

    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this transaction? All dependent account balances and budgets will be recalculated.')) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141824] border-2 border-[#2a334a] rounded-2xl shadow-brutal-lg overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2a334a] pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                transaction.direction === 'Credit'
                  ? 'bg-[#142b1e] text-[#c3f400]'
                  : 'bg-[#291419] text-[#ff4d6d]'
              }`}
            >
              {transaction.direction === 'Credit' ? (
                <ArrowDownLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {isEditing ? 'Edit Transaction' : 'Transaction Details'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-3 text-xs">
            <div className="text-center py-2 bg-[#0b0e14] border border-[#2a334a] rounded-xl">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Amount</span>
              <span
                className={`text-2xl font-bold font-mono ${
                  transaction.direction === 'Credit' ? 'text-[#c3f400]' : 'text-white'
                }`}
              >
                {formatINR(transaction.amount, { showSign: true })}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {transaction.direction} • {transaction.type}
              </span>
            </div>

            <div className="bg-[#0b0e14] border border-[#2a334a] p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Description:</span>
                <span className="font-bold text-white text-right">{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Category:</span>
                <span className="text-zinc-200">{currentCategory?.name || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Account / Card:</span>
                <span className="text-zinc-200">{currentAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Accounting Date:</span>
                <span className="font-mono text-zinc-200">{transaction.date}</span>
              </div>
              {transaction.notes && (
                <div className="flex justify-between pt-1 border-t border-[#2a334a]">
                  <span className="text-zinc-400">Notes:</span>
                  <span className="text-zinc-300 italic">{transaction.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#ff4d6d]/40 text-[#ff4d6d] hover:bg-[#ff4d6d]/10 text-xs font-bold flex items-center justify-center gap-1.5 shadow-brutal-sm"
                title="Delete Transaction"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-brutal-sm hover:brightness-105"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transaction</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#2a334a] rounded py-1.5 px-2.5 text-white font-bold focus:outline-none focus:border-[#c3f400]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded py-1.5 px-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#c3f400]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded py-1.5 px-2.5 text-white font-mono focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TransactionDirection)}
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded py-1.5 px-2 text-white focus:outline-none"
                >
                  <option value="Debit">Debit (Expense)</option>
                  <option value="Credit">Credit (Income)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FinanceType)}
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded py-1.5 px-2 text-white focus:outline-none"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded bg-[#0b0e14] border border-[#2a334a] text-zinc-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded bg-[#c3f400] text-[#0b0e14] font-bold shadow-brutal-sm"
              >
                Save Updates
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
