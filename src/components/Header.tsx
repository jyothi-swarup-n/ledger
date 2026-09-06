import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Bell, Calendar, ChevronDown, ShieldCheck, User as UserIcon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: string;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenProfile }) => {
  const { selectedMonth, setSelectedMonth, availableMonths, currentUser, vpsStatus } = useFinance();
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Tab display name mapping
  const tabTitles: Record<string, string> = {
    dash: 'DASHBOARD',
    budgets: 'BUDGETS',
    log: 'TRANSACTION LOG',
    analytics: 'ANALYTICS & AUDIT',
    accounts: 'ACCOUNTS & LEDGERS'
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-[#0b0e14]/90 backdrop-blur-xl border-b border-[#2a334a] shadow-[0_4px_16px_rgba(0,0,0,0.6)] pt-safe">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
        {/* Brand & Section Tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#141824] border border-[#2a334a] flex items-center justify-center text-[#c3f400] shadow-brutal-sm">
            {/* Minimalist kinetic cube icon */}
            <span className="font-bold text-lg font-mono leading-none">⚡</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold tracking-wider text-white uppercase leading-none">
                KINETIC LEDGER
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1f2638] text-[#c3f400] font-bold border border-[#2a334a]">
                ARSONIST
              </span>
            </div>
            <span className="text-[10px] text-[#c3f400] tracking-widest uppercase font-bold mt-0.5">
              {tabTitles[activeTab] || 'FINANCE'}
            </span>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2">
          {/* Universal Month Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="px-2.5 py-1 rounded-lg bg-[#141824] border border-[#2a334a] text-xs font-bold text-white hover:border-[#c3f400] transition-colors flex items-center gap-1.5 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              title="Select Active Accounting Month"
            >
              <Calendar className="w-3.5 h-3.5 text-[#c3f400]" />
              <span>{formatMonthLabel(selectedMonth)}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMonthDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMonthDropdown(false)}
                />
                <div className="absolute right-0 mt-1.5 w-40 bg-[#141824] border-2 border-[#2a334a] rounded-lg shadow-brutal-lg z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-[#2a334a]">
                    Accounting Period
                  </div>
                  {availableMonths.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                        selectedMonth === m
                          ? 'bg-[#c3f400] text-[#0b0e14]'
                          : 'text-zinc-200 hover:bg-[#1f2638] hover:text-[#c3f400]'
                      }`}
                    >
                      <span>{formatMonthLabel(m)}</span>
                      {selectedMonth === m && <span className="text-[10px] uppercase font-mono">ACTIVE</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* PWA Mobile / Desktop Install Prompt */}
          <PWAInstallButton />

          {/* User Profile Avatar / Settings Button */}
          <button
            onClick={onOpenProfile}
            className="h-8 px-2 rounded-lg bg-[#141824] border border-[#2a334a] hover:border-[#c3f400] flex items-center gap-1.5 transition-transform active:scale-95 shadow-brutal-sm"
            title="Account Profile & Settings"
          >
            <div className="w-5 h-5 rounded bg-[#c3f400] text-[#0b0e14] font-bold text-[11px] flex items-center justify-center">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'J'}
            </div>
            <span className="text-xs font-bold text-zinc-200 hidden sm:inline">
              {currentUser?.name || 'Jyothi'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
