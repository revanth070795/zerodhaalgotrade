import { KiteService } from './kiteService.ts';
import { StockQuote, Stock } from '../types/kite.ts';

export class MarketDataService {
  private subscribers: Map<string, Set<(quote: StockQuote) => void>> = new Map();
  private websocket: WebSocket = { readyState: WebSocket.CLOSED } as WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private cachedTopStocks: Stock[] = [];
  private lastTopStocksUpdate = 0;
  private readonly topStocksUpdateInterval = 5 * 60 * 1000; // 5 minutes

  constructor(private kiteService: KiteService) {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      this.websocket = this.kiteService.getWebSocket();
      
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleTickerData(data);
      };

      this.websocket.onclose = () => {
        this.handleWebSocketClose();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.reconnect();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private handleTickerData(data: any) {
    const quote: StockQuote = {
      symbol: data.symbol,
      lastPrice: data.last_price,
      change: data.change,
      changePercent: data.change_percent,
      volume: data.volume,
      high: data.high,
      low: data.low,
    };

    const subscribers = this.subscribers.get(quote.symbol);
    if (subscribers) {
      subscribers.forEach(callback => callback(quote));
    }
  }

  private handleWebSocketClose() {
    console.log('WebSocket connection closed');
    this.reconnect();
  }

  private async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      this.initializeWebSocket();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  subscribeToSymbol(symbol: string, callback: (quote: StockQuote) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ action: 'subscribe', symbols: [symbol] }));
      }
    }
    this.subscribers.get(symbol)?.add(callback);
  }

  unsubscribeFromSymbol(symbol: string, callback: (quote: StockQuote) => void) {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(symbol);
        if (this.websocket?.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify({ action: 'unsubscribe', symbols: [symbol] }));
        }
      }
    }
  }

  async getSnapshot(symbol: string): Promise<StockQuote> {
    return await this.kiteService.getQuote(symbol);
  }

  async getTopStocks(): Promise<Stock[]> {
    const now = Date.now();
    if (
      this.cachedTopStocks.length === 0 ||
      now - this.lastTopStocksUpdate > this.topStocksUpdateInterval
    ) {
      try {
        const instruments = await this.kiteService.getInstruments();
        const stocks = instruments
          .filter((inst: any) => inst.exchange === 'NSE')
          .map((inst: any) => ({
            symbol: inst.tradingsymbol,
            name: inst.name,
            sector: inst.segment,
            exchange: inst.exchange,
            instrumentToken: inst.instrument_token,
          }));

        // Get quotes for all stocks
        const quotes = await Promise.all(
          stocks.map(stock => this.getSnapshot(stock.symbol))
        );

        // Sort by volume and price movement
        const stocksWithMetrics = stocks.map((stock, index) => ({
          ...stock,
          volume: quotes[index].volume,
          priceChange: Math.abs(quotes[index].changePercent),
        }));

        // Rank stocks based on volume and price movement
        this.cachedTopStocks = stocksWithMetrics
          .sort((a, b) => {
            const aScore = a.volume * Math.pow(a.priceChange, 2);
            const bScore = b.volume * Math.pow(b.priceChange, 2);
            return bScore - aScore;
          })
          .map(({ symbol, name, sector, exchange, instrumentToken }) => ({
            symbol,
            name,
            sector,
            exchange,
            instrumentToken,
          }));

        this.lastTopStocksUpdate = now;
      } catch (error) {
        console.error('Error fetching top stocks:', error);
        return this.cachedTopStocks;
      }
    }

    return this.cachedTopStocks;
  }

}