import { KiteConnect } from 'kiteconnect';
import { KiteCredentials, StockQuote, Order, Position } from '../types/kite.ts';
import { authAPI, marketAPI, tradingAPI } from './api.ts';

class KiteService {
  // private kite: any;
  // private webSocket: WebSocket | null = null;

  // constructor(credentials: KiteCredentials) {
  //   this.kite = new KiteConnect({
  //     api_key: credentials.apiKey,
  //   });
    
  //   if (credentials.requestToken) {
  //     this.generateSession(credentials.requestToken, credentials.apiSecret);
  //   }
  // }

  // private async generateSession(requestToken: string, apiSecret: string) {
  //   try {
  //     const response = await this.kite.generateSession(requestToken, apiSecret);
  //     this.kite.setAccessToken(response.access_token);
  //     this.initializeWebSocket(response.access_token);
  //   } catch (error) {
  //     console.error('Session generation failed:', error);
  //     throw error;
  //   }
  // }

  // private initializeWebSocket(accessToken: string) {
  //   const wsUrl = `wss://ws.kite.trade?api_key=${this.kite.api_key}&access_token=${accessToken}`;
  //   this.webSocket = new WebSocket(wsUrl);
  // }

  // getWebSocket(): WebSocket {
  //   if (!this.webSocket) {
  //     throw new Error('WebSocket not initialized. Please ensure you are logged in.');
  //   }
  //   return this.webSocket;
  // }

  // async getQuote(symbol: string): Promise<StockQuote> {
  //   try {
  //     const response = await this.kite.getQuote([symbol]);
  //     const quote = response[symbol];
  //     return {
  //       symbol,
  //       last_price: quote.last_price,
  //       change: quote.change,
  //       changePercent: quote.change_percent,
  //       volume: quote.volume,
  //       high: quote.high,
  //       low: quote.low,
  //     };
  //   } catch (error) {
  //     console.error('Failed to fetch quote:', error);
  //     throw error;
  //   }
  // }

  // async placeOrder(symbol: string, type: 'BUY' | 'SELL', quantity: number, price: number): Promise<string> {
  //   try {
  //     const response = await this.kite.placeOrder('regular', {
  //       tradingsymbol: symbol,
  //       exchange: 'NSE',
  //       transaction_type: type,
  //       quantity,
  //       price,
  //       product: 'CNC',
  //       order_type: 'LIMIT',
  //     });
  //     return response.order_id;
  //   } catch (error) {
  //     console.error('Order placement failed:', error);
  //     throw error;
  //   }
  // }

  // async getPositions(): Promise<Position[]> {
  //   try {
  //     const response = await this.kite.getPositions();
  //     return response.net.map((pos: any) => ({
  //       symbol: pos.tradingsymbol,
  //       quantity: pos.quantity,
  //       averagePrice: pos.average_price,
  //       currentPrice: pos.last_price,
  //       pnl: pos.pnl,
  //     }));
  //   } catch (error) {
  //     console.error('Failed to fetch positions:', error);
  //     throw error;
  //   }
  // }

  // async getInstruments(): Promise<any[]> {
  //   try {
  //     return await this.kite.getInstruments(['NSE']);
  //   } catch (error) {
  //     console.error('Failed to fetch instruments:', error);
  //     throw error;
  //   }
  // }

  // new code

  private credentials: KiteCredentials;
  public accessToken: string | null = null;

  constructor(credentials: KiteCredentials) {
    this.credentials = credentials;
  }

  getAccessToken(): string {
    return this.accessToken || '';
  }

  async login() {
    try {
      const { loginUrl } = await authAPI.login(
        this.credentials.apiKey,
        this.credentials.apiSecret
      );
      return loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async handleCallback(requestToken: string) {
    try {
      const { accessToken } = await authAPI.callback(requestToken, this.credentials.apiKey);
      this.accessToken = accessToken;
      return accessToken;
    } catch (error) {
      console.error('Callback failed:', error);
      throw error;
    }
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const quote = await marketAPI.getQuote(`NSE:${symbol}`);
      return {
        symbol,
        last_price: quote.last_price,
        net_change: quote.net_change,
        changePercent: quote.change_percent,
        volume: quote.volume,
        high: quote?.ohlc?.high || null,
        low: quote?.ohlc?.low || null,
      };
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      throw error;
    }
  }

  async placeOrder(
    symbol: string,
    type: 'BUY' | 'SELL',
    quantity: number,
    price: number
  ): Promise<string> {
    try {
      const response = await tradingAPI.placeOrder({
        symbol,
        type,
        quantity,
        price,
      });
      return response.order_id;
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await tradingAPI.getPositions();
      return response.net.map((pos: any) => ({
        symbol: pos.tradingsymbol,
        quantity: pos.quantity,
        averagePrice: pos.average_price,
        currentPrice: pos.last_price,
        pnl: pos.pnl,
      }));
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      throw error;
    }
  }

  async getInstruments(): Promise<any[]> {
    try {
      return await marketAPI.getInstruments();
    } catch (error) {
      console.error('Failed to fetch instruments:', error);
      throw error;
    }
  }
}

export default KiteService;