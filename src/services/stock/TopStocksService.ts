import { Stock, StockQuote } from '../../types/kite';
import { StockCache } from '../cache/StockCache';
import { StockRankingService } from './StockRankingService';
import KiteService from '../kiteService';

export class TopStocksService {
  private cache: StockCache;
  private rankingService: StockRankingService;
  private readonly BATCH_SIZE = 50;
  private readonly CACHE_KEY = 'top-stocks';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private kiteService: KiteService) {
    this.cache = new StockCache();
    this.rankingService = new StockRankingService();
  }

  async getTopStocks(): Promise<Stock[]> {
    // Check cache first
    const cached = this.cache.get(this.CACHE_KEY);
    if (cached) return cached;

    try {
      // Get all instruments
      const instruments = await this.kiteService.getInstruments();
      const nseStocks = instruments
        .filter((inst: any) => inst.exchange === 'NSE')
        .map((inst: any) => ({
          symbol: inst.tradingsymbol,
          name: inst.name,
          sector: inst.segment,
          exchange: inst.exchange,
          instrumentToken: inst.instrument_token,
        }));

      // Fetch quotes in batches
      const quotes: StockQuote[] = [];
      for (let i = 0; i < nseStocks.length; i += this.BATCH_SIZE) {
        const batch = nseStocks.slice(i, i + this.BATCH_SIZE);
        const batchQuotes = await Promise.all(
          batch.map(stock => this.kiteService.getQuote(stock.symbol))
        );
        quotes.push(...batchQuotes);
        
        // Small delay to prevent rate limiting
        if (i + this.BATCH_SIZE < nseStocks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Rank stocks
      const rankedStocks = this.rankingService.rankStocks(nseStocks, quotes);
      const topStocks = rankedStocks.slice(0, 50);

      // Cache results
      this.cache.set(this.CACHE_KEY, topStocks, this.CACHE_TTL);

      return topStocks;
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      throw error;
    }
  }
}