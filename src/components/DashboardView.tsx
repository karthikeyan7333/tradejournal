import React from 'react';
import { Trade, CurrencyType } from '../types/trade';
import { computeDashboardStats, formatCurrency } from '../utils/calculations';
import { PnlChart } from './PnlChart';
import { Plus, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface DashboardViewProps {
  trades: Trade[];
  currency: CurrencyType;
  onOpenAddTrade: () => void;
  onSelectTrade: (trade: Trade) => void;
  onViewAllTrades: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trades,
  currency,
  onOpenAddTrade,
  onSelectTrade,
  onViewAllTrades,
}) => {
  const stats = computeDashboardStats(trades);
  const recentTrades = trades.slice(0, 5);

  if (trades.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[65vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#12151b] border border-[#212630] flex items-center justify-center mb-6 shadow-xl">
          <img src="/logo.svg" alt="TradeJournal" className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No trades recorded yet</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
          Start recording your trades to see your performance metrics, win rate, and trading progress over time.
        </p>
        <button
          onClick={onOpenAddTrade}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E676] text-black text-sm font-bold shadow-lg shadow-[#00E676]/20 hover:bg-[#2bfb8d] transition active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ Add First Trade</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-24">
      {/* Top Net P&L Hero Card */}
      <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Net Trading P&L
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              stats.netPnl >= 0
                ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                : 'bg-[#FF334B]/15 text-[#FF334B] border border-[#FF334B]/30'
            }`}
          >
            {stats.netPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {stats.netPnl >= 0 ? 'Profitable' : 'Drawdown'}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-3">
          <div
            className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
              stats.netPnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
            }`}
          >
            {formatCurrency(stats.netPnl, currency)}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          From {stats.totalTrades} recorded {stats.totalTrades === 1 ? 'trade' : 'trades'}
        </p>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Trades */}
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Trades</span>
            <Layers className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{stats.totalTrades}</div>
          <div className="text-[10px] text-gray-500 mt-1">
            {stats.winCount}W • {stats.lossCount}L
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Win Rate</span>
            <Target className="w-4 h-4 text-gray-500" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              stats.winRate >= 50 ? 'text-[#00E676]' : 'text-gray-300'
            }`}
          >
            {stats.winRate}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {stats.winCount} / {stats.winCount + stats.lossCount} decided
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Profit</span>
            <ArrowUpRight className="w-4 h-4 text-[#00E676]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#00E676]">
            {formatCurrency(stats.totalProfit, currency)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {stats.winCount} winning trades
          </div>
        </div>

        {/* Total Loss */}
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Loss</span>
            <ArrowDownRight className="w-4 h-4 text-[#FF334B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#FF334B]">
            {formatCurrency(-stats.totalLoss, currency)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {stats.lossCount} losing trades
          </div>
        </div>
      </div>

      {/* P&L Performance Graph */}
      <PnlChart trades={trades} currency={currency} />

      {/* Recent Trades Section */}
      <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Recent Trades
          </h3>
          <button
            onClick={onViewAllTrades}
            className="text-xs font-semibold text-[#00E676] hover:underline"
          >
            View All ({trades.length})
          </button>
        </div>

        <div className="divide-y divide-[#1b1f27]">
          {recentTrades.map((trade) => {
            const isWin = trade.pnl > 0;
            const isLoss = trade.pnl < 0;
            return (
              <div
                key={trade.id}
                onClick={() => onSelectTrade(trade)}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer group hover:bg-[#151921]/60 px-2 -mx-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-10 rounded-full flex-shrink-0 ${
                      isWin ? 'bg-[#00E676]' : isLoss ? 'bg-[#FF334B]' : 'bg-gray-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {trade.symbol}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          trade.position === 'Long'
                            ? 'bg-[#00E676]/15 text-[#00E676]'
                            : 'bg-[#FF334B]/15 text-[#FF334B]'
                        }`}
                      >
                        {trade.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{trade.date}</span>
                      <span>•</span>
                      <span>{trade.market}</span>
                      {trade.setup && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] text-gray-500">
                            {trade.setup}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-mono font-bold text-sm sm:text-base ${
                      isWin ? 'text-[#00E676]' : isLoss ? 'text-[#FF334B]' : 'text-gray-400'
                    }`}
                  >
                    {formatCurrency(trade.pnl, currency)}
                  </div>
                  {trade.riskReward && (
                    <div className="text-[10px] text-gray-500 font-mono">
                      1:{trade.riskReward} R:R
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
