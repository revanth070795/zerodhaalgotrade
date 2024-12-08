import { BaseStrategy, StrategyConfig } from './BaseStrategy.ts';
import { StockQuote, TradingDecision } from '../types/kite.ts';

export class MovingAverageStrategy extends BaseStrategy {
  private shortPeriod = 10;
  private longPeriod = 20;

  constructor(config: StrategyConfig) {
    super(config);
  }

  analyze(
    quote: StockQuote,
    historicalData: StockQuote[],
    balance: number
  ): TradingDecision {
    if (this.shouldSkipAnalysis()) {
      return this.createDecision('HOLD', quote.lastPrice, 0, 'Cooling period');
    }

    const shortMA = this.calculateMA(historicalData, this.shortPeriod);
    const longMA = this.calculateMA(historicalData, this.longPeriod);

    if (this.position === 'NONE') {
      // Golden Cross - Short MA crosses above Long MA
      if (shortMA > longMA && quote.volume > this.config.volumeThreshold) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'LONG';
        this.entryPrice = quote.lastPrice;
        return this.createDecision(
          'BUY',
          quote.lastPrice,
          quantity,
          'Golden Cross detected'
        );
      }
    } else if (this.position === 'LONG' && this.entryPrice) {
      const profitPercent = (quote.lastPrice - this.entryPrice) / this.entryPrice;

      // Take profit
      if (profitPercent >= this.config.targetProfit) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.lastPrice,
          quantity,
          'Target profit reached'
        );
      }

      // Stop loss
      if (profitPercent <= -this.config.stopLoss) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.lastPrice,
          quantity,
          'Stop loss triggered'
        );
      }

      // Death Cross - Short MA crosses below Long MA
      if (shortMA < longMA) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.lastPrice,
          quantity,
          'Death Cross detected'
        );
      }
    }

    return this.createDecision('HOLD', quote.lastPrice, 0, 'No signal');
  }

  private calculateMA(data: StockQuote[], period: number): number {
    if (data.length < period) return 0;
    const prices = data.slice(-period).map(quote => quote.lastPrice);
    return prices.reduce((sum, price) => sum + price, 0) / period;
  }
}