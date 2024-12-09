export interface KiteCredentials {
  apiKey: string;
  apiSecret: string;
  requestToken?: string;
  accessToken?: string;
}

export interface StockQuote {
  symbol: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  quantity: number;
  reason: string;
}

export interface Order {
  orderId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  instrumentToken: number;
}

export interface TradingSession {
  symbol: string;
  isActive: boolean;
  lastUpdate: Date;
  currentPosition: 'LONG' | 'SHORT' | 'NONE';
  entryPrice: number | null;
  strategy?: string;
  performance?: number;
}