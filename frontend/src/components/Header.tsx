import React from 'react';
import { Zap } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC<{ onOpenProfile: () => void }> = ({ onOpenProfile }) => {
  const { currentUser } = useFinance();

  return (
    <header className="records-header" data-testid="app-header">
      <div className="records-header-inner">
        <div className="records-brand" data-testid="header-brand-title" aria-label="Records by Arsonist">
          <span className="records-brand-icon" aria-hidden="true"><Zap size={20} /></span>
          <div>
            <span className="records-brand-name">Records</span>
            <span className="records-brand-byline">by Arsonist</span>
          </div>
        </div>
        <div className="records-header-actions">
          <PWAInstallButton />
          <button type="button" className="records-profile" onClick={onOpenProfile}
            data-testid="header-profile-button" aria-label="Account profile and settings" title="Account profile and settings">
            <span data-testid="header-profile-initial">{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};