import { StockQuote } from '../types/kite.ts';

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  quantity: number;
  timestamp?: number;
}

export class TradingStrategy {
  private entryPrice: number | null = null;
  private targetProfit = 0.30; // 30% profit target
  private stopLoss = 0.10; // 10% stop loss
  private position: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
  private lastSignal: TradeSignal | null = null;

  analyzeMarket(quote: StockQuote, balance: number): TradeSignal {
    const currentPrice = quote.lastPrice;
    
    // Prevent multiple signals in short succession
    if (this.lastSignal && Date.now() - this.lastSignal.timestamp < 5 * 60 * 1000) {
      return { action: 'HOLD', price: currentPrice, quantity: 0 };
    }

    if (this.position === 'NONE') {
      // Look for entry opportunities
      if (this.isGoodEntryPoint(quote)) {
        const quantity = Math.floor(balance / currentPrice);
        this.entryPrice = currentPrice;
        this.position = 'LONG';
        return this.createSignal('BUY', currentPrice, quantity);
      }
    } else if (this.position === 'LONG' && this.entryPrice) {
      // Check for profit target or stop loss
      const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice;
      
      if (profitPercent >= this.targetProfit) {
        // Take profit
        const quantity = Math.floor(balance / currentPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createSignal('SELL', currentPrice, quantity);
      }

      if (profitPercent <= -this.stopLoss) {
        // Stop loss hit
        const quantity = Math.floor(balance / currentPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createSignal('SELL', currentPrice, quantity);
      }
    }

    return { action: 'HOLD', price: currentPrice, quantity: 0 };
  }

  private isGoodEntryPoint(quote: StockQuote): boolean {
    // Entry conditions:
    // 1. Price is near day's low (within 5%)
    // 2. Volume is above average
    // 3. Price is showing some recovery (positive change)
    
    const nearDayLow = quote.lastPrice <= quote.low * 1.05;
    const highVolume = quote.volume > quote.volume * 1.2; // 20% above average
    const positiveChange = quote.change > 0;

    return nearDayLow && highVolume && positiveChange;
  }

  private createSignal(action: 'BUY' | 'SELL', price: number, quantity: number): TradeSignal {
    this.lastSignal = {
      action,
      price,
      quantity,
      timestamp: Date.now(),
    };
    return this.lastSignal;
  }
}