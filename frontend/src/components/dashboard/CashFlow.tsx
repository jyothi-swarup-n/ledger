import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useCashFlow } from './useCashFlow';

export const CashFlow = () => {
  const { selectedMonth, formatINR } = useFinance();
  const [timeframe, setTimeframe] = useState<'7D' | '30D'>('30D');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const chart = useCashFlow(timeframe);
  useEffect(() => setSelectedPoint(null), [selectedMonth, timeframe]);
  const point = selectedPoint === null ? null : chart.points[selectedPoint];

  return (
    <section className="records-cash-flow" data-testid="cash-flow-section" aria-labelledby="cash-flow-title">
      <div className="records-section-heading records-chart-heading">
        <div>
          <p className="records-eyebrow" data-testid="cash-flow-label">Cash flow engine</p>
          <h2 id="cash-flow-title" className="records-section-title" data-testid="cash-flow-title">Velocity Dynamics</h2>
        </div>
        <div className="records-segmented" aria-label="Cash flow period" role="group" data-testid="cash-flow-timeframe">
          {(['7D', '30D'] as const).map((value) => (
            <button type="button" key={value} aria-pressed={timeframe === value} data-testid={`timeframe-${value.toLowerCase()}`}
              className={timeframe === value ? 'is-active' : ''} onClick={() => setTimeframe(value)}>{value}</button>
          ))}
        </div>
      </div>
      <div className="records-flow-metrics">
        <div className="records-flow-metric">
          <div><span className="records-eyebrow" data-testid="inflow-label">Total inflow</span>
            <strong className="records-blue" data-testid="cash-flow-inflow">{formatINR(chart.inflow, { hideDecimals: true })}</strong></div>
          <ArrowDownLeft size={19} className="records-blue" aria-hidden="true" />
        </div>
        <div className="records-flow-metric">
          <div><span className="records-eyebrow" data-testid="outflow-label">Total outflow</span>
            <strong className="records-coral" data-testid="cash-flow-outflow">{formatINR(chart.outflow, { hideDecimals: true })}</strong></div>
          <ArrowUpRight size={19} className="records-coral" aria-hidden="true" />
        </div>
      </div>
      <div className="records-chart" data-testid="cash-flow-chart">
        {point && <div className="records-chart-tooltip" data-testid="cash-flow-tooltip" role="status">
          <span data-testid="tooltip-date">{point.label}</span>
          <span className="records-blue" data-testid="tooltip-inflow">+{formatINR(point.inflow, { hideDecimals: true })}</span>
          <span className="records-coral" data-testid="tooltip-outflow">−{formatINR(point.outflow, { hideDecimals: true })}</span>
          <button type="button" onClick={() => setSelectedPoint(null)} data-testid="chart-tooltip-close" aria-label="Close chart details"><X size={14} /></button>
        </div>}
        <svg viewBox="0 0 340 132" fill="none" className="records-chart-svg" aria-label={`Inflow and outflow, ${chart.startLabel} to ${chart.endLabel}`} data-testid="cash-flow-svg">
          {[25, 69, 113].map((y) => <line key={y} x1="12" x2="328" y1={y} y2={y} stroke="var(--records-border)" strokeDasharray="3 5" />)}
          <path d={chart.inflowPath} stroke="var(--records-blue)" strokeWidth="2.5" data-testid="chart-inflow-line" />
          <path d={chart.outflowPath} stroke="var(--records-coral)" strokeWidth="2.5" strokeDasharray="5 3" data-testid="chart-outflow-line" />
          {chart.points.map((item, index) => <g key={index}>
            <circle cx={item.x} cy={item.inflowY} r="3.5" fill="var(--records-blue)" stroke="var(--records-surface)" strokeWidth="2" />
            <circle cx={item.x} cy={item.outflowY} r="3.5" fill="var(--records-coral)" stroke="var(--records-surface)" strokeWidth="2" />
          </g>)}
        </svg>
        <div className="records-chart-targets">
          {chart.points.map((item, index) => (
            <button type="button" key={index} data-testid={`chart-point-${index}`} aria-label={`${item.label}: inflow ${formatINR(item.inflow)}, outflow ${formatINR(item.outflow)}`}
              aria-pressed={selectedPoint === index} onClick={() => setSelectedPoint(selectedPoint === index ? null : index)} />
          ))}
        </div>
      </div>
      <div className="records-chart-legend">
        <span data-testid="chart-start-date">{chart.startLabel}</span>
        <div><span data-testid="chart-legend-inflow"><i className="is-inflow" />Inflow</span><span data-testid="chart-legend-outflow"><i className="is-outflow" />Outflow</span></div>
        <span data-testid="chart-end-date">{chart.endLabel}</span>
      </div>
    </section>
  );
};