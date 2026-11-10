import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trade, UserSettings } from './types/trade';
import {
  getTrades,
  saveTrade,
  deleteTrade,
  getSettings,
  saveSettings,
  subscribeToUserTrades,
  getLocalTrades,
} from './services/storage';
import { subscribeToAuth, logOut } from './services/auth';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { DashboardView } from './components/DashboardView';
import { TradesListView } from './components/TradesListView';
import { CalendarView } from './components/CalendarView';
import { AddTradeModal } from './components/AddTradeModal';
import { TradeDetailsModal } from './components/TradeDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [tradeForDetails, setTradeForDetails] = useState<Trade | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialDateForAdd, setInitialDateForAdd] = useState<string | undefined>(undefined);

  const unsubscribeTradesRef = useRef<(() => void) | null>(null);

  // Load trades data
  const loadTradesData = useCallback(async (userId?: string | null) => {
    try {
      setIsLoadingTrades(true);
      const data = await getTrades(userId);
      setTrades(data);
    } catch (err) {
      console.error('Error loading trades:', err);
    } finally {
      setIsLoadingTrades(false);
    }
  }, []);

  // Auth state listener and cloud synchronization setup
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure app never hangs on loading screen
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsAuthChecking(false);
      }
    }, 2000);

    // Read stored settings immediately
    const storedSettings = getSettings();
    setSettings(storedSettings);

    // Instantly load local trades from cache so user sees data immediately without waiting
    getLocalTrades()
      .then((local) => {
        if (isMounted && local && local.length > 0) {
          setTrades(local);
        }
      })
      .catch((err) => {
        console.warn('Fast local trade cache load notice:', err);
      });

    const unsubAuth = subscribeToAuth((user) => {
      if (!isMounted) return;
      clearTimeout(safetyTimer);
      setCurrentUser(user);

      // Clean up previous trade subscription
      if (unsubscribeTradesRef.current) {
        unsubscribeTradesRef.current();
        unsubscribeTradesRef.current = null;
      }

      if (user) {
        setIsLocalMode(false);
        setIsLoadingTrades(true);

        // Set up real-time sync with cloud Firestore for this user
        unsubscribeTradesRef.current = subscribeToUserTrades(
          user.uid,
          (cloudTrades) => {
            if (!isMounted) return;
            setTrades(cloudTrades);
            setIsLoadingTrades(false);
          },
          (err) => {
            console.warn('Real-time sync issue, falling back to local:', err);
            if (!isMounted) return;
            getLocalTrades().then((local) => {
              if (isMounted) {
                setTrades(local);
                setIsLoadingTrades(false);
              }
            });
          }
        );

        // Non-blocking background migration: check if there are unsynced local trades created without an account
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            const localTrades = await getLocalTrades();
            const unsyncedTrades = localTrades.filter((lt) => !lt.userId);
            for (const lt of unsyncedTrades) {
              await saveTrade({ ...lt, userId: user.uid }, user.uid);
            }
          } catch (migErr) {
            console.warn('Background local migration notice:', migErr);
          }
        }, 1000);
      } else {
        // Logged out: load from local cache
        getLocalTrades().then((local) => {
          if (isMounted) {
            setTrades(local);
            setIsLoadingTrades(false);
          }
        });
      }

      // Immediately resolve auth checking state - do not block UI
      setIsAuthChecking(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubAuth();
      if (unsubscribeTradesRef.current) {
        unsubscribeTradesRef.current();
      }
    };
  }, []);

  const handleSaveTrade = async (trade: Trade) => {
    const updatedTrade = {
      ...trade,
      userId: currentUser?.uid,
    };
    await saveTrade(updatedTrade, currentUser?.uid);
    // If offline/guest mode (no cloud snapshot listener), update state directly without full re-fetch
    if (!currentUser) {
      setTrades((prev) => {
        const index = prev.findIndex((t) => t.id === updatedTrade.id);
        const updated = index >= 0 ? prev.map((t, i) => (i === index ? updatedTrade : t)) : [updatedTrade, ...prev];
        return updated.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      });
    }
    // If the saved trade was currently open in details, update details
    if (tradeForDetails && tradeForDetails.id === trade.id) {
      setTradeForDetails(updatedTrade);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    await deleteTrade(tradeId, currentUser?.uid);
    if (!currentUser) {
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    }
    if (tradeForDetails && tradeForDetails.id === tradeId) {
      setTradeForDetails(null);
    }
  };

  const handleOpenAddTrade = (customDate?: string) => {
    setTradeToEdit(null);
    setInitialDateForAdd(customDate);
    setIsAddModalOpen(true);
  };

  const handleOpenEditTrade = (trade: Trade) => {
    setTradeForDetails(null);
    setTradeToEdit(trade);
    setIsAddModalOpen(true);
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings, currentUser?.uid);
  };

  const handleLogOut = async () => {
    if (unsubscribeTradesRef.current) {
      unsubscribeTradesRef.current();
      unsubscribeTradesRef.current = null;
    }
    await logOut();
    setCurrentUser(null);
    setIsLocalMode(false);
  };

  // 1. Initial authentication session detection loader
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#08090b] flex flex-col items-center justify-center p-4 select-none">
        <div className="relative animate-pulse flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#141820] border border-[#232934] flex items-center justify-center p-2 mb-4 shadow-2xl">
            <img src="/logo.svg" alt="TradeJournal" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center text-lg font-black tracking-widest leading-none">
            <span className="text-white">TRADE</span>
            <span className="text-[#00E676]">JOURNAL</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-mono">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: show Login / Create Account Screen
  if (!currentUser && !isLocalMode) {
    return (
      <AuthScreen
        onContinueOffline={() => setIsLocalMode(true)}
        hasLocalTrades={trades.length > 0}
      />
    );
  }

  // 3. Authenticated user (or offline local mode): Show Full TradeJournal Application
  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6] flex flex-col selection:bg-[#00E676]/30">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNavigateHome={() => setCurrentTab('dashboard')}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'dashboard' && (
          <DashboardView
            trades={trades}
            currency={settings.currency}
            onOpenAddTrade={() => handleOpenAddTrade()}
            onSelectTrade={(trade) => setTradeForDetails(trade)}
            onViewAllTrades={() => setCurrentTab('trades')}
          />
        )}

        {currentTab === 'trades' && (
          <TradesListView
            trades={trades}
            currency={settings.currency}
            onSelectTrade={(trade) => setTradeForDetails(trade)}
            onOpenAddTrade={() => handleOpenAddTrade()}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            trades={trades}
            currency={settings.currency}
            onSelectTrade={(trade) => setTradeForDetails(trade)}
            onAddTradeOnDate={(dateStr) => handleOpenAddTrade(dateStr)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddTrade={() => handleOpenAddTrade()}
      />

      {/* Add / Edit Trade Modal */}
      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTradeToEdit(null);
          setInitialDateForAdd(undefined);
        }}
        onSave={handleSaveTrade}
        tradeToEdit={tradeToEdit}
        currency={settings.currency}
        initialDate={initialDateForAdd}
        userId={currentUser?.uid}
      />

      {/* Trade Details Modal */}
      <TradeDetailsModal
        trade={tradeForDetails}
        onClose={() => setTradeForDetails(null)}
        onEdit={(trade) => handleOpenEditTrade(trade)}
        onDelete={handleDeleteTrade}
        currency={settings.currency}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onDataChanged={() => loadTradesData(currentUser?.uid)}
        tradeCount={trades.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogOut={handleLogOut}
      />

      {/* Auth Modal for re-authenticating from within settings or header */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
