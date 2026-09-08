import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { STARTER_CATEGORIES } from '../data/seedData';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRightLeft,
  Landmark,
  Sparkles,
  CheckCircle2,
  Building2,
  CreditCard as CreditCardIcon,
  Plus,
  Trash2,
  Lightbulb,
  Check,
  Home,
  ShoppingCart,
  UtensilsCrossed,
  Plane,
  Code,
  Briefcase,
  ShoppingBag,
  Clapperboard,
  Wallet,
  Layers,
} from 'lucide-react';

type Step = 'welcome' | 'accounts' | 'add-bank' | 'add-card' | 'budgets';

const LIME = '#c3f400';
const STARTER_IDS = new Set(STARTER_CATEGORIES.map((c) => c.id));
const BANK_PRESETS = ['HDFC', 'ICICI', 'AXIS', 'SBI', 'OTHER'];

const inr = (n: number | string) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

const ICONS: Record<string, React.ComponentType<any>> = {
  home: Home,
  shopping_cart: ShoppingCart,
  restaurant: UtensilsCrossed,
  flight: Plane,
  code: Code,
  briefcase: Briefcase,
  account_balance: Landmark,
  shopping_bag: ShoppingBag,
  movie: Clapperboard,
  payments: Wallet,
};

const inputBase =
  'w-full bg-[#0b0e14] border-2 border-[#2a334a] rounded-xl py-3.5 px-4 text-[15px] text-white placeholder-[#4b5568] focus:outline-none focus:border-[#c3f400] transition-colors';

const primaryBtn =
  'w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50';

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const {
    currentUser,
    bankAccounts,
    creditCards,
    categories,
    addBankAccount,
    addCreditCard,
    addCategory,
    addSubcategory,
    updateSubcategory,
    updateBudgetTarget,
    deleteCategory,
    logoutUser,
  } = useFinance();

  const [step, setStep] = useState<Step>('welcome');

  // Always start each step from the top, never mid-scroll
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  // Bank form state
  const [bankName, setBankName] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [bankType, setBankType] = useState<'CURRENT' | 'SAVINGS'>('CURRENT');

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardOutstanding, setCardOutstanding] = useState('');

  // Budget state
  const expenseCats = categories.filter((c) => c.id !== 'cat_income' && !c.isTransfer);
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    STARTER_CATEGORIES.filter((c) => c.id !== 'cat_income' && !c.isTransfer).forEach((c) => {
      const sum = (c.subcategories || []).reduce((a, s) => a + (s.individualBudget || 0), 0);
      m[c.id] = sum ? String(sum) : '';
    });
    return m;
  });
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const displayName = currentUser?.name?.split(' ')[0] || 'Operator';

  const openBankForm = () => {
    setBankName('');
    setBankBalance('');
    setBankType('CURRENT');
    setStep('add-bank');
  };
  const openCardForm = () => {
    setCardName('');
    setCardLimit('');
    setCardOutstanding('');
    setStep('add-card');
  };

  const saveBank = () => {
    if (!bankName.trim()) return;
    addBankAccount({ name: bankName.trim(), initialOpeningBalance: Number(bankBalance) || 0 });
    setStep('accounts');
  };
  const saveCard = () => {
    if (!cardName.trim()) return;
    addCreditCard({
      name: cardName.trim(),
      creditLimit: Number(cardLimit) || 0,
      initialOpeningBalance: Number(cardOutstanding) || 0,
    });
    setStep('accounts');
  };

  const totalCeiling = Object.values(limits).reduce<number>((a, v) => a + (Number(v) || 0), 0);

  const commitAddSub = (catId: string) => {
    if (subDraft.trim()) addSubcategory(catId, { name: subDraft.trim(), individualBudget: 0 });
    setSubDraft('');
    setAddingSubFor(null);
  };
  const commitCustomCategory = () => {
    if (customDraft.trim()) addCategory({ name: customDraft.trim(), type: 'Personal', icon: 'payments', subcategories: [] });
    setCustomDraft('');
    setAddingCustom(false);
  };

  const finishOnboarding = () => {
    expenseCats.forEach((cat) => {
      const amount = Number(limits[cat.id]) || 0;
      if (amount <= 0) return;
      const subs = cat.subcategories || [];
      if (subs.length === 0) {
        updateBudgetTarget(cat.id, undefined, amount);
      } else {
        const per = Math.floor(amount / subs.length);
        const remainder = amount - per * subs.length;
        subs.forEach((s, i) => updateSubcategory(s.id, { individualBudget: per + (i === 0 ? remainder : 0) }));
      }
    });
    onComplete();
  };

  // ================================================================
  // Shared header
  // ================================================================
  const TopBar: React.FC<{ onBack: () => void; label?: string }> = ({ onBack, label = 'Records // Arsonist' }) => (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a334a] sticky top-0 bg-[#0b0e14] z-10">
      <button
        type="button"
        onClick={onBack}
        data-testid="onboarding-back-btn"
        className="w-11 h-11 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-white shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#c3f400] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-[#0b0e14]" fill="#0b0e14" />
        </div>
        <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-white">{label}</p>
      </div>
    </div>
  );

  // ================================================================
  // STEP: WELCOME (activated)
  // ================================================================
  if (step === 'welcome') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="onboarding-welcome">
        <TopBar onBack={logoutUser} />
        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
          {/* Telemetry chart card */}
          <div className="relative p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a] overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: LIME }} />
            <span className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[#c3f400] text-[11px] font-bold uppercase tracking-[0.08em] text-[#c3f400]">
              <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified &amp; Encrypted
            </span>
            <div className="relative flex items-center justify-between mt-4">
              <span className="text-[12px] font-mono uppercase tracking-widest text-[#3865ff]">Node Online // Latency 2ms</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#c3f400] px-2 py-1 rounded-md border border-[#c3f400]/40">99.99% Sync</span>
            </div>
            <svg viewBox="0 0 300 80" className="w-full h-20 mt-3" preserveAspectRatio="none">
              <polyline points="0,60 40,50 80,58 120,38 160,44 200,26 240,34 300,14" fill="none" stroke="#3865ff" strokeWidth="2.5" />
              <polyline points="0,64 40,44 80,52 120,30 160,40 200,20 240,30 300,8" fill="none" stroke={LIME} strokeWidth="2.5" />
              <circle cx="300" cy="8" r="4" fill={LIME} />
            </svg>
          </div>

          {/* Authenticated message */}
          <div className="p-6 rounded-2xl bg-[#141824] border-2 border-[#2a334a] space-y-4">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#c3f400]">
              <span className="w-8 h-8 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#c3f400]" fill={LIME} />
              </span>
              Ledger Authenticated
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">
              {displayName}, your private <span className="uppercase">Records</span> are activated.
            </h1>
            <p className="text-[14px] text-[#8b93a7] leading-relaxed">
              Next, let&apos;s configure your liquidity engine and automated budget guardrails to maintain peak capital velocity.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">
                <Zap className="w-3.5 h-3.5" /> High Velocity
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] text-[12px] font-bold uppercase tracking-wide text-[#3865ff]">
                <Lock className="w-3.5 h-3.5" /> Zero-Knowledge
              </span>
            </div>
          </div>

          {/* Directives */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#8b93a7]">System Directives</span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#c3f400]">3/3 Ready</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: ArrowRightLeft, label: 'Zero-Lag Cash Flow Tracking' },
                { icon: Landmark, label: 'Track Banks, Cards & More' },
                { icon: Sparkles, label: 'AI-Powered Leak Analytics' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-3 p-4 rounded-xl bg-[#141824] border-2 border-[#2a334a]">
                  <span className="w-11 h-11 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] flex items-center justify-center text-[#3865ff]">
                    <d.icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-[15px] font-bold text-white">{d.label}</span>
                  <CheckCircle2 className="w-6 h-6 text-[#c3f400]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#2a334a] bg-[#0b0e14]">
          <button type="button" onClick={() => setStep('accounts')} data-testid="onboarding-setup-accounts-btn" className={primaryBtn}>
            Set Up Accounts &amp; Cards
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // STEP: ACCOUNTS HUB
  // ================================================================
  if (step === 'accounts') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="onboarding-accounts-hub">
        <TopBar onBack={() => setStep('welcome')} />
        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
          <h1 className="text-4xl font-black text-white tracking-tight">Add Banks &amp; Credit Cards</h1>

          {/* Bank card */}
          <button
            type="button"
            onClick={openBankForm}
            data-testid="hub-add-bank-card"
            className="w-full text-left p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a] shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <div className="flex items-start justify-between">
              <span className="w-14 h-14 rounded-xl bg-[#0b0e14] border-2 border-[#2a334a] flex items-center justify-center text-[#c3f400]">
                <Landmark className="w-7 h-7" />
              </span>
              <span className="px-3 py-1.5 rounded-lg border-2 border-[#c3f400] text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">
                + Checking / Savings
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-4">Add Bank Account</h2>
            <p className="text-[14px] text-[#8b93a7] mt-1">Checking, Savings &amp; Treasury vaults</p>
            <div className="border-t border-[#2a334a] my-4" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">
                <span className="w-2 h-2 rounded-full bg-[#c3f400]" /> Instant ACH &amp; Wire Sync
              </span>
              <ArrowRight className="w-5 h-5 text-[#c3f400]" />
            </div>
          </button>

          {/* Credit card */}
          <button
            type="button"
            onClick={openCardForm}
            data-testid="hub-add-card-card"
            className="w-full text-left p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a] shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <div className="flex items-start justify-between">
              <span className="w-14 h-14 rounded-xl bg-[#0b0e14] border-2 border-[#2a334a] flex items-center justify-center text-[#3865ff]">
                <CreditCardIcon className="w-7 h-7" />
              </span>
              <span className="px-3 py-1.5 rounded-lg border-2 border-[#2a334a] text-[12px] font-bold uppercase tracking-wide text-[#8b93a7]">
                + Credit Card
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-4">Add Credit Card</h2>
            <p className="text-[14px] text-[#8b93a7] mt-1">Credit lines, limits, and billing cycles</p>
            <div className="border-t border-[#2a334a] my-4" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#8b93a7]">
                <span className="w-2 h-2 rounded-full bg-[#3865ff]" /> APR, Statement &amp; Due Date Sync
              </span>
              <ArrowRight className="w-5 h-5 text-[#3865ff]" />
            </div>
          </button>

          {/* Added list */}
          {(bankAccounts.length > 0 || creditCards.length > 0) && (
            <div className="space-y-2" data-testid="hub-linked-list">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#8b93a7]">
                Linked ({bankAccounts.length + creditCards.length})
              </p>
              {bankAccounts.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#141824] border-2 border-[#2a334a]">
                  <Landmark className="w-5 h-5 text-[#c3f400]" />
                  <span className="flex-1 text-[14px] font-bold text-white">{b.name}</span>
                  <span className="text-[13px] font-mono text-[#8b93a7]">{inr(b.initialOpeningBalance)}</span>
                </div>
              ))}
              {creditCards.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#141824] border-2 border-[#2a334a]">
                  <CreditCardIcon className="w-5 h-5 text-[#3865ff]" />
                  <span className="flex-1 text-[14px] font-bold text-white">{c.name}</span>
                  <span className="text-[13px] font-mono text-[#8b93a7]">{inr(c.creditLimit)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Read-only enclave note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#141824] border-2 border-[#2a334a]">
            <ShieldCheck className="w-5 h-5 text-[#c3f400] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">Read-Only Enclave</p>
              <p className="text-[13px] text-[#8b93a7] mt-1">
                Records by Arsonist never stores banking passwords. Credentials stay strictly encrypted.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#2a334a] bg-[#0b0e14] space-y-3">
          <button type="button" onClick={openBankForm} data-testid="hub-add-accounts-btn" className={primaryBtn}>
            <Zap className="w-4 h-4" fill="#0b0e14" /> Add Accounts
          </button>
          <button
            type="button"
            onClick={() => setStep('budgets')}
            data-testid="hub-setup-budgets-btn"
            className="w-full py-4 rounded-xl bg-[#141824] border-2 border-[#c3f400] text-[#c3f400] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            Set Up Budgets
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // STEP: ADD BANK ACCOUNT
  // ================================================================
  if (step === 'add-bank') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="onboarding-add-bank">
        <TopBar onBack={() => setStep('accounts')} />
        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Add Bank Account</h1>
            <p className="text-[14px] text-[#8b93a7] mt-2">
              Declare a liquid checking, reserve savings, or capital silo to track net worth telemetry in real time.
            </p>
          </div>

          {/* Balance */}
          <div className="p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#8b93a7]">
                <Wallet className="w-4 h-4 text-[#c3f400]" /> Available Balance Right Now
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-md bg-[#0b0e14] border-2 border-[#2a334a]">
                INR / Real-Time
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-4xl font-black text-[#c3f400]">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                placeholder="0"
                data-testid="bank-balance-input"
                className="flex-1 bg-transparent text-4xl font-black text-white outline-none placeholder-[#33405c] w-full"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[13px] text-[#8b93a7]">Shh… We won&apos;t tell anyone :)</span>
              <button type="button" onClick={() => setBankBalance('0')} className="text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">
                Zero Out
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold uppercase tracking-wide text-white">
                Name of the Bank <span className="text-[#c3f400]">*</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#647087]">Required</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC Bank"
                data-testid="bank-name-input"
                className={`${inputBase} pr-12`}
              />
              <Building2 className="w-5 h-5 text-[#8b93a7] absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Fast select */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#8b93a7] mb-2">Fast Select</p>
            <div className="flex flex-wrap gap-2">
              {BANK_PRESETS.map((p) => {
                const selected = p !== 'OTHER' && bankName === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBankName(p === 'OTHER' ? '' : p)}
                    data-testid={`bank-preset-${p}`}
                    className={`px-4 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide border-2 transition-colors ${
                      selected
                        ? 'bg-[#c3f400] text-[#0b0e14] border-[#c3f400]'
                        : 'bg-[#141824] text-white border-[#2a334a]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classification */}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-white mb-2">
              Account Classification <span className="text-[#c3f400]">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['CURRENT', 'SAVINGS'] as const).map((t) => {
                const active = bankType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBankType(t)}
                    data-testid={`bank-type-${t}`}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      active ? 'bg-[#141824] border-[#c3f400]' : 'bg-[#141824] border-[#2a334a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCardIcon className={`w-6 h-6 ${active ? 'text-[#c3f400]' : 'text-[#8b93a7]'}`} />
                      {active && <span className="w-3.5 h-3.5 rounded-sm bg-[#c3f400]" />}
                    </div>
                    <p className="text-[11px] uppercase tracking-widest text-[#647087] mt-4">Account</p>
                    <p className="text-lg font-black text-white">{t}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#2a334a] bg-[#0b0e14]">
          <button type="button" onClick={saveBank} disabled={!bankName.trim()} data-testid="save-bank-btn" className={primaryBtn}>
            <Check className="w-5 h-5" strokeWidth={2.5} /> Save Bank Account
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // STEP: ADD CREDIT CARD
  // ================================================================
  if (step === 'add-card') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="onboarding-add-card">
        <TopBar onBack={() => setStep('accounts')} />
        <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Add Credit Card</h1>
            <p className="text-[14px] text-[#8b93a7] mt-2">
              Declare a credit line to track outstanding debt, limits, and billing cycles in your ledger.
            </p>
          </div>

          {/* Outstanding */}
          <div className="p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#8b93a7]">
                <CreditCardIcon className="w-4 h-4 text-[#3865ff]" /> Current Outstanding
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-md bg-[#0b0e14] border-2 border-[#2a334a]">
                INR / Real-Time
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-4xl font-black text-[#3865ff]">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={cardOutstanding}
                onChange={(e) => setCardOutstanding(e.target.value)}
                placeholder="0"
                data-testid="card-outstanding-input"
                className="flex-1 bg-transparent text-4xl font-black text-white outline-none placeholder-[#33405c] w-full"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[13px] text-[#8b93a7]">Owed on this card right now</span>
              <button type="button" onClick={() => setCardOutstanding('0')} className="text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">
                Zero Out
              </button>
            </div>
          </div>

          {/* Credit limit */}
          <div>
            <span className="text-[13px] font-bold uppercase tracking-wide text-white block mb-2">Credit Limit</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c3f400] font-black text-lg">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={cardLimit}
                onChange={(e) => setCardLimit(e.target.value)}
                placeholder="0"
                data-testid="card-limit-input"
                className={`${inputBase} pl-9`}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold uppercase tracking-wide text-white">
                Name of the Card <span className="text-[#c3f400]">*</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#647087]">Required</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="HDFC Regalia"
                data-testid="card-name-input"
                className={`${inputBase} pr-12`}
              />
              <CreditCardIcon className="w-5 h-5 text-[#8b93a7] absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Fast select */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-[#8b93a7] mb-2">Fast Select</p>
            <div className="flex flex-wrap gap-2">
              {BANK_PRESETS.map((p) => {
                const selected = p !== 'OTHER' && cardName === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCardName(p === 'OTHER' ? '' : p)}
                    data-testid={`card-preset-${p}`}
                    className={`px-4 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wide border-2 transition-colors ${
                      selected
                        ? 'bg-[#c3f400] text-[#0b0e14] border-[#c3f400]'
                        : 'bg-[#141824] text-white border-[#2a334a]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#2a334a] bg-[#0b0e14]">
          <button type="button" onClick={saveCard} disabled={!cardName.trim()} data-testid="save-card-btn" className={primaryBtn}>
            <Check className="w-5 h-5" strokeWidth={2.5} /> Save Credit Card
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // STEP: BUDGETS
  // ================================================================
  const pools = expenseCats
    .map((c) => ({ id: c.id, name: c.name, amount: Number(limits[c.id]) || 0 }))
    .filter((p) => p.amount > 0);
  const poolColors = [LIME, '#3865ff', '#c05cff', '#ff8f3c', '#38bdf8'];

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="onboarding-budgets">
      <TopBar onBack={() => setStep('accounts')} />
      <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
        <h1 className="text-4xl font-black text-white tracking-tight">Set Up Budgets &amp; Limits</h1>

        {/* Pro tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#141824] border-2 border-dashed border-[#2a334a]">
          <span className="w-10 h-10 rounded-lg bg-[#0b0e14] border-2 border-[#c3f400] flex items-center justify-center text-[#c3f400] shrink-0">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#c3f400]">Pro Operational Tip</p>
            <p className="text-[13px] text-[#8b93a7] mt-1">
              You can also add subcategories in each category for granular spend tracking and automated ledger sorting.
            </p>
          </div>
        </div>

        {/* Category cards */}
        {expenseCats.map((cat) => {
          const Icon = ICONS[cat.icon || ''] || Layers;
          const subs = cat.subcategories || [];
          const isCustom = !STARTER_IDS.has(cat.id);
          return (
            <div key={cat.id} className="p-4 rounded-2xl bg-[#141824] border-2 border-[#2a334a]" data-testid={`budget-cat-${cat.id}`}>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#0b0e14] border-2 border-[#2a334a] flex items-center justify-center text-[#c3f400] shrink-0">
                  <Icon className="w-6 h-6" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white leading-tight truncate">{cat.name}</h3>
                  <p className="text-[11px] uppercase tracking-widest text-[#647087]">{cat.type} Spend</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[#c3f400] font-black">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={limits[cat.id] || ''}
                    onChange={(e) => setLimits((p) => ({ ...p, [cat.id]: e.target.value }))}
                    placeholder="0"
                    data-testid={`budget-input-${cat.id}`}
                    className="w-20 bg-[#0b0e14] border-2 border-[#2a334a] rounded-lg py-2 px-2 text-center text-lg font-black text-white outline-none focus:border-[#c3f400]"
                  />
                  <span className="text-[11px] text-[#647087]">/mo</span>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      data-testid={`budget-delete-${cat.id}`}
                      className="w-9 h-9 rounded-lg bg-[#291419] border-2 border-[#ff4d6d]/50 flex items-center justify-center text-[#ff4d6d]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategory chips */}
              <div className="border-t border-[#2a334a] mt-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b93a7]">Active Sub-Ledgers</span>
                  <span className="text-[11px] text-[#647087]">{subs.length} assigned</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subs.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] text-[12px] font-bold text-white">
                      {s.name} <Check className="w-3.5 h-3.5 text-[#c3f400]" />
                    </span>
                  ))}
                  {addingSubFor === cat.id ? (
                    <input
                      autoFocus
                      value={subDraft}
                      onChange={(e) => setSubDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitAddSub(cat.id)}
                      onBlur={() => commitAddSub(cat.id)}
                      placeholder="Sub-ledger name"
                      data-testid={`sub-draft-${cat.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#0b0e14] border-2 border-[#c3f400] text-[12px] text-white outline-none w-36"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSubDraft('');
                        setAddingSubFor(cat.id);
                      }}
                      data-testid={`add-sub-${cat.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-[#2a334a] text-[12px] font-bold uppercase tracking-wide text-[#c3f400]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Subcategory
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add custom category */}
        {addingCustom ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitCustomCategory()}
              placeholder="New category name"
              data-testid="custom-cat-draft"
              className={inputBase}
            />
            <button type="button" onClick={commitCustomCategory} data-testid="custom-cat-save" className="px-4 py-3 rounded-xl bg-[#c3f400] text-[#0b0e14] font-black">
              <Check className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            data-testid="add-custom-cat-btn"
            className="w-full py-4 rounded-xl bg-[#141824] border-2 border-dashed border-[#2a334a] text-white text-[14px] font-bold uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <span className="w-7 h-7 rounded-full bg-[#0b0e14] border-2 border-[#c3f400] flex items-center justify-center text-[#c3f400]">
              <Plus className="w-4 h-4" />
            </span>
            + Add Custom Category
          </button>
        )}

        {/* Total ceiling */}
        <div className="p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a]">
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8b93a7]">
                <span className="w-2 h-2 rounded-full bg-[#c3f400]" /> Burn Limit Guardrail
              </p>
              <p className="text-[13px] font-bold uppercase tracking-wide text-white mt-1">Total Allocated Ceiling</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#c3f400]" data-testid="budget-total">{inr(totalCeiling)}</p>
              <p className="text-[11px] uppercase tracking-widest text-[#647087]">/ Month</p>
            </div>
          </div>
          {pools.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b93a7]">Dynamic Target Allocation</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#c3f400]">{pools.length} Active Pools</span>
              </div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                {pools.map((p, i) => (
                  <div
                    key={p.id}
                    style={{ width: `${(p.amount / totalCeiling) * 100}%`, background: poolColors[i % poolColors.length] }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {pools.slice(0, 4).map((p, i) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 text-[12px] text-[#8b93a7]">
                    <span className="w-2 h-2 rounded-full" style={{ background: poolColors[i % poolColors.length] }} />
                    {p.name} ({Math.round((p.amount / totalCeiling) * 100)}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[#2a334a] bg-[#0b0e14]">
        <button type="button" onClick={finishOnboarding} data-testid="complete-setup-btn" className={primaryBtn}>
          Complete Setup &amp; Launch Dashboard <Zap className="w-4 h-4" fill="#0b0e14" />
        </button>
        <p className="text-center text-[11px] uppercase tracking-widest text-[#647087] mt-3">
          Limits can be adapted anytime via Vault Settings
        </p>
      </div>
    </div>
  );
};
