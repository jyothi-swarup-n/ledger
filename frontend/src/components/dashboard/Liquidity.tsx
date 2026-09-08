import React from 'react';
import { ArrowRight, Building2, ChevronRight, CreditCard, PlusCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const Liquidity: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { bankLedgers, cardLedgers, formatINR } = useFinance();
  const count = bankLedgers.length + cardLedgers.length;
  return (
    <section className="records-liquidity" data-testid="allocated-liquidity-section" aria-labelledby="liquidity-title">
      <div className="records-section-heading">
        <div className="records-heading-with-icon"><CreditCard size={17} className="records-lime" aria-hidden="true" />
          <h2 id="liquidity-title" className="records-section-title" data-testid="allocated-liquidity-title">Allocated Liquidity</h2></div>
        <button type="button" className="records-text-action" onClick={() => onNavigate('accounts')} data-testid="manage-accounts-button">
          Manage ({count})<ChevronRight size={14} /></button>
      </div>
      {count === 0 ? (
        <button type="button" className="records-empty-account" onClick={() => onNavigate('accounts')} data-testid="add-first-account-button">
          <span className="records-empty-icon"><PlusCircle size={21} /></span>
          <span><strong data-testid="accounts-empty-title">No accounts yet</strong><small>Bank accounts & credit cards</small></span>
          <ArrowRight size={18} className="records-lime" />
        </button>
      ) : (
        <div className="records-accounts-grid" data-testid="allocated-accounts-list">
          {bankLedgers.map(({ account, balance }) => (
            <button type="button" key={account.id} className="records-account" onClick={() => onNavigate('accounts')} data-testid={`account-${account.id}`}>
              <span className="records-account-top"><Building2 size={20} className="records-blue" /><span className="records-tag">Bank</span></span>
              <span className="records-account-name" data-testid={`account-name-${account.id}`}>{account.name} <small>({account.accountNumberMask || '••••'})</small></span>
              <strong data-testid={`account-balance-${account.id}`}>{formatINR(balance)}</strong>
              <span className="records-account-footer"><span className="records-lime">Active float</span><ArrowRight size={14} /></span>
            </button>
          ))}
          {cardLedgers.map(({ card, outstandingBalance, availableCredit }) => (
            <button type="button" key={card.id} className="records-account is-credit-card" onClick={() => onNavigate('accounts')} data-testid={`card-${card.id}`}>
              <span className="records-account-top"><CreditCard size={20} className="records-coral" /><span className="records-tag">Card</span></span>
              <span className="records-account-name" data-testid={`card-name-${card.id}`}>{card.name} <small>({card.cardNumberMask || '••••'})</small></span>
              <strong className="records-coral" data-testid={`card-balance-${card.id}`}>{formatINR(outstandingBalance)}</strong>
              <span className="records-account-footer"><span data-testid={`card-available-${card.id}`}>Available {formatINR(availableCredit, { hideDecimals: true })}</span><ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};