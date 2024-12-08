import { StockQuote, TradingDecision } from '../types/kite.ts';
import { BaseStrategy } from '../strategies/BaseStrategy.ts';
import { MovingAverageStrategy } from '../strategies/MovingAverageStrategy.ts';
import { RSIStrategy } from '../strategies/RSIStrategy.ts';
import { VWAPStrategy } from '../strategies/VWAPStrategy.ts';

export class StrategyAnalyzer {
  private strategies: Map<string, BaseStrategy> = new Map();
  private historicalData: Map<string, StockQuote[]> = new Map();
  private readonly maxHistoricalDataPoints = 100;

  constructor() {
    const defaultConfig = {
      targetProfit: 0.03, // 3%
      stopLoss: 0.015,    // 1.5%
      timeframe: 300,     // 5 minutes
      volumeThreshold: 100000
    };

    this.strategies.set('MA', new MovingAverageStrategy(defaultConfig));
    this.strategies.set('RSI', new RSIStrategy(defaultConfig));
    this.strategies.set('VWAP', new VWAPStrategy(defaultConfig));
  }

  addQuote(symbol: string, quote: StockQuote) {
    if (!this.historicalData.has(symbol)) {
      this.historicalData.set(symbol, []);
    }

    const data = this.historicalData.get(symbol)!;
    data.push(quote);

    // Keep only the last N data points
    if (data.length > this.maxHistoricalDataPoints) {
      data.shift();
    }
  }

  analyzeStock(symbol: string, quote: StockQuote, balance: number): TradingDecision {
    const historicalData = this.historicalData.get(symbol) || [];
    
    // Get decisions from all strategies
    const decisions = Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      decision: strategy.analyze(quote, historicalData, balance)
    }));

    // Find the most confident decision
    const actionDecision = decisions.find(d => d.decision.action !== 'HOLD');
    if (actionDecision) {
      return {
        ...actionDecision.decision,
        reason: `${actionDecision.name} Strategy: ${actionDecision.decision.reason}`
      };
    }

    return {
      action: 'HOLD',
      price: quote.lastPrice,
      quantity: 0,
      reason: 'No strong signals from any strategy'
    };
  }

  getStrategyPerformance(symbol: string): Record<string, number> {
    const performance: Record<string, number> = {};
    const historicalData = this.historicalData.get(symbol) || [];

    if (historicalData.length < 2) {
      return performance;
    }

    for (const [name, strategy] of this.strategies.entries()) {
      let profit = 0;
      let position: 'LONG' | 'NONE' = 'NONE';
      let entryPrice = 0;

      historicalData.forEach((quote, index) => {
        const decision = strategy.analyze(
          quote,
          historicalData.slice(0, index + 1),
          100000
        );

        if (decision.action === 'BUY' && position === 'NONE') {
          position = 'LONG';
          entryPrice = quote.lastPrice;
        } else if (decision.action === 'SELL' && position === 'LONG') {
          profit += ((quote.lastPrice - entryPrice) / entryPrice) * 100;
          position = 'NONE';
        }
      });

      performance[name] = profit;
    }

    return performance;
  }
}