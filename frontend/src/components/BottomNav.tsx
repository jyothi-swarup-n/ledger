import React from 'react';
import { LayoutDashboard, WalletCards, Plus, TrendingUp, CreditCard } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dash', label: 'Dash', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budgets', icon: WalletCards },
    { id: 'log', label: 'Log', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
  ];

  return (
    <nav className="records-nav" data-testid="bottom-navigation" aria-label="Main navigation">
      <div className="records-nav-inner">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" data-testid={`nav-${id}`} onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined} aria-label={id === 'log' ? 'Log transaction' : label}
            className={`records-nav-button ${activeTab === id ? 'is-active' : ''} ${id === 'log' ? 'is-log' : ''}`}>
            <span className="records-nav-icon"><Icon size={id === 'log' ? 26 : 21} strokeWidth={activeTab === id ? 2.3 : 1.8} /></span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};