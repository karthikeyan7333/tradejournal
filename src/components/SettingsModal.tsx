import React, { useState, useRef } from 'react';
import { CurrencyType, UserSettings } from '../types/trade';
import { exportAllData, exportCSV, importData, clearAllTrades } from '../services/storage';
import {
  X,
  Download,
  FileSpreadsheet,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  ShieldAlert,
  Cloud,
  CloudOff,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onDataChanged: () => Promise<void>;
  tradeCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogOut: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onDataChanged,
  tradeCount,
  currentUser,
  onOpenAuth,
  onLogOut,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCurrencyChange = async (curr: CurrencyType) => {
    const updated = { ...settings, currency: curr };
    onUpdateSettings(updated);
    setSuccessMsg(`Default currency set to ${curr}`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleExportJSON = async () => {
    try {
      setIsProcessing(true);
      const jsonStr = await exportAllData(currentUser?.uid);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TradeJournal_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Journal JSON backup downloaded successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Failed to export JSON backup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsProcessing(true);
      const csvStr = await exportCSV(currentUser?.uid);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TradeJournal_Trades_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('CSV spreadsheet downloaded successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Failed to export CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const text = await file.text();
      const res = await importData(text, currentUser?.uid);
      await onDataChanged();
      setSuccessMsg(`Successfully restored ${res.count} trades from backup!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Invalid TradeJournal backup file. Please select a valid JSON backup.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    setIsProcessing(true);
    try {
      await clearAllTrades(currentUser?.uid);
      await onDataChanged();
      setShowClearConfirm(false);
      setSuccessMsg('All journal trades have been cleared.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Failed to clear trades');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserLogOut = async () => {
    setIsProcessing(true);
    try {
      await onLogOut();
      setSuccessMsg('Logged out successfully.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {
      setErrorMsg('Failed to log out.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-lg bg-[#0c0e12] border border-[#1e232b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b1f27] bg-[#0c0e12] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="logo" className="w-6 h-6 rounded-md" />
            <div>
              <h2 className="text-base font-bold text-white">Journal Settings</h2>
              <p className="text-[11px] text-gray-400">Account, Sync & Backup</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Notification Messages */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] text-xs font-semibold">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF334B]/10 border border-[#FF334B]/30 text-[#FF334B] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Account & Cloud Synchronization */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Account & Cloud Sync
                </span>
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUser
                      ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {currentUser ? (
                    <>
                      <Cloud className="w-3 h-3" />
                      <span>Live Sync</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3" />
                      <span>Local Only</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0c10] border border-[#1b1f27]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#151922] border border-[#232934] flex items-center justify-center text-[#00E676] flex-shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
                      <p className="text-[10px] text-gray-400">Syncs automatically to phone & laptop</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUserLogOut}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262c36] text-gray-300 hover:text-[#FF334B] hover:border-[#FF334B] text-xs font-semibold transition"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Log in or create an account to access the same journal across both your mobile phone and laptop.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00E676] text-black text-xs font-bold shadow-md hover:bg-[#2bfb8d] transition active:scale-98"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Log In / Create Account</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Currency Selection */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Display Currency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '₹ INR', value: 'INR' as CurrencyType },
                { label: '$ USD', value: 'USD' as CurrencyType },
                { label: '€ EUR', value: 'EUR' as CurrencyType },
                { label: '£ GBP', value: 'GBP' as CurrencyType },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleCurrencyChange(c.value)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                    settings.currency === c.value
                      ? 'bg-[#181c25] border-[#00E676] text-[#00E676]'
                      : 'bg-[#0a0c10] border-[#1e232b] text-gray-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Backup & Export */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Backup & Export
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Export your trade history and screenshots to keep a safe offline backup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* JSON Export */}
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={isProcessing}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0c10] border border-[#1e232b] hover:border-[#00E676] text-left transition group active:scale-98"
              >
                <div className="w-8 h-8 rounded-lg bg-[#151922] border border-[#232934] flex items-center justify-center text-[#00E676] group-hover:bg-[#00E676] group-hover:text-black transition">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Export JSON</span>
                  <span className="text-[10px] text-gray-400">Complete backup + images</span>
                </div>
              </button>

              {/* CSV Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isProcessing}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0c10] border border-[#1e232b] hover:border-[#00E676] text-left transition group active:scale-98"
              >
                <div className="w-8 h-8 rounded-lg bg-[#151922] border border-[#232934] flex items-center justify-center text-[#00E676] group-hover:bg-[#00E676] group-hover:text-black transition">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Export CSV</span>
                  <span className="text-[10px] text-gray-400">Spreadsheet table format</span>
                </div>
              </button>
            </div>

            {/* Import Backup */}
            <div className="pt-2 border-t border-[#1b1f27]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0a0c10] border border-[#1e232b] hover:border-[#00E676] text-xs font-semibold text-gray-300 hover:text-white transition"
              >
                <Upload className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Restore / Import JSON Backup</span>
              </button>
            </div>
          </div>

          {/* 4. Storage Info & Danger Zone */}
          <div className="bg-[#101217] border border-[#1e232b] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Storage Status
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {tradeCount} Trades Saved
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {currentUser
                ? 'Your trades and screenshots are synced securely to your private cloud storage and cached locally for offline access.'
                : "Trades and screenshots are currently stored in this browser's local storage. Log in to sync them to the cloud."}
            </p>

            <div className="pt-2 border-t border-[#1b1f27]">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={isProcessing || tradeCount === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#FF334B] hover:text-[#ff5c6f] disabled:opacity-30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Saved Trades</span>
              </button>
            </div>
          </div>

          {/* App Branding Footnote */}
          <div className="text-center py-2 text-gray-500 text-[11px]">
            <div className="flex items-center justify-center gap-1 text-white font-bold text-xs mb-1">
              <span>TRADE</span>
              <span className="text-[#00E676]">JOURNAL</span>
            </div>
            <p>Personal Trading Journal • Version 1.1 (Cloud Sync)</p>
          </div>
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-[#12151c] border border-[#2a303d] rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-[#FF334B]/15 text-[#FF334B] flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Clear All Trades?</h4>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                This will delete all <strong className="text-white">{tradeCount}</strong> trades and screenshots permanently. Make sure you exported a backup first!
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl border border-[#222730] text-gray-300 text-xs font-semibold hover:bg-[#181c24] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF334B] text-white text-xs font-bold hover:bg-[#e02b40] transition active:scale-95"
                >
                  {isProcessing ? 'Clearing...' : 'Yes, Clear All'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
