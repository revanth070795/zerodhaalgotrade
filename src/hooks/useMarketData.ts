import { useState, useEffect } from 'react';
import { MarketDataService } from '../services/marketDataService.ts';
import { StockQuote } from '../types/kite.ts';

export function useMarketData(marketDataService: MarketDataService, symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null);

  useEffect(() => {
    const handleQuote = (newQuote: StockQuote) => {
      setQuote(newQuote);
    };

    // Get initial snapshot
    marketDataService.getSnapshot(symbol).then(setQuote);

    // Subscribe to real-time updates
    marketDataService.subscribeToSymbol(symbol, handleQuote);

    return () => {
      marketDataService.unsubscribeFromSymbol(symbol, handleQuote);
    };
  }, [marketDataService, symbol]);

  return quote;
}