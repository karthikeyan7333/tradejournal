import React, { useState, useMemo } from 'react';
import { Trade, MarketType, CurrencyType } from '../types/trade';
import { formatCurrency } from '../utils/calculations';
import { Search, Plus, Filter, Image as ImageIcon } from 'lucide-react';

interface TradesListViewProps {
  trades: Trade[];
  currency: CurrencyType;
  onSelectTrade: (trade: Trade) => void;
  onOpenAddTrade: () => void;
}

export const TradesListView: React.FC<TradesListViewProps> = ({
  trades,
  currency,
  onSelectTrade,
  onOpenAddTrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string>('All');
  const [selectedResult, setSelectedResult] = useState<'All' | 'Wins' | 'Losses'>('All');

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Market filter
      if (selectedMarket !== 'All' && t.market !== selectedMarket) {
        return false;
      }
      // Result filter
      if (selectedResult === 'Wins' && t.pnl <= 0) return false;
      if (selectedResult === 'Losses' && t.pnl >= 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSymbol = t.symbol.toLowerCase().includes(query);
        const matchesSetup = t.setup?.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        return matchesSymbol || matchesSetup || matchesNotes;
      }

      return true;
    });
  }, [trades, selectedMarket, selectedResult, searchQuery]);

  // Total filtered P&L
  const filteredNetPnl = useMemo(() => {
    return filteredTrades.reduce((acc, curr) => acc + curr.pnl, 0);
  }, [filteredTrades]);

  const marketsList: (string | MarketType)[] = [
    'All',
    'Indian Stocks',
    'Indian Options',
    'Crypto',
    'Forex',
    'Other',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 pb-24">
      {/* Title & Stats Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trade History</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} recorded
          </p>
        </div>

        {filteredTrades.length > 0 && (
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
              Filtered Net P&L
            </span>
            <span
              className={`font-mono font-bold text-sm sm:text-base ${
                filteredNetPnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
              }`}
            >
              {formatCurrency(filteredNetPnl, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by symbol or setup..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Markets Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {marketsList.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarket(m)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition ${
                selectedMarket === m
                  ? 'bg-[#1b212a] border-[#00E676] text-white'
                  : 'bg-[#101217] border-[#1e232b] text-gray-400 hover:text-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Win / Loss toggle */}
        <div className="flex items-center gap-1 bg-[#101217] border border-[#1e232b] p-1 rounded-xl self-start">
          <button
            onClick={() => setSelectedResult('All')}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
              selectedResult === 'All'
                ? 'bg-[#1b212a] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedResult('Wins')}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
              selectedResult === 'Wins'
                ? 'bg-[#00E676]/20 text-[#00E676]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setSelectedResult('Losses')}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
              selectedResult === 'Losses'
                ? 'bg-[#FF334B]/20 text-[#FF334B]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Losses
          </button>
        </div>
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-8 text-center my-6">
          <div className="w-12 h-12 rounded-xl bg-[#161a22] flex items-center justify-center mx-auto mb-3 text-gray-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No matching trades</h3>
          <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
            {trades.length === 0
              ? 'Your trading history is empty. Start recording your trades.'
              : 'Try changing your search term or market filters.'}
          </p>
          {trades.length === 0 && (
            <button
              onClick={onOpenAddTrade}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E676] text-black text-xs font-bold shadow-md hover:bg-[#2bfb8d] transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Record First Trade</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTrades.map((trade) => {
            const isWin = trade.pnl > 0;
            const isLoss = trade.pnl < 0;

            return (
              <div
                key={trade.id}
                onClick={() => onSelectTrade(trade)}
                className="bg-[#101318] border border-[#1e232b] hover:border-[#2b3340] rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition active:scale-99 group"
              >
                {/* Left Side: Symbol, Market, Direction, Date */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Visual Win/Loss bar */}
                  <div
                    className={`w-2.5 h-12 rounded-full flex-shrink-0 ${
                      isWin ? 'bg-[#00E676]' : isLoss ? 'bg-[#FF334B]' : 'bg-gray-600'
                    }`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white tracking-tight truncate group-hover:text-[#00E676] transition">
                        {trade.symbol}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          trade.position === 'Long'
                            ? 'bg-[#00E676]/15 text-[#00E676]'
                            : 'bg-[#FF334B]/15 text-[#FF334B]'
                        }`}
                      >
                        {trade.position}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{trade.date}</span>
                      <span>•</span>
                      <span className="truncate">{trade.market}</span>
                      {trade.timeframe && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{trade.timeframe}</span>
                        </>
                      )}
                    </div>

                    {/* Setup / Notes summary */}
                    {trade.setup && (
                      <div className="text-[11px] text-gray-400 truncate mt-1">
                        Setup: <span className="text-gray-300 font-medium">{trade.setup}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: P&L and Indicators */}
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-center">
                  <div
                    className={`text-base sm:text-lg font-black font-mono ${
                      isWin ? 'text-[#00E676]' : isLoss ? 'text-[#FF334B]' : 'text-gray-300'
                    }`}
                  >
                    {formatCurrency(trade.pnl, currency)}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                    {trade.riskReward && (
                      <span className="border border-[#232933] px-1.5 py-0.5 rounded">
                        1:{trade.riskReward} R:R
                      </span>
                    )}
                    {trade.images && trade.images.length > 0 && (
                      <span className="flex items-center gap-0.5 text-gray-400">
                        <ImageIcon className="w-3 h-3 text-[#00E676]" />
                        <span>{trade.images.length}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
