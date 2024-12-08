import { StockQuote, TradingDecision } from '../types/kite.ts';

export interface StrategyConfig {
  targetProfit: number;
  stopLoss: number;
  timeframe: number;
  volumeThreshold: number;
}

export abstract class BaseStrategy {
  protected entryPrice: number | null = null;
  protected position: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  protected lastSignalTime: number = 0;

  constructor(protected config: StrategyConfig) {}

  abstract analyze(
    quote: StockQuote,
    historicalData: StockQuote[],
    balance: number
  ): TradingDecision;

  protected shouldSkipAnalysis(): boolean {
    const timeSinceLastSignal = Date.now() - this.lastSignalTime;
    return timeSinceLastSignal < this.config.timeframe * 1000;
  }

  protected createDecision(
    action: 'BUY' | 'SELL' | 'HOLD',
    price: number,
    quantity: number,
    reason: string
  ): TradingDecision {
    if (action !== 'HOLD') {
      this.lastSignalTime = Date.now();
    }
    return { action, price, quantity, reason };
  }
}