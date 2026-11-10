import React, { useState } from 'react';
import { Trade, CurrencyType } from '../types/trade';
import { formatCurrency, formatCurrencyNeutral } from '../utils/calculations';
import { X, Edit3, Trash2, Calendar, Clock, Layers, ShieldAlert, TrendingUp, TrendingDown, Image as ImageIcon } from 'lucide-react';

interface TradeDetailsModalProps {
  trade: Trade | null;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => Promise<void>;
  currency: CurrencyType;
}

export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  trade,
  onClose,
  onEdit,
  onDelete,
  currency,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!trade) return null;

  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  // Percentage gain or loss on entry price
  const percentGain = trade.entryPrice > 0
    ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * (trade.position === 'Long' ? 100 : -100)
    : 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(trade.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-2xl bg-[#0c0e12] border border-[#1e232b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b1f27] bg-[#0c0e12] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                trade.position === 'Long'
                  ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                  : 'bg-[#FF334B]/15 text-[#FF334B] border border-[#FF334B]/30'
              }`}
            >
              {trade.position}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-wide">{trade.symbol}</h2>
              <p className="text-xs text-gray-400">{trade.market}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(trade)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#181c24] border border-[#222730] transition"
              title="Edit Trade"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-[#FF334B] hover:bg-[#181c24] border border-[#222730] transition"
              title="Delete Trade"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#181c24] transition ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hero P&L Banner */}
          <div
            className={`rounded-2xl p-5 border ${
              isWin
                ? 'bg-[#00E676]/10 border-[#00E676]/30'
                : isLoss
                ? 'bg-[#FF334B]/10 border-[#FF334B]/30'
                : 'bg-[#15181f] border-[#222730]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Realized Profit / Loss
              </span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isWin ? 'text-[#00E676]' : isLoss ? 'text-[#FF334B]' : 'text-gray-400'
                }`}
              >
                {isWin ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {percentGain >= 0 ? `+${percentGain.toFixed(2)}%` : `${percentGain.toFixed(2)}%`}
              </span>
            </div>

            <div
              className={`text-3xl sm:text-4xl font-black font-mono mt-1 ${
                isWin ? 'text-[#00E676]' : isLoss ? 'text-[#FF334B]' : 'text-gray-300'
              }`}
            >
              {formatCurrency(trade.pnl, currency)}
            </div>

            {trade.isManualPnl && (
              <p className="text-[10px] text-gray-400 mt-1">
                (Manual P&L entry applied)
              </p>
            )}
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151b] border border-[#202530]">
              <Calendar className="w-3.5 h-3.5 text-[#00E676]" />
              <span>{trade.date}</span>
            </div>
            {trade.entryTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151b] border border-[#202530]">
                <Clock className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Entry: <strong className="text-white font-mono">{trade.entryTime}</strong></span>
              </div>
            )}
            {trade.exitTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151b] border border-[#202530]">
                <Clock className="w-3.5 h-3.5 text-[#FF334B]" />
                <span>Exit: <strong className="text-white font-mono">{trade.exitTime}</strong></span>
              </div>
            )}
            {trade.timeframe && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151b] border border-[#202530]">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{trade.timeframe} Timeframe</span>
              </div>
            )}
            {trade.setup && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12151b] border border-[#202530]">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-white">{trade.setup}</span>
              </div>
            )}
          </div>

          {/* Execution Details Grid */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Trade Execution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Entry Price</span>
                <span className="text-base font-mono font-bold text-white">
                  {formatCurrencyNeutral(trade.entryPrice, currency)}
                </span>
                {trade.entryTime && (
                  <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                    at {trade.entryTime}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Exit Price</span>
                <span className="text-base font-mono font-bold text-white">
                  {formatCurrencyNeutral(trade.exitPrice, currency)}
                </span>
                {trade.exitTime && (
                  <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                    at {trade.exitTime}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Position Size</span>
                <span className="text-base font-mono font-bold text-white">
                  {trade.positionSize}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-semibold block">Stop Loss</span>
                <span className="text-base font-mono font-bold text-gray-300">
                  {trade.stopLoss !== null && trade.stopLoss !== undefined
                    ? formatCurrencyNeutral(trade.stopLoss, currency)
                    : '—'}
                </span>
              </div>
            </div>

            {trade.riskReward && (
              <div className="mt-4 pt-3 border-t border-[#1b1f27] flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold">Calculated Risk : Reward</span>
                <span className="font-mono font-bold text-white text-sm">
                  1 : {trade.riskReward}
                </span>
              </div>
            )}
          </div>

          {/* About This Trade (The ONLY writing section) */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              About This Trade
            </h3>
            {trade.notes ? (
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-normal">
                {trade.notes}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                No notes recorded for this trade.
              </p>
            )}
          </div>

          {/* Trade Images Gallery */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Trade Images ({trade.images.length})</span>
              </h3>
            </div>

            {trade.images.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No screenshots attached.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trade.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className="aspect-video bg-black rounded-xl overflow-hidden border border-[#222730] cursor-pointer hover:border-[#00E676] transition group relative"
                  >
                    <img
                      src={img}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-white bg-black/70 px-2 py-1 rounded-md">
                        Tap to enlarge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-[#12151c] border border-[#2a303d] rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-[#FF334B]/15 text-[#FF334B] flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Delete Trade?</h4>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                This will permanently remove <strong className="text-white">{trade.symbol}</strong> and its screenshots from your trading journal.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-[#222730] text-gray-300 text-xs font-semibold hover:bg-[#181c24] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF334B] text-white text-xs font-bold hover:bg-[#e02b40] transition active:scale-95"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Image Viewer */}
        {activeImage && (
          <div
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImage}
              alt="Trade screenshot"
              className="max-w-full max-h-[92vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
};
