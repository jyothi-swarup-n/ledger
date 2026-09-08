import { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';

export const useCashFlow = (timeframe: '7D' | '30D') => {
  const { transactions, categories, selectedMonth } = useFinance();
  return useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    const intervals = timeframe === '7D'
      ? Array.from({ length: 7 }, (_, i) => ({ start: i + 1, end: i + 1 }))
      : Array.from({ length: 6 }, (_, i) => ({ start: i * 5 + 1, end: i === 5 ? daysInMonth : i * 5 + 5 }));
    const categoryMap = new Map<string, Category>(categories.map((category) => [category.id, category]));
    const monthTransactions = transactions.filter((tx) => tx.date.startsWith(`${selectedMonth}-`) && !categoryMap.get(tx.categoryId)?.isTransfer);
    const data = intervals.map(({ start, end }) => {
      const dayTransactions = monthTransactions.filter((tx) => {
        const day = Number(tx.date.slice(8, 10));
        return day >= start && day <= end;
      });
      return {
        label: start === end ? `${monthLabel} ${start}` : `${monthLabel} ${start}–${end}`,
        inflow: dayTransactions.filter((tx) => tx.direction === 'Credit').reduce((sum, tx) => sum + tx.amount, 0),
        outflow: dayTransactions.filter((tx) => tx.direction === 'Debit').reduce((sum, tx) => sum + tx.amount, 0),
      };
    });
    const max = Math.max(1, ...data.flatMap((point) => [point.inflow, point.outflow]));
    const points = data.map((point, i) => ({
      ...point, x: 12 + i * (316 / (data.length - 1)),
      inflowY: 113 - point.inflow / max * 88,
      outflowY: 113 - point.outflow / max * 88,
    }));
    const path = (key: 'inflowY' | 'outflowY') => points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point[key]}`).join(' ');
    return {
      points, inflowPath: path('inflowY'), outflowPath: path('outflowY'),
      startLabel: `${monthLabel} 1`, endLabel: `${monthLabel} ${timeframe === '7D' ? 7 : daysInMonth}`,
      inflow: data.reduce((sum, point) => sum + point.inflow, 0),
      outflow: data.reduce((sum, point) => sum + point.outflow, 0),
    };
  }, [transactions, categories, selectedMonth, timeframe]);
};