import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Settings as SettingsIcon, User as UserIcon, Cloud, CloudOff } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  onOpenSettings: () => void;
  onNavigateHome: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onNavigateHome,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#08090b]/95 backdrop-blur-md border-b border-[#1b1f26] px-4 py-3 select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left focus:outline-none group active:scale-98 transition"
        >
          <img
            src="/logo.svg"
            alt="TradeJournal Logo"
            className="w-8 h-8 rounded-lg shadow-sm border border-[#222730]"
          />
          <div>
            <div className="flex items-center text-base font-extrabold tracking-wider leading-none">
              <span className="text-white">TRADE</span>
              <span className="text-[#00E676]">JOURNAL</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">
              Personal Trading Journal
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Cloud Sync / Account Button */}
          {currentUser ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#12151b] border border-[#202530] hover:border-[#00E676] transition text-xs font-semibold text-gray-300"
              title={`Logged in as ${currentUser.email} • Cloud Sync Active`}
            >
              <Cloud className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="max-w-[100px] truncate text-[11px] hidden sm:inline text-white">
                {currentUser.email?.split('@')[0]}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#12151b] border border-[#202530] hover:border-[#00E676] text-xs font-semibold text-gray-300 hover:text-white transition active:scale-95"
              title="Log In to Sync Data"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="text-[11px]">Log In</span>
            </button>
          )}

          <PWAInstallButton />

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#15181f] border border-transparent hover:border-[#222730] transition active:scale-95"
            aria-label="Settings"
            title="Settings & Backup"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
