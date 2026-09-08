import React, { useState, useEffect, useRef } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { authApi } from './services/api';
import { Header } from './components/Header';
import { MonthSelect } from './components/MonthSelect';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { BudgetView } from './components/BudgetView';
import { TransactionEntryView } from './components/TransactionEntryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AccountsView } from './components/AccountsView';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthScreen } from './components/AuthScreen';
import { Transaction } from './types';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentUser, establishSession } = useFinance();
  const [activeTab, setActiveTab] = useState<string>('dash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Emergent-managed Google Auth callback: exchange the one-time session_id for a session.
  const [googleProcessing, setGoogleProcessing] = useState(() =>
    typeof window !== 'undefined' && window.location.hash.includes('session_id=')
  );
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleHandled = useRef(false);

  useEffect(() => {
    if (googleHandled.current) return;
    const hash = window.location.hash || '';
    if (!hash.includes('session_id=')) return;
    googleHandled.current = true;
    const sessionId = new URLSearchParams(hash.replace(/^#/, '')).get('session_id');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!sessionId) {
      setGoogleProcessing(false);
      return;
    }
    (async () => {
      try {
        const res = await authApi.googleSession(sessionId);
        establishSession(res.user);
      } catch (e: any) {
        setGoogleError(e?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleProcessing(false);
      }
    })();
  }, [establishSession]);

  if (googleProcessing) {
    return (
      <div
        className="min-h-screen bg-[#0b0e14] text-white flex flex-col items-center justify-center gap-4 font-sans"
        data-testid="google-callback-processing"
      >
        <div className="w-12 h-12 rounded-full border-2 border-[#2a334a] border-t-[#c3f400] animate-spin" />
        <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8b93a7]">Authenticating with Google…</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] selection:bg-[#c3f400] selection:text-[#0b0e14] flex flex-col font-sans">
        {googleError && (
          <div
            className="max-w-md mx-auto mt-4 px-4 py-3 rounded-xl bg-[#291419] border-2 border-[#ff4d6d] text-[13px] text-[#ff7b8a] font-semibold w-[calc(100%-2rem)]"
            data-testid="google-callback-error"
          >
            {googleError}
          </div>
        )}
        <AuthScreen />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] selection:bg-[#c3f400] selection:text-[#0b0e14] flex flex-col font-sans">
      {/* Shared Records header */}
      <Header
        onOpenProfile={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area with Mobile/Desktop constraints */}
      <main className="records-main flex-1 w-full max-w-lg mx-auto px-4" data-testid="app-main">
        {activeTab !== 'dash' && <div className="records-page-period" data-testid="page-period-toolbar">
          <span data-testid="page-title">{({ budgets: 'Budgets', log: 'Transaction log', analytics: 'Analytics', accounts: 'Accounts' } as Record<string, string>)[activeTab]}</span>
          <MonthSelect />
        </div>}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'dash' && (
              <DashboardView
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectTransaction={(tx) => setSelectedTx(tx)}
              />
            )}

            {activeTab === 'budgets' && <BudgetView />}

            {activeTab === 'log' && (
              <TransactionEntryView
                onTransactionSaved={() => setActiveTab('dash')}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'accounts' && <AccountsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
