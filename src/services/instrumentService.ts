import KiteService from './kiteService.ts';
import { Stock } from '../types/kite.ts';

export class InstrumentService {
  private instruments: Stock[] = [];
  private isLoading = false;

  constructor(private kiteService: KiteService) {
    this.loadInstruments();
  }

  private async loadInstruments() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const instruments = await this.kiteService.getInstruments();
      this.instruments = instruments
        .filter((inst: any) => inst.exchange === 'NSE')
        .map((inst: any) => ({
          symbol: inst.tradingsymbol,
          name: inst.name,
          sector: this.categorizeSector(inst.segment),
          exchange: inst.exchange,
          instrumentToken: inst.instrument_token,
        }));
    } catch (error) {
      console.error('Error loading instruments:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private categorizeSector(segment: string): string {
    // Map NSE segments to sectors
    const sectorMap: { [key: string]: string } = {
      'NSE-FO': 'Futures & Options',
      'NSE-CM': 'Cash Market',
      'NSE-CD': 'Currency Derivatives',
    };
    return sectorMap[segment] || 'Others';
  }

  async searchStocks(query: string): Promise<Stock[]> {
    if (!this.instruments.length) {
      await this.loadInstruments();
    }

    const searchTerm = query.toLowerCase();
    return this.instruments.filter(
      stock =>
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
    );
  }

  async getPopularStocks(): Promise<Stock[]> {
    if (!this.instruments.length) {
      await this.loadInstruments();
    }

    // Return top 50 stocks by volume (you can modify this criteria)
    return this.instruments.slice(0, 50);
  }

  async getStocksByExchange(exchange: string): Promise<Stock[]> {
    if (!this.instruments.length) {
      await this.loadInstruments();
    }

    return this.instruments.filter(stock => stock.exchange === exchange);
  }
}