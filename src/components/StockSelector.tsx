import React, { useState, useEffect } from 'react';
import { Stock } from '../types/kite.ts';
import { InstrumentService } from '../services/instrumentService.ts';
import { Search, Filter, Loader } from 'lucide-react';

interface StockSelectorProps {
  selectedStocks: string[];
  onStockSelect: (symbol: string) => void;
  onStockDeselect: (symbol: string) => void;
  instrumentService: InstrumentService;
}

const StockSelector: React.FC<StockSelectorProps> = ({
  selectedStocks,
  onStockSelect,
  onStockDeselect,
  instrumentService,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('NSE');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial popular stocks
  useEffect(() => {
    loadPopularStocks();
  }, []);

  // Handle search
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery) {
        searchStocks(searchQuery);
      } else {
        loadPopularStocks();
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const loadPopularStocks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const popularStocks = await instrumentService.getPopularStocks();
      setStocks(popularStocks);
    } catch (err) {
      setError('Failed to load popular stocks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchStocks = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await instrumentService.searchStocks(query);
      setStocks(results);
    } catch (err) {
      setError('Failed to search stocks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Select Stocks</h2>
      
      <div className="flex space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stocks by name or symbol..."
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <select
            className="pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                  <p className="text-xs text-gray-400">{stock.exchange}</p>
                </div>
                <button
                  onClick={() =>
                    selectedStocks.includes(stock.symbol)
                      ? onStockDeselect(stock.symbol)
                      : onStockSelect(stock.symbol)
                  }
                  className={`px-4 py-2 rounded-md ${
                    selectedStocks.includes(stock.symbol)
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {selectedStocks.includes(stock.symbol) ? 'Remove' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSelector;