import KiteService from './kiteService.ts';
import { TradingStrategy } from './tradingStrategy.ts';
import { StockQuote } from '../types/kite.ts';

export class AutomatedTrading {
  private strategy: TradingStrategy;
  private isRunning: boolean = false;
  private balance: number = 100000; // Initial balance of ₹1,00,000

  constructor(private kiteService: KiteService) {
    this.strategy = new TradingStrategy();
  }

  async start(symbol: string) {
    if (this.isRunning) return;
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const quote = await this.kiteService.getQuote(symbol);
        await this.processQuote(quote);
        await this.sleep(5000); // Wait 5 seconds between checks
      } catch (error) {
        console.error('Error in automated trading:', error);
        await this.sleep(30000); // Wait longer on error
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  private async processQuote(quote: StockQuote) {
    const signal = this.strategy.analyzeMarket(quote, this.balance);

    if (signal.action !== 'HOLD' && signal.quantity > 0) {
      try {
        await this.kiteService.placeOrder(
          quote.symbol,
          signal.action,
          signal.quantity,
          signal.price
        );

        // Update balance after trade
        if (signal.action === 'BUY') {
          this.balance -= signal.price * signal.quantity;
        } else {
          this.balance += signal.price * signal.quantity;
        }

        console.log(`${signal.action} order placed:`, {
          symbol: quote.symbol,
          quantity: signal.quantity,
          price: signal.price,
          balance: this.balance
        });
      } catch (error) {
        console.error('Error placing order:', error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}