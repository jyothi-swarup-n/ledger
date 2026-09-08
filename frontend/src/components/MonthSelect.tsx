import React, { useId } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const MonthSelect: React.FC<{ testId?: string }> = ({ testId = 'accounting-month-select' }) => {
  const { selectedMonth, setSelectedMonth, availableMonths } = useFinance();
  const id = useId();
  return (
    <label className="records-month" htmlFor={id} data-testid={`${testId}-control`}>
      <CalendarDays size={13} aria-hidden="true" />
      <select id={id} value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}
        data-testid={testId} aria-label="Accounting month">
        {availableMonths.map((monthKey) => {
          const [year, month] = monthKey.split('-').map(Number);
          return <option key={monthKey} value={monthKey} data-testid={`${testId}-option-${monthKey}`}>
            {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </option>;
        })}
      </select>
      <ChevronDown size={12} aria-hidden="true" />
    </label>
  );
};