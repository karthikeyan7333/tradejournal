export type MarketType =
  | 'Indian Stocks'
  | 'Indian Options'
  | 'Crypto'
  | 'Forex'
  | 'Other';

export type PositionType = 'Long' | 'Short';

export interface Trade {
  id: string;
  userId?: string;
  symbol: string;
  market: MarketType;
  date: string; // YYYY-MM-DD
  entryTime?: string | null; // HH:MM AM/PM
  exitTime?: string | null; // HH:MM AM/PM
  timeframe: string; // e.g. "5m", "15m", "1h", "1D"
  setup: string; // e.g. "Breakout + Retest"
  position: PositionType;
  positionSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number | null;
  pnl: number;
  isManualPnl?: boolean;
  riskReward?: number | null;
  notes: string; // "About This Trade"
  images: string[]; // Base64 data URLs
  createdAt: number;
  updatedAt: number;
}

export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface UserSettings {
  currency: CurrencyType;
}

export interface DayPerformance {
  date: string;
  pnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  trades: Trade[];
}
