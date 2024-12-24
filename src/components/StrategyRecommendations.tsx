import React, { useState, useEffect } from 'react';
import { Stock, StockQuote } from '../types/kite.ts';
import { StrategyAnalyzer } from '../services/StrategyAnalyzer.ts';
import { MarketDataService } from '../services/marketDataService.ts';
import { TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import { balanceAmount } from '../constants/config.js';

interface StrategyRecommendationsProps {
  marketDataService: MarketDataService | null;
}

const StrategyRecommendations: React.FC<StrategyRecommendationsProps> = ({
  marketDataService,
}) => {
  const [recommendations, setRecommendations] = useState<Array<{
    stock: Stock;
    quote: StockQuote;
    bestStrategy: string;
    performance: number;
    signal: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!marketDataService) return;

    const strategyAnalyzer = new StrategyAnalyzer();
    const updateInterval = 60000; // Update every minute

    const analyzeMarket = async () => {
      try {
        setIsLoading(true);
        const stocks = await marketDataService.getTopStocks();
        const analyzed = await Promise.all(
          stocks.map(async (stock) => {
            const quote = await marketDataService.getSnapshot(stock.symbol);
            strategyAnalyzer.addQuote(stock.symbol, quote);
            const performance = strategyAnalyzer.getStrategyPerformance(stock.symbol);
            const bestStrategy = Object.entries(performance).reduce(
              (a, b) => (b[1] > a[1] ? b : a)
            )[0];

            const decision = strategyAnalyzer.analyzeStock(
              stock.symbol,
              quote,
              balanceAmount
            );

            return {
              stock,
              quote,
              bestStrategy,
              performance: performance[bestStrategy],
              signal: decision.reason,
            };
          })
        );

        // Sort by performance
        const sorted = analyzed.sort((a, b) => b.performance - a.performance);
        setRecommendations(sorted.slice(0, 10)); // Top 10 recommendations
      } catch (error) {
        console.error('Error analyzing market:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeMarket();
    const interval = setInterval(analyzeMarket, updateInterval);

    return () => clearInterval(interval);
  }, [marketDataService]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2">Analyzing market...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Top Trading Opportunities</h2>
      <div className="space-y-4">
        {recommendations.map(({ stock, quote, bestStrategy, performance, signal }) => (
          <div
            key={stock.symbol}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                <p className="text-sm text-gray-600">{stock.name}</p>
              </div>
              <div className={`flex items-center ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quote.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="font-medium">
                  {quote.change >= 0 ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-gray-500">Best Strategy</p>
                <p className="font-medium">{bestStrategy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Historical Performance</p>
                <p className="font-medium text-green-600">+{performance.toFixed(2)}%</p>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{signal}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyRecommendations;