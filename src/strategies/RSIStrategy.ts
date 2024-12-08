import { BaseStrategy, StrategyConfig } from './BaseStrategy.ts';
import { StockQuote, TradingDecision } from '../types/kite.ts';

export class RSIStrategy extends BaseStrategy {
  private period = 14;
  private oversoldThreshold = 30;
  private overboughtThreshold = 70;

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

    const rsi = this.calculateRSI(historicalData);

    if (this.position === 'NONE') {
      // Oversold condition - potential buy signal
      if (rsi < this.oversoldThreshold && quote.volume > this.config.volumeThreshold) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'LONG';
        this.entryPrice = quote.lastPrice;
        return this.createDecision(
          'BUY',
          quote.lastPrice,
          quantity,
          'RSI oversold condition'
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

      // Overbought condition - potential sell signal
      if (rsi > this.overboughtThreshold) {
        const quantity = Math.floor(balance / quote.lastPrice);
        this.position = 'NONE';
        this.entryPrice = null;
        return this.createDecision(
          'SELL',
          quote.lastPrice,
          quantity,
          'RSI overbought condition'
        );
      }
    }

    return this.createDecision('HOLD', quote.lastPrice, 0, 'No signal');
  }

  private calculateRSI(data: StockQuote[]): number {
    if (data.length < this.period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= this.period; i++) {
      const difference = data[data.length - i].lastPrice - data[data.length - i - 1].lastPrice;
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / this.period;
    const avgLoss = losses / this.period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}