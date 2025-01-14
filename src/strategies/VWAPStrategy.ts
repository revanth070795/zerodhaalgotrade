import { BaseStrategy, StrategyConfig } from './BaseStrategy.ts';
import { StockQuote, TradingDecision } from '../types/kite.ts';

export class VWAPStrategy extends BaseStrategy {
  constructor(config: StrategyConfig) {
    super(config);
  }

  analyze(
    quote: StockQuote,
    historicalData: StockQuote[],
    balance: number
  ): TradingDecision {
    if (this.shouldSkipAnalysis()) {
      return this.createDecision('HOLD', quote.last_price, 0, 'Cooling period');
    }

    const vwap = this.calculateVWAP(historicalData);

    if (this.position === 'NONE') {
      // Price below VWAP with high volume - potential buy signal
      if (quote.last_price < vwap * 0.995 && quote.volume > this.config.volumeThreshold) {
        const quantity = Math.floor(balance / quote.last_price);
        this.position = 'LONG';
        this.entryPrice = quote.last_price;
        return this.createDecision(
          'BUY',
          quote.last_price,
          quantity,
          'Price below VWAP with high volume'
        );
      }
    } else if (this.position === 'LONG' && this.entryPrice) {
      const profitPercent = (quote.last_price - this.entryPrice) / this.entryPrice;

      // Take profit
      if (profitPercent >= this.config.targetProfit) {
        const quantity = Math.floor(balance / quote.last_price);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.last_price,
          quantity,
          'Target profit reached'
        );
      }

      // Stop loss
      if (profitPercent <= -this.config.stopLoss) {
        const quantity = Math.floor(balance / quote.last_price);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.last_price,
          quantity,
          'Stop loss triggered'
        );
      }

      // Price above VWAP with declining volume - potential sell signal
      if (quote.last_price > vwap * 1.005 && quote.volume < this.config.volumeThreshold) {
        const quantity = Math.floor(balance / quote.last_price);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.last_price,
          quantity,
          'Price above VWAP with declining volume'
        );
      }
    }

    return this.createDecision('HOLD', quote.last_price, 0, 'No signal');
  }

  private calculateVWAP(data: StockQuote[]): number {
    let cumulativePV = 0;
    let cumulativeVolume = 0;

    data.forEach(quote => {
      const typicalPrice = quote.last_price;
      cumulativePV += typicalPrice * quote.volume;
      cumulativeVolume += quote.volume;
    });

    return cumulativeVolume === 0 ? 0 : cumulativePV / cumulativeVolume;
  }
}