import { Trade, UserSettings } from '../types/trade';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const DB_NAME = 'TradeJournalDB';
const DB_VERSION = 1;
const STORE_NAME = 'trades';
const SETTINGS_KEY = 'tradejournal_settings';

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
};

// Open IndexedDB with connection caching and timeout guard
let dbInstancePromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      dbInstancePromise = null;
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const timer = setTimeout(() => {
      dbInstancePromise = null;
      reject(new Error('IndexedDB open timed out'));
    }, 1500);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('market', 'market', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        const database = request.result;
        database.onclose = () => {
          dbInstancePromise = null;
        };
        database.onversionchange = () => {
          database.close();
          dbInstancePromise = null;
        };
        resolve(database);
      };

      request.onerror = () => {
        clearTimeout(timer);
        dbInstancePromise = null;
        reject(request.error);
      };

      request.onblocked = () => {
        clearTimeout(timer);
        dbInstancePromise = null;
        reject(new Error('IndexedDB open blocked'));
      };
    } catch (err) {
      clearTimeout(timer);
      dbInstancePromise = null;
      reject(err);
    }
  });

  return dbInstancePromise;
}

// Fallback to localStorage if IndexedDB is unavailable
function getLocalStorageTrades(): Trade[] {
  try {
    const raw = localStorage.getItem('tradejournal_backup_trades');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Local IndexedDB operations
export async function getLocalTrades(): Promise<Trade[]> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = (request.result || []) as Trade[];
        result.sort((a, b) => {
          if (b.date !== a.date) {
            return b.date.localeCompare(a.date);
          }
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB failed, falling back to localStorage', err);
    return getLocalStorageTrades();
  }
}

export async function saveLocalTrade(trade: Trade): Promise<Trade> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(trade);

      request.onsuccess = () => resolve(trade);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Local save failed', err);
    return trade;
  }
}

// Single-transaction batch write for local storage
export async function saveLocalTradesBatch(trades: Trade[]): Promise<void> {
  if (!trades || trades.length === 0) return;
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const t of trades) {
        store.put(t);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Batch local save failed', err);
  }
}

export async function deleteLocalTrade(id: string): Promise<void> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Local delete failed', err);
  }
}

export async function clearAllLocalTrades(): Promise<void> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        localStorage.removeItem('tradejournal_backup_trades');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Local clear failed', err);
  }
}

// Convert trade to clean object without undefined values for Firestore
function sanitizeTradeForFirestore(trade: Trade, userId: string) {
  return {
    id: trade.id,
    userId,
    symbol: trade.symbol || '',
    market: trade.market || 'Indian Stocks',
    date: trade.date || new Date().toISOString().slice(0, 10),
    entryTime: trade.entryTime || null,
    exitTime: trade.exitTime || null,
    timeframe: trade.timeframe || '',
    setup: trade.setup || '',
    position: trade.position || 'Long',
    positionSize: Number(trade.positionSize) || 0,
    entryPrice: Number(trade.entryPrice) || 0,
    exitPrice: Number(trade.exitPrice) || 0,
    stopLoss: trade.stopLoss !== undefined && trade.stopLoss !== null ? Number(trade.stopLoss) : null,
    pnl: Number(trade.pnl) || 0,
    isManualPnl: Boolean(trade.isManualPnl),
    riskReward: trade.riskReward !== undefined && trade.riskReward !== null ? Number(trade.riskReward) : null,
    notes: trade.notes || '',
    images: Array.isArray(trade.images) ? trade.images : [],
    createdAt: trade.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

// Cloud Firestore Trade Operations
export async function saveTrade(trade: Trade, userId?: string | null): Promise<Trade> {
  // Start local save concurrently
  const localPromise = saveLocalTrade(trade);

  if (userId) {
    const path = `users/${userId}/trades/${trade.id}`;
    try {
      const sanitized = sanitizeTradeForFirestore(trade, userId);
      const cloudPromise = setDoc(doc(db, 'users', userId, 'trades', trade.id), sanitized);
      // Concurrently wait for local cache and cloud persistence
      await Promise.all([localPromise, cloudPromise]);
    } catch (error) {
      await localPromise.catch(() => {});
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    await localPromise;
  }

  return trade;
}

export async function deleteTrade(id: string, userId?: string | null): Promise<void> {
  const localPromise = deleteLocalTrade(id);

  if (userId) {
    const path = `users/${userId}/trades/${id}`;
    try {
      const cloudPromise = deleteDoc(doc(db, 'users', userId, 'trades', id));
      await Promise.all([localPromise, cloudPromise]);
    } catch (error) {
      await localPromise.catch(() => {});
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    await localPromise;
  }
}

export async function getTrades(userId?: string | null): Promise<Trade[]> {
  if (!userId) {
    return getLocalTrades();
  }

  const path = `users/${userId}/trades`;
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'trades'));
    const trades: Trade[] = [];
    snapshot.forEach((d) => {
      trades.push(d.data() as Trade);
    });

    trades.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Update local cache in single efficient batch transaction
    await saveLocalTradesBatch(trades);

    return trades;
  } catch (error) {
    console.warn('Cloud fetch failed, using local cache:', error);
    return getLocalTrades();
  }
}

// Real-time Cloud Synchronization Listener
export function subscribeToUserTrades(
  userId: string,
  onTradesUpdated: (trades: Trade[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/trades`;
  const unsubscribe = onSnapshot(
    collection(db, 'users', userId, 'trades'),
    (snapshot) => {
      const trades: Trade[] = [];
      snapshot.forEach((d) => {
        trades.push(d.data() as Trade);
      });

      trades.sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      // Update local storage efficiently: write only modified or added documents in a single transaction
      const docChanges = snapshot.docChanges();
      if (docChanges.length > 0) {
        const changedTrades: Trade[] = [];
        for (const change of docChanges) {
          if (change.type === 'added' || change.type === 'modified') {
            changedTrades.push(change.doc.data() as Trade);
          } else if (change.type === 'removed') {
            deleteLocalTrade(change.doc.id);
          }
        }
        if (changedTrades.length > 0) {
          saveLocalTradesBatch(changedTrades);
        }
      }

      onTradesUpdated(trades);
    },
    (error) => {
      console.error('Firestore snapshot subscription error:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export async function clearAllTrades(userId?: string | null): Promise<void> {
  await clearAllLocalTrades();

  if (userId) {
    const path = `users/${userId}/trades`;
    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'trades'));
      const batchPromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(batchPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings, userId?: string | null): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (userId) {
      const path = `users/${userId}/settings/preferences`;
      try {
        await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
          ...settings,
          updatedAt: Date.now(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function exportAllData(userId?: string | null): Promise<string> {
  const trades = await getTrades(userId);
  const settings = getSettings();
  const exportPayload = {
    appName: 'TradeJournal',
    exportedAt: new Date().toISOString(),
    version: 1,
    settings,
    trades,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function exportCSV(userId?: string | null): Promise<string> {
  const trades = await getTrades(userId);
  const headers = [
    'Date',
    'Entry Time',
    'Exit Time',
    'Symbol',
    'Market',
    'Position',
    'Timeframe',
    'Setup',
    'Position Size',
    'Entry Price',
    'Exit Price',
    'Stop Loss',
    'P&L',
    'Risk:Reward',
    'Notes',
  ];

  const escapeCSV = (val: unknown) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = trades.map((t) => [
    escapeCSV(t.date),
    escapeCSV(t.entryTime ?? ''),
    escapeCSV(t.exitTime ?? ''),
    escapeCSV(t.symbol),
    escapeCSV(t.market),
    escapeCSV(t.position),
    escapeCSV(t.timeframe),
    escapeCSV(t.setup),
    t.positionSize,
    t.entryPrice,
    t.exitPrice,
    t.stopLoss ?? '',
    t.pnl,
    t.riskReward ? `1:${t.riskReward}` : '',
    escapeCSV(t.notes),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function importData(jsonString: string, userId?: string | null): Promise<{ count: number }> {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.trades)) {
    throw new Error('Invalid TradeJournal backup file');
  }

  const trades = parsed.trades as Trade[];
  let saved = 0;

  for (const t of trades) {
    if (t.id && t.symbol && t.date) {
      await saveTrade(t, userId);
      saved++;
    }
  }

  if (parsed.settings) {
    await saveSettings(parsed.settings, userId);
  }

  return { count: saved };
}
