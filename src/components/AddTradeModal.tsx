import React, { useState, useEffect, useRef } from 'react';
import { Trade, MarketType, PositionType, CurrencyType } from '../types/trade';
import { calculatePnl, calculateRiskReward, formatCurrency } from '../utils/calculations';
import { optimizeImage, isValidImageFile, readFileAsDataURL } from '../utils/imageOptimizer';
import { X, Upload, Trash2, Camera, AlertCircle, Check, Eye } from 'lucide-react';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => Promise<void>;
  tradeToEdit?: Trade | null;
  currency: CurrencyType;
  initialDate?: string;
  userId?: string | null;
}

const MARKETS: MarketType[] = [
  'Indian Stocks',
  'Indian Options',
  'Crypto',
  'Forex',
  'Other',
];

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1D'];

const SETUP_SUGGESTIONS = [
  'Breakout + Retest',
  'Support Rejection',
  'Resistance Rejection',
  'EMA Crossover',
  'Trendline Break',
  'Liquidity Sweep',
  'Opening Range Breakout',
  'Pullback',
];

const HOURS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseTime12(val: string) {
  if (!val) return { hour: '', minute: '', period: 'AM' as 'AM' | 'PM' };
  const match = val.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: match[1].padStart(2, '0'),
      minute: match[2],
      period: (match[3].toUpperCase() === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM',
    };
  }
  return { hour: '', minute: '', period: 'AM' as 'AM' | 'PM' };
}

interface Time12SelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const Time12Select: React.FC<Time12SelectProps> = ({ label, value, onChange }) => {
  const { hour, minute, period } = parseTime12(value);

  const update = (newH: string, newM: string, newP: 'AM' | 'PM') => {
    if (!newH && !newM) {
      onChange('');
      return;
    }
    const h = newH || '09';
    const m = newM || '00';
    onChange(`${h}:${m} ${newP}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          {label} <span className="text-[10px] text-gray-500 font-normal lowercase">(optional)</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-gray-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={hour}
          onChange={(e) => update(e.target.value, minute, period)}
          aria-label={`${label} Hour`}
          className="w-full px-2 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#00E676] font-mono cursor-pointer"
        >
          <option value="" className="bg-[#101217] text-gray-500">Hour --</option>
          {HOURS_12.map((h) => (
            <option key={h} value={h} className="bg-[#101217] text-white font-mono">
              {h}
            </option>
          ))}
        </select>

        <select
          value={minute}
          onChange={(e) => update(hour, e.target.value, period)}
          aria-label={`${label} Minute`}
          className="w-full px-2 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#00E676] font-mono cursor-pointer"
        >
          <option value="" className="bg-[#101217] text-gray-500">Min --</option>
          {MINUTES_60.map((m) => (
            <option key={m} value={m} className="bg-[#101217] text-white font-mono">
              {m}
            </option>
          ))}
        </select>

        <select
          value={period}
          onChange={(e) => update(hour, minute, e.target.value as 'AM' | 'PM')}
          aria-label={`${label} AM/PM`}
          className="w-full px-2 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#00E676] font-semibold cursor-pointer"
        >
          <option value="AM" className="bg-[#101217] text-white">AM</option>
          <option value="PM" className="bg-[#101217] text-white">PM</option>
        </select>
      </div>
    </div>
  );
};

export const AddTradeModal: React.FC<AddTradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tradeToEdit,
  currency,
  initialDate,
  userId,
}) => {
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<MarketType>('Indian Stocks');
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [entryTime, setEntryTime] = useState<string>('');
  const [exitTime, setExitTime] = useState<string>('');
  const [timeframe, setTimeframe] = useState('5m');
  const [setup, setSetup] = useState('');
  const [position, setPosition] = useState<PositionType>('Long');
  const [positionSize, setPositionSize] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');

  // Manual P&L override
  const [isManualPnl, setIsManualPnl] = useState(false);
  const [manualPnl, setManualPnl] = useState<string>('');

  // Notes: ONLY ONE writing section
  const [notes, setNotes] = useState('');

  // Images state
  const [images, setImages] = useState<string[]>([]);
  type ImageUploadState = 'idle' | 'selecting' | 'compressing' | 'ready' | 'error';
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Validation errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tradeToEdit) {
      setSymbol(tradeToEdit.symbol);
      setMarket(tradeToEdit.market);
      setDate(tradeToEdit.date);
      setEntryTime(tradeToEdit.entryTime || '');
      setExitTime(tradeToEdit.exitTime || '');
      setTimeframe(tradeToEdit.timeframe || '5m');
      setSetup(tradeToEdit.setup || '');
      setPosition(tradeToEdit.position);
      setPositionSize(String(tradeToEdit.positionSize));
      setEntryPrice(String(tradeToEdit.entryPrice));
      setExitPrice(String(tradeToEdit.exitPrice));
      setStopLoss(tradeToEdit.stopLoss !== null && tradeToEdit.stopLoss !== undefined ? String(tradeToEdit.stopLoss) : '');
      setIsManualPnl(Boolean(tradeToEdit.isManualPnl));
      setManualPnl(String(tradeToEdit.pnl));
      setNotes(tradeToEdit.notes || '');
      setImages(tradeToEdit.images || []);
    } else {
      // Reset form
      setSymbol('');
      setMarket('Indian Stocks');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setEntryTime('');
      setExitTime('');
      setTimeframe('5m');
      setSetup('');
      setPosition('Long');
      setPositionSize('1');
      setEntryPrice('');
      setExitPrice('');
      setStopLoss('');
      setIsManualPnl(false);
      setManualPnl('');
      setNotes('');
      setImages([]);
    }
    setImageUploadState('idle');
    setErrorMessage(null);
  }, [tradeToEdit, isOpen, initialDate]);

  if (!isOpen) return null;

  // Numeric parsing
  const numEntry = parseFloat(entryPrice);
  const numExit = parseFloat(exitPrice);
  const numSize = parseFloat(positionSize);
  const numSL = stopLoss ? parseFloat(stopLoss) : null;

  // Computed P&L
  const autoPnl = calculatePnl(position, numEntry, numExit, numSize);
  const effectivePnl = isManualPnl ? (parseFloat(manualPnl) || 0) : autoPnl;

  // Computed Risk:Reward
  const calculatedRR = calculateRiskReward(position, numEntry, numExit, numSL);

  const handleTriggerSelect = () => {
    setImageUploadState('selecting');
    fileInputRef.current?.click();
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setImageUploadState('idle');
      return;
    }

    setImageUploadState('compressing');
    setErrorMessage(null);

    try {
      const processedImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Validate file format: JPG, JPEG, PNG, WEBP
        if (!isValidImageFile(file)) {
          setErrorMessage(`"${file.name}" is not supported. Please select JPG, PNG, or WEBP images.`);
          continue;
        }

        // 2. Perform timeout-guarded compression (falls back to original if compression fails or times out)
        try {
          const result = await optimizeImage(file, 1600, 1600, 0.82, 2500);
          if (result) {
            processedImages.push(result);
          } else {
            const fallback = await readFileAsDataURL(file);
            if (fallback) processedImages.push(fallback);
          }
        } catch (compErr) {
          console.warn('Compression error for', file.name, compErr);
          const fallback = await readFileAsDataURL(file);
          if (fallback) processedImages.push(fallback);
        }
      }

      if (processedImages.length > 0) {
        setImages((prev) => [...prev, ...processedImages]);
        setImageUploadState('ready');
      } else {
        setImageUploadState('idle');
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      setErrorMessage('Could not process selected image. Please try again.');
      setImageUploadState('error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        setImageUploadState((curr) => (curr === 'ready' || curr === 'compressing' ? 'idle' : curr));
      }, 1200);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorMessage(null);

    // Validation
    if (!symbol.trim()) {
      setErrorMessage('Please enter a symbol or instrument name (e.g. NIFTY, BTC, RELIANCE).');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a trade date.');
      return;
    }
    if (isNaN(numEntry) || numEntry <= 0) {
      setErrorMessage('Please enter a valid entry price greater than 0.');
      return;
    }
    if (isNaN(numExit) || numExit <= 0) {
      setErrorMessage('Please enter a valid exit price greater than 0.');
      return;
    }
    if (isNaN(numSize) || numSize <= 0) {
      setErrorMessage('Please enter a valid position/lot size greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      const tradeData: Trade = {
        id: tradeToEdit ? tradeToEdit.id : `trade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        symbol: symbol.trim().toUpperCase(),
        market,
        date,
        entryTime: entryTime.trim() ? entryTime.trim() : null,
        exitTime: exitTime.trim() ? exitTime.trim() : null,
        timeframe,
        setup: setup.trim(),
        position,
        positionSize: numSize,
        entryPrice: numEntry,
        exitPrice: numExit,
        stopLoss: numSL,
        pnl: effectivePnl,
        isManualPnl,
        riskReward: calculatedRR,
        notes: notes.trim(),
        images,
        createdAt: tradeToEdit ? tradeToEdit.createdAt : Date.now(),
        updatedAt: Date.now(),
        userId: userId || undefined,
      };

      await onSave(tradeData);
      onClose();
    } catch {
      setErrorMessage('Failed to save trade to journal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-2xl bg-[#0c0e12] border border-[#1e232b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b1f27] bg-[#0c0e12] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#141820] border border-[#232934] flex items-center justify-center">
              <img src="/logo.svg" alt="logo" className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {tradeToEdit ? 'Edit Trade' : 'Record New Trade'}
              </h2>
              <p className="text-[11px] text-gray-400">Personal Trading Journal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#181c24] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF334B]/10 border border-[#FF334B]/30 text-[#FF334B] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Market Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Market
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MARKETS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition ${
                    market === m
                      ? 'bg-[#151921] border-[#00E676] text-white shadow-xs'
                      : 'bg-[#101217] border-[#1e232b] text-gray-400 hover:text-gray-200 hover:border-[#2a313d]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Symbol & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Symbol / Instrument *
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. NIFTY 24500 CE, RELIANCE, BTC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-medium"
                required
              />
            </div>
          </div>

          {/* Entry Time & Exit Time (Optional 12-hour format) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Time12Select
              label="Entry Time"
              value={entryTime}
              onChange={setEntryTime}
            />
            <Time12Select
              label="Exit Time"
              value={exitTime}
              onChange={setExitTime}
            />
          </div>

          {/* 3. Position (Long / Short) & Timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Position Direction *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('Long')}
                  className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    position === 'Long'
                      ? 'bg-[#00E676]/15 border-[#00E676] text-[#00E676]'
                      : 'bg-[#101217] border-[#1e232b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#00E676]" />
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('Short')}
                  className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition flex items-center justify-center gap-1.5 ${
                    position === 'Short'
                      ? 'bg-[#FF334B]/15 border-[#FF334B] text-[#FF334B]'
                      : 'bg-[#101217] border-[#1e232b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF334B]" />
                  SHORT
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Timeframe
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map((tf) => (
                  <button
                    type="button"
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      timeframe === tf
                        ? 'bg-[#171b23] border-[#00E676] text-white'
                        : 'bg-[#101217] border-[#1e232b] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Setup */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Trading Setup
            </label>
            <input
              type="text"
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
              placeholder="e.g. Breakout + Retest, Support rejection, EMA crossover"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676]"
            />
            {/* Setup Suggestion Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SETUP_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSetup(s)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#13161c] text-gray-400 hover:text-gray-200 border border-[#1e232b] transition"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Trade Numbers: Size, Entry, Exit, Stop Loss */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Execution Numbers
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Position / Lot Size *
                </label>
                <input
                  type="number"
                  step="any"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0c10] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Entry Price *
                </label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0c10] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Exit Price *
                </label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="e.g. 125"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0c10] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Stop Loss (Optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0c10] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] font-mono"
                />
              </div>
            </div>

            {/* Calculations & Overrides Banner */}
            <div className="pt-2 border-t border-[#1b1f27] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                    Calculated P&L
                  </span>
                  <span
                    className={`font-mono font-bold text-base ${
                      effectivePnl >= 0 ? 'text-[#00E676]' : 'text-[#FF334B]'
                    }`}
                  >
                    {formatCurrency(effectivePnl, currency)}
                  </span>
                </div>

                {calculatedRR !== null && (
                  <div className="border-l border-[#222730] pl-4">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Risk : Reward
                    </span>
                    <span className="font-mono font-bold text-base text-white">
                      1 : {calculatedRR}
                    </span>
                  </div>
                )}
              </div>

              {/* Manual Override switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isManualPnl;
                    setIsManualPnl(next);
                    if (next && !manualPnl) {
                      setManualPnl(String(autoPnl));
                    }
                  }}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                    isManualPnl
                      ? 'bg-[#1b212a] border-[#00E676] text-[#00E676]'
                      : 'bg-[#0a0c10] border-[#1e232b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {isManualPnl ? 'Manual P&L Mode' : 'Override P&L manually'}
                </button>

                {isManualPnl && (
                  <input
                    type="number"
                    step="any"
                    value={manualPnl}
                    onChange={(e) => setManualPnl(e.target.value)}
                    placeholder="P&L"
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0a0c10] border border-[#00E676] text-white text-xs font-mono focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 6. ABOUT THIS TRADE (ONLY ONE WRITING SECTION!) */}
          <div>
            <div className="mb-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                About This Trade
              </label>
              <p className="text-[11px] text-gray-400">
                What did I understand from this trade?
              </p>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did I understand from this trade? Why did I enter, what happened, mistakes made, what went well, or what to change next time..."
              className="w-full px-3.5 py-3 rounded-xl bg-[#101217] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 leading-relaxed resize-y min-h-[90px]"
            />
          </div>

          {/* 7. TRADE IMAGES SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Trade Images
                </label>
                <p className="text-[11px] text-gray-400">
                  TradingView screenshots, entry chart, exit chart
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerSelect}
                disabled={imageUploadState === 'compressing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151922] border border-[#232935] hover:border-[#00E676] text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-[#00E676]" />
                <span>
                  {imageUploadState === 'selecting' && 'Selecting...'}
                  {imageUploadState === 'compressing' && 'Compressing...'}
                  {imageUploadState === 'ready' && 'Ready ✓'}
                  {imageUploadState === 'error' && 'Try Again'}
                  {imageUploadState === 'idle' && 'Upload Image'}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)}
              />
            </div>

            {/* Images Grid or Empty upload prompt */}
            {images.length === 0 ? (
              <div
                onClick={handleTriggerSelect}
                className="border-2 border-dashed border-[#1f2530] hover:border-[#2f3847] rounded-2xl p-6 text-center cursor-pointer transition bg-[#0e1015]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#161a22] flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-semibold text-gray-300">
                  {imageUploadState === 'compressing'
                    ? 'Compressing image...'
                    : imageUploadState === 'selecting'
                    ? 'Selecting image...'
                    : 'Tap to upload chart screenshot'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Supports multiple JPG, PNG, WEBP • Fast preview
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-[#222730] aspect-video bg-black"
                  >
                    <img
                      src={img}
                      alt={`Trade screenshot ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="p-1.5 rounded-lg bg-[#1a1f29] text-white hover:text-[#00E676] transition"
                        title="View Full"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-[#1a1f29] text-white hover:text-[#FF334B] transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-[#1b1f27] bg-[#0c0e12] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#222730] text-gray-300 text-sm font-semibold hover:bg-[#15181f] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || imageUploadState === 'compressing'}
            className="flex-2 py-3 rounded-xl bg-[#00E676] text-black text-sm font-bold shadow-lg shadow-[#00E676]/20 hover:bg-[#2bfb8d] transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{tradeToEdit ? 'Update Trade' : 'Save Trade'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
