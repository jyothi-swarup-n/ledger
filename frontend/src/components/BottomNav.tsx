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
    { id: 'log', label: 'Log', icon: Plus, isSpecial: true },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'accounts', label: 'Accounts', icon: CreditCard }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#0b0e14]/95 backdrop-blur-xl border-t border-[#2a334a] shadow-[0_-4px_16px_rgba(0,0,0,0.7)]">
      <div className="h-16 px-2 max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                title="Log Transaction"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-black transition-all ${
                    isActive
                      ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-lg -translate-y-1'
                      : 'bg-[#3872ff] text-white shadow-brutal hover:bg-[#2b59ff] hover:-translate-y-0.5'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                    isActive ? 'text-[#c3f400]' : 'text-zinc-400 group-hover:text-white'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-2 transition-all group focus:outline-none ${
                isActive ? 'text-[#c3f400] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div
                className={`p-1 rounded-md transition-all ${
                  isActive ? 'bg-[#1f2638] text-[#c3f400] shadow-brutal-sm' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
