import { AutomatedTrading } from './automatedTrading.ts';
import KiteService from './kiteService.ts';
import { TradingSession } from '../types/kite.ts';

export class MultiStockTrading {
  private tradingSessions: Map<string, TradingSession> = new Map();
  private traders: Map<string, AutomatedTrading> = new Map();

  constructor(private kiteService: KiteService) {}

  startTrading(symbol: string) {
    if (this.tradingSessions.has(symbol)) {
      return;
    }

    const trader = new AutomatedTrading(this.kiteService);
    this.traders.set(symbol, trader);

    const session: TradingSession = {
      symbol,
      isActive: true,
      lastUpdate: new Date(),
      currentPosition: 'NONE',
      entryPrice: null,
    };
    this.tradingSessions.set(symbol, session);

    trader.start(symbol);
  }

  stopTrading(symbol: string) {
    const trader = this.traders.get(symbol);
    if (trader) {
      trader.stop();
      this.traders.delete(symbol);
    }
    this.tradingSessions.delete(symbol);
  }

  stopAllTrading() {
    for (const symbol of this.tradingSessions.keys()) {
      this.stopTrading(symbol);
    }
  }

  getActiveSessions(): TradingSession[] {
    return Array.from(this.tradingSessions.values());
  }

  isSymbolActive(symbol: string): boolean {
    return this.tradingSessions.has(symbol);
  }
}