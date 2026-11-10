import { Trade, CurrencyType, DayPerformance } from '../types/trade';

export function calculatePnl(
  position: 'Long' | 'Short',
  entry: number,
  exit: number,
  size: number
): number {
  if (isNaN(entry) || isNaN(exit) || isNaN(size) || size <= 0) {
    return 0;
  }
  let diff = 0;
  if (position === 'Long') {
    diff = exit - entry;
  } else {
    diff = entry - exit;
  }
  const result = diff * size;
  return Math.round(result * 100) / 100;
}

export function calculateRiskReward(
  position: 'Long' | 'Short',
  entry: number,
  exit: number,
  stopLoss: number | null | undefined
): number | null {
  if (
    stopLoss === null ||
    stopLoss === undefined ||
    isNaN(stopLoss) ||
    isNaN(entry) ||
    isNaN(exit) ||
    entry <= 0 ||
    exit <= 0 ||
    stopLoss <= 0
  ) {
    return null;
  }

  let risk = 0;
  let reward = 0;

  if (position === 'Long') {
    risk = entry - stopLoss;
    reward = exit - entry;
  } else {
    risk = stopLoss - entry;
    reward = entry - exit;
  }

  if (risk <= 0 || reward <= 0) {
    return null;
  }

  const ratio = reward / risk;
  return Math.round(ratio * 100) / 100;
}

export function formatCurrency(amount: number, currency: CurrencyType = 'INR'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let symbol = '₹';
  if (currency === 'USD') symbol = '$';
  else if (currency === 'EUR') symbol = '€';
  else if (currency === 'GBP') symbol = '£';

  // Format with Indian or International numbering
  const formattedNumber = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: Number.isInteger(absAmount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  if (amount === 0) {
    return `${symbol}0`;
  }

  return `${isNegative ? '-' : '+'}${symbol}${formattedNumber}`;
}

export function formatCurrencyNeutral(amount: number, currency: CurrencyType = 'INR'): string {
  let symbol = '₹';
  if (currency === 'USD') symbol = '$';
  else if (currency === 'EUR') symbol = '€';
  else if (currency === 'GBP') symbol = '£';

  const formattedNumber = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: Number.isInteger(Math.abs(amount)) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `${amount < 0 ? '-' : ''}${symbol}${formattedNumber}`;
}

export interface DashboardStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakEvenCount: number;
  winRate: number; // 0 to 100
  totalProfit: number;
  totalLoss: number; // positive number representing total lost
  netPnl: number;
}

export function computeDashboardStats(trades: Trade[]): DashboardStats {
  let totalProfit = 0;
  let totalLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakEvenCount = 0;

  for (const t of trades) {
    if (t.pnl > 0) {
      totalProfit += t.pnl;
      winCount++;
    } else if (t.pnl < 0) {
      totalLoss += Math.abs(t.pnl);
      lossCount++;
    } else {
      breakEvenCount++;
    }
  }

  const netPnl = totalProfit - totalLoss;
  const totalDecided = winCount + lossCount;
  const winRate = totalDecided > 0 ? (winCount / totalDecided) * 100 : 0;

  return {
    totalTrades: trades.length,
    winCount,
    lossCount,
    breakEvenCount,
    winRate: Math.round(winRate * 10) / 10,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netPnl: Math.round(netPnl * 100) / 100,
  };
}

export interface CumulativePnlPoint {
  index: number;
  date: string;
  symbol: string;
  pnl: number;
  cumulativePnl: number;
}

export function computeCumulativePnl(trades: Trade[]): CumulativePnlPoint[] {
  if (trades.length === 0) return [];

  // Sort trades chronologically (oldest first)
  const sorted = [...trades].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let runningPnl = 0;
  const points: CumulativePnlPoint[] = [];

  // Initial zero point before first trade
  points.push({
    index: 0,
    date: sorted[0].date,
    symbol: 'Start',
    pnl: 0,
    cumulativePnl: 0,
  });

  sorted.forEach((t, i) => {
    runningPnl += t.pnl;
    points.push({
      index: i + 1,
      date: t.date,
      symbol: t.symbol,
      pnl: t.pnl,
      cumulativePnl: Math.round(runningPnl * 100) / 100,
    });
  });

  return points;
}

export function groupTradesByDate(trades: Trade[]): Map<string, DayPerformance> {
  const map = new Map<string, DayPerformance>();

  for (const t of trades) {
    const existing = map.get(t.date);
    if (!existing) {
      map.set(t.date, {
        date: t.date,
        pnl: t.pnl,
        tradeCount: 1,
        wins: t.pnl > 0 ? 1 : 0,
        losses: t.pnl < 0 ? 1 : 0,
        trades: [t],
      });
    } else {
      existing.pnl = Math.round((existing.pnl + t.pnl) * 100) / 100;
      existing.tradeCount += 1;
      if (t.pnl > 0) existing.wins += 1;
      else if (t.pnl < 0) existing.losses += 1;
      existing.trades.push(t);
    }
  }

  return map;
}
