import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
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
  const { currentUser } = useFinance();
  const [activeTab, setActiveTab] = useState<string>('dash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] selection:bg-[#c3f400] selection:text-[#0b0e14] flex flex-col font-sans">
        <AuthScreen />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] selection:bg-[#c3f400] selection:text-[#0b0e14] flex flex-col font-sans">
      {/* Top Kinetic Bar */}
      <Header
        activeTab={activeTab}
        onOpenProfile={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area with Mobile/Desktop constraints */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-20 pb-20">
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
