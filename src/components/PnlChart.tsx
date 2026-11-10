import React, { useState, useMemo } from 'react';
import { Trade, CurrencyType } from '../types/trade';
import { computeCumulativePnl, formatCurrency, CumulativePnlPoint } from '../utils/calculations';

interface PnlChartProps {
  trades: Trade[];
  currency: CurrencyType;
}

export const PnlChart: React.FC<PnlChartProps> = ({ trades, currency }) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '7d'>('all');
  const [activePoint, setActivePoint] = useState<CumulativePnlPoint | null>(null);

  const filteredTrades = useMemo(() => {
    if (filterPeriod === 'all') return trades;
    const now = new Date();
    const days = filterPeriod === '30d' ? 30 : 7;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return trades.filter((t) => t.date >= cutoffStr);
  }, [trades, filterPeriod]);

  const points = useMemo(() => computeCumulativePnl(filteredTrades), [filteredTrades]);

  if (trades.length === 0 || points.length <= 1) {
    return (
      <div className="bg-[#101318] border border-[#1d222b] rounded-2xl p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
          P&L Performance
        </h3>
        <p className="text-xs text-gray-500">
          Chart will appear here once you record your first trades.
        </p>
      </div>
    );
  }

  // Calculate bounds
  const values = points.map((p) => p.cumulativePnl);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 25, left: 20 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Zero line Y coordinate
  const zeroY = padding.top + graphHeight - ((0 - minVal) / range) * graphHeight;

  // Map coordinates
  const coords = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((p.cumulativePnl - minVal) / range) * graphHeight;
    return { x, y, point: p };
  });

  // Construct SVG path line
  const pathD = coords.reduce(
    (acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`,
    ''
  );

  // Area path closing at zero line or bottom
  const lastPoint = coords[coords.length - 1];
  const firstPoint = coords[0];
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)} ${zeroY.toFixed(1)} L ${firstPoint.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;

  const finalCumulative = points[points.length - 1].cumulativePnl;
  const isOverallPositive = finalCumulative >= 0;
  const strokeColor = isOverallPositive ? '#00E676' : '#FF334B';
  const fillColor = isOverallPositive ? 'url(#greenGradient)' : 'url(#redGradient)';

  const selectedPoint = activePoint || points[points.length - 1];

  return (
    <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              P&L Performance
            </h3>
            {activePoint && (
              <span className="text-[10px] bg-[#1a1f27] text-gray-300 px-2 py-0.5 rounded-full font-medium">
                Inspecting trade
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                selectedPoint.cumulativePnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
              }`}
            >
              {formatCurrency(selectedPoint.cumulativePnl, currency)}
            </span>
            <span className="text-xs text-gray-400">
              {selectedPoint.symbol === 'Start'
                ? 'Baseline'
                : `${selectedPoint.symbol} (${selectedPoint.date})`}
            </span>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center bg-[#0a0c10] p-1 rounded-xl border border-[#1b1f27] self-start sm:self-auto">
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              filterPeriod === 'all'
                ? 'bg-[#1b212a] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterPeriod('30d')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              filterPeriod === '30d'
                ? 'bg-[#1b212a] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setFilterPeriod('7d')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              filterPeriod === '7d'
                ? 'bg-[#1b212a] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            7D
          </button>
        </div>
      </div>

      {/* SVG Performance Chart */}
      <div className="w-full relative touch-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00E676" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#00E676" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FF334B" stop-opacity="0.0" />
              <stop offset="100%" stop-color="#FF334B" stop-opacity="0.25" />
            </linearGradient>
          </defs>

          {/* Zero baseline */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#262d38"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Area fill */}
          <path d={areaD} fill={fillColor} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {coords.map((c, i) => {
            if (i === 0 && points.length > 2) return null;
            const isHovered = activePoint?.index === c.point.index;
            return (
              <g key={i}>
                {/* Touch target circle */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="14"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActivePoint(c.point)}
                  onMouseLeave={() => setActivePoint(null)}
                  onTouchStart={() => setActivePoint(c.point)}
                />
                {/* Visual dot */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? '5' : '3'}
                  fill="#0c0e12"
                  stroke={c.point.cumulativePnl >= 0 ? '#00E676' : '#FF334B'}
                  strokeWidth={isHovered ? '3' : '2'}
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Date stamps at bottom */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1 px-1">
          <span>{points[1]?.date || points[0]?.date}</span>
          <span>{points[points.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
};
