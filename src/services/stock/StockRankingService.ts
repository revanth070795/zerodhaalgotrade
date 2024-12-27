import { Stock, StockQuote } from '../../types/kite';

interface StockMetrics {
  symbol: string;
  volumeScore: number;
  priceMovementScore: number;
  volatilityScore: number;
}

export class StockRankingService {
  private calculateVolumeScore(volume: number, avgVolume: number): number {
    return volume / avgVolume;
  }

  private calculatePriceMovementScore(changePercent: number): number {
    return Math.abs(changePercent);
  }

  private calculateVolatilityScore(high: number, low: number, lastPrice: number): number {
    return (high - low) / lastPrice;
  }

  rankStocks(stocks: Stock[], quotes: StockQuote[]): Stock[] {
    const metrics: StockMetrics[] = [];
    const avgVolume = quotes.reduce((sum, q) => sum + q.volume, 0) / quotes.length;

    // Calculate metrics for each stock
    for (let i = 0; i < stocks.length; i++) {
      const quote = quotes[i];
      metrics.push({
        symbol: stocks[i].symbol,
        volumeScore: this.calculateVolumeScore(quote.volume, avgVolume),
        priceMovementScore: this.calculatePriceMovementScore(quote.changePercent),
        volatilityScore: this.calculateVolatilityScore(quote.high, quote.low, quote.lastPrice)
      });
    }

    // Calculate composite scores and sort
    const rankedSymbols = metrics
      .map(m => ({
        symbol: m.symbol,
        score: (m.volumeScore * 0.4) + (m.priceMovementScore * 0.3) + (m.volatilityScore * 0.3)
      }))
      .sort((a, b) => b.score - a.score)
      .map(r => r.symbol);

    // Reorder stocks based on ranking
    return rankedSymbols.map(symbol => 
      stocks.find(s => s.symbol === symbol)!
    );
  }
}