import React, { useState, useMemo } from 'react';
import { Trade, CurrencyType, DayPerformance } from '../types/trade';
import { groupTradesByDate, formatCurrency } from '../utils/calculations';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface CalendarViewProps {
  trades: Trade[];
  currency: CurrencyType;
  onSelectTrade: (trade: Trade) => void;
  onAddTradeOnDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  trades,
  currency,
  onSelectTrade,
  onAddTradeOnDate,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().slice(0, 10)
  );

  const tradesByDate = useMemo(() => groupTradesByDate(trades), [trades]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now.toISOString().slice(0, 10));
  };

  // Monthly stats
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let monthPnl = 0;
    let greenDays = 0;
    let redDays = 0;
    let tradeCount = 0;

    tradesByDate.forEach((dayPerf, dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        monthPnl += dayPerf.pnl;
        tradeCount += dayPerf.tradeCount;
        if (dayPerf.pnl > 0) greenDays++;
        else if (dayPerf.pnl < 0) redDays++;
      }
    });

    return {
      monthPnl: Math.round(monthPnl * 100) / 100,
      greenDays,
      redDays,
      tradeCount,
    };
  }, [tradesByDate, currentYear, currentMonth]);

  const selectedDayPerformance: DayPerformance | undefined = tradesByDate.get(selectedDate);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-24">
      {/* Month Header & Controls */}
      <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#171b23] border border-[#232934] flex items-center justify-center text-[#00E676]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-[11px] text-gray-400">Trading Performance Calendar</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#161920] border border-[#232832] text-gray-300 hover:text-white transition"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-[#161920] border border-[#232832] text-gray-400 hover:text-white transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-[#161920] border border-[#232832] text-gray-400 hover:text-white transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Summary Bar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-2.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Green Days</span>
          <span className="text-sm sm:text-base font-bold text-[#00E676] font-mono">
            {monthStats.greenDays} days
          </span>
        </div>
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-2.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Red Days</span>
          <span className="text-sm sm:text-base font-bold text-[#FF334B] font-mono">
            {monthStats.redDays} days
          </span>
        </div>
        <div className="bg-[#101318] border border-[#1e232b] rounded-xl p-2.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Month Net P&L</span>
          <span
            className={`text-sm sm:text-base font-bold font-mono ${
              monthStats.monthPnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
            }`}
          >
            {formatCurrency(monthStats.monthPnl, currency)}
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-3 sm:p-4">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div
              key={d}
              className={`text-[11px] font-bold py-1 ${
                i === 0 || i === 6 ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[58px] sm:min-h-[75px] rounded-xl bg-transparent opacity-20" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const perf = tradesByDate.get(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === today.toISOString().slice(0, 10);

            const isProfitable = perf && perf.pnl > 0;
            const isLosing = perf && perf.pnl < 0;
            const isBreakEven = perf && perf.pnl === 0;

            let cellBg = 'bg-[#0d0f14] border-[#1b1f27] hover:border-[#2b3340]';
            if (isProfitable) {
              cellBg = 'bg-[#00E676]/12 border-[#00E676]/50 text-white';
            } else if (isLosing) {
              cellBg = 'bg-[#FF334B]/12 border-[#FF334B]/50 text-white';
            } else if (isBreakEven) {
              cellBg = 'bg-[#181c24] border-gray-600 text-white';
            }

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[58px] sm:min-h-[75px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition relative active:scale-96 focus:outline-none ${cellBg} ${
                  isSelected ? 'ring-2 ring-[#00E676] ring-offset-2 ring-offset-[#08090b]' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-[#00E676] text-black flex items-center justify-center -ml-0.5'
                        : isProfitable
                        ? 'text-[#00E676]'
                        : isLosing
                        ? 'text-[#FF334B]'
                        : 'text-gray-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {perf && perf.tradeCount > 0 && (
                    <span className="text-[9px] font-mono text-gray-400 bg-black/40 px-1 rounded">
                      {perf.tradeCount}T
                    </span>
                  )}
                </div>

                {/* Daily Result Text */}
                {perf ? (
                  <div className="mt-1">
                    <span
                      className={`text-[10px] sm:text-xs font-mono font-bold block truncate leading-tight ${
                        isProfitable
                          ? 'text-[#00E676]'
                          : isLosing
                          ? 'text-[#FF334B]'
                          : 'text-gray-300'
                      }`}
                    >
                      {formatCurrency(perf.pnl, currency)}
                    </span>
                  </div>
                ) : (
                  <div className="h-3" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      <div className="bg-[#101318] border border-[#1e232b] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b1f27]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{selectedDate}</h3>
              {selectedDayPerformance && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    selectedDayPerformance.pnl > 0
                      ? 'bg-[#00E676]/15 text-[#00E676]'
                      : selectedDayPerformance.pnl < 0
                      ? 'bg-[#FF334B]/15 text-[#FF334B]'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {selectedDayPerformance.pnl > 0
                    ? 'Profit Day'
                    : selectedDayPerformance.pnl < 0
                    ? 'Loss Day'
                    : 'Break-even'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedDayPerformance
                ? `${selectedDayPerformance.tradeCount} trades recorded • ${selectedDayPerformance.wins}W / ${selectedDayPerformance.losses}L`
                : 'No trades recorded on this date'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedDayPerformance && (
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                  Day Result
                </span>
                <span
                  className={`font-mono font-bold text-base sm:text-lg ${
                    selectedDayPerformance.pnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
                  }`}
                >
                  {formatCurrency(selectedDayPerformance.pnl, currency)}
                </span>
              </div>
            )}
            <button
              onClick={() => onAddTradeOnDate(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161a22] border border-[#232935] hover:border-[#00E676] text-xs font-semibold text-white transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#00E676]" />
              <span>Record Trade</span>
            </button>
          </div>
        </div>

        {/* List of Trades for the Day */}
        {selectedDayPerformance && selectedDayPerformance.trades.length > 0 ? (
          <div className="space-y-2 pt-1">
            {selectedDayPerformance.trades.map((t) => {
              const isWin = t.pnl > 0;
              const isLoss = t.pnl < 0;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrade(t)}
                  className="bg-[#0c0e12] border border-[#1c2027] hover:border-[#272e3a] p-3 rounded-xl flex items-center justify-between cursor-pointer transition active:scale-99"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-7 rounded-full flex-shrink-0 ${
                        isWin ? 'bg-[#00E676]' : isLoss ? 'bg-[#FF334B]' : 'bg-gray-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {t.symbol}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            t.position === 'Long'
                              ? 'bg-[#00E676]/15 text-[#00E676]'
                              : 'bg-[#FF334B]/15 text-[#FF334B]'
                          }`}
                        >
                          {t.position}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{t.market}</span>
                        {t.setup && (
                          <>
                            <span>•</span>
                            <span className="text-gray-300 truncate">{t.setup}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isWin ? 'text-[#00E676]' : isLoss ? 'text-[#FF334B]' : 'text-gray-400'
                      }`}
                    >
                      {formatCurrency(t.pnl, currency)}
                    </div>
                    {t.riskReward && (
                      <div className="text-[10px] text-gray-500 font-mono">
                        1:{t.riskReward} R:R
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-xs">
            Tap "+ Record Trade" above to log a trade for {selectedDate}.
          </div>
        )}
      </div>
    </div>
  );
};
