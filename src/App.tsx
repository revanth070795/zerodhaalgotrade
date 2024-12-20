import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore.ts';
import KiteService from './services/kiteService.ts';
import { MultiStockTrading } from './services/multiStockTrading.ts';
import { MarketDataService } from './services/marketDataService.ts';
import { InstrumentService } from './services/instrumentService.ts';
import StockChart from './components/StockChart.tsx';
import OrderForm from './components/OrderForm.tsx';
import PositionsTable from './components/PositionsTable.tsx';
import StockQuoteCard from './components/StockQuoteCard.tsx';
import LoginForm from './components/LoginForm.tsx';
import StockSelector from './components/StockSelector.tsx';
import ActiveTradingSession from './components/ActiveTradingSession.tsx';
import StrategyRecommendations from './components/StrategyRecommendations.tsx';
import { Position, StockQuote, TradingSession } from './types/kite.ts';
import { LineChart, BarChart, LogOut, Settings, Play, Square, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const { credentials, isAuthenticated, logout, initializeAuth, handleRedirect } = useAuthStore();
  const [kiteService, setKiteService] = useState<KiteService | null>(null);
  const [marketDataService, setMarketDataService] = useState<MarketDataService | null>(null);
  const [instrumentService, setInstrumentService] = useState<InstrumentService | null>(null);
  const [multiStockTrading, setMultiStockTrading] = useState<MultiStockTrading | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [activeStocks, setActiveStocks] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [chartData, setChartData] = useState<Map<string, Array<{ timestamp: string; price: number }>>>(
    new Map()
  );
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [activeSessions, setActiveSessions] = useState<TradingSession[]>([]);
  const [isAllTradingActive, setIsAllTradingActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      handleRedirect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (credentials) {
      const service = new KiteService(credentials);
      const marketData = new MarketDataService(service);
      const instruments = new InstrumentService(service);
      setKiteService(service);
      setMarketDataService(marketData);
      setInstrumentService(instruments);
      setMultiStockTrading(new MultiStockTrading(service));
    }
  }, [credentials]);

  useEffect(() => {
    if (kiteService) {
      const fetchPositions = async () => {
        try {
          const positionsData = await kiteService.getPositions();
          setPositions(positionsData);
        } catch (error) {
          console.error('Error fetching positions:', error);
          if ((error as any)?.response?.status === 403) {
            logout();
          }
        }
      };

      fetchPositions();
      // const interval = setInterval(fetchPositions, 5000);
      // return () => clearInterval(interval);
    }
  }, [kiteService]);

  useEffect(() => {
    if (!marketDataService) return;

    const handleQuoteUpdate = (symbol: string, quote: StockQuote) => {
      setChartData(prev => {
        const newData = new Map(prev);
        const existingData = newData.get(symbol) || [];
        newData.set(symbol, [
          ...existingData,
          {
            timestamp: new Date().toLocaleTimeString(),
            price: quote.last_price,
          },
        ].slice(-50));
        return newData;
      });
    };

    selectedStocks.forEach(symbol => {
      marketDataService.subscribeToSymbol(symbol, quote => handleQuoteUpdate(symbol, quote));
    });

    return () => {
      selectedStocks.forEach(symbol => {
        marketDataService.unsubscribeFromSymbol(symbol, quote => handleQuoteUpdate(symbol, quote));
      });
    };
  }, [marketDataService, selectedStocks]);

  const handleStockSelect = (symbol: string) => {
    setSelectedStocks(prev => [...prev, symbol]);
    setShowStockSelector(false);
  };

  const handleStockDeselect = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s !== symbol));
    if (multiStockTrading?.isSymbolActive(symbol)) {
      handleStopTrading(symbol);
    }
  };

  const handleStartTrading = (symbol: string) => {
    if (multiStockTrading && !activeStocks.includes(symbol)) {
      multiStockTrading.startTrading(symbol);
      setActiveStocks(prev => [...prev, symbol]);
      setActiveSessions(multiStockTrading.getActiveSessions());
    }
  };

  const handleStopTrading = (symbol: string) => {
    if (multiStockTrading) {
      multiStockTrading.stopTrading(symbol);
      setActiveStocks(prev => prev.filter(s => s !== symbol));
      setActiveSessions(multiStockTrading.getActiveSessions());
    }
  };

  const handleToggleAllTrading = () => {
    if (!multiStockTrading || selectedStocks.length === 0) return;

    if (isAllTradingActive) {
      selectedStocks.forEach(symbol => {
        if (activeStocks.includes(symbol)) {
          handleStopTrading(symbol);
        }
      });
      setIsAllTradingActive(false);
    } else {
      selectedStocks.forEach(symbol => {
        if (!activeStocks.includes(symbol)) {
          handleStartTrading(symbol);
        }
      });
      setIsAllTradingActive(true);
    }
  };

  const handleOrderSubmit = async (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }) => {
    if (kiteService) {
      try {
        await kiteService.placeOrder(
          order.symbol,
          order.type,
          order.quantity,
          order.price
        );
        const updatedPositions = await kiteService.getPositions();
        setPositions(updatedPositions);
      } catch (error) {
        console.error('Error placing order:', error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <LineChart className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold hidden sm:inline">Trading Platform</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {selectedStocks.length > 0 && (
                <button
                  onClick={handleToggleAllTrading}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isAllTradingActive
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {isAllTradingActive ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop All
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start All
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowStockSelector(!showStockSelector)}
                className="flex items-center px-4 py-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Select Stocks
              </button>
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5 mr-1" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              {selectedStocks.length > 0 && (
                <button
                  onClick={handleToggleAllTrading}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-md ${
                    isAllTradingActive
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {isAllTradingActive ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop All Trading
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start All Trading
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowStockSelector(!showStockSelector);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-blue-100 text-blue-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Select Stocks
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md text-gray-600"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {!showStockSelector && (
          <div className="mb-8">
            <StrategyRecommendations marketDataService={marketDataService} />
          </div>
        )}

        {showStockSelector && instrumentService && (
          <div className="mb-8">
            <StockSelector
              selectedStocks={selectedStocks}
              onStockSelect={handleStockSelect}
              onStockDeselect={handleStockDeselect}
              instrumentService={instrumentService}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {selectedStocks.map(symbol => (
              <div key={symbol} className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">{symbol} Price Chart</h3>
                <div className="min-w-[300px]">
                  <StockChart data={chartData.get(symbol) || []} />
                </div>
              </div>
            ))}
            <div className="overflow-x-auto">
              <PositionsTable positions={positions} />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <OrderForm
              onSubmit={handleOrderSubmit}
              selectedStocks={selectedStocks}
              marketDataService={marketDataService}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;