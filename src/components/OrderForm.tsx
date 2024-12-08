import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { MarketDataService } from '../services/marketDataService.ts';
import { StockQuote } from '../types/kite.ts';

interface OrderFormProps {
  onSubmit: (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }) => void;
  selectedStocks: string[];
  marketDataService: MarketDataService | null;
}

const OrderForm: React.FC<OrderFormProps> = ({
  onSubmit,
  selectedStocks,
  marketDataService,
}) => {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currentQuote, setCurrentQuote] = useState<StockQuote | null>(null);

  useEffect(() => {
    if (!marketDataService || !symbol) return;

    const handleQuote = (quote: StockQuote) => {
      setCurrentQuote(quote);
      setPrice(quote.lastPrice.toString());
    };

    marketDataService.subscribeToSymbol(symbol, handleQuote);
    marketDataService.getSnapshot(symbol).then(handleQuote);

    return () => {
      marketDataService.unsubscribeFromSymbol(symbol, handleQuote);
    };
  }, [marketDataService, symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      symbol,
      type,
      quantity: Number(quantity),
      price: Number(price),
    });
    // Reset form
    setQuantity('');
    setPrice(currentQuote?.lastPrice.toString() || '');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Place Order</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a stock</option>
            {selectedStocks.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </div>

        {currentQuote && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Current Market Price</p>
            <p className="text-lg font-semibold">₹{currentQuote.lastPrice.toFixed(2)}</p>
            <p className={`text-sm ${currentQuote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentQuote.change >= 0 ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Order Type</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('BUY')}
              className={`py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'BUY'
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType('SELL')}
              className={`py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'SELL'
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            min="1"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            step="0.01"
            min="0.01"
            placeholder="Enter price"
          />
        </div>

        <div className="flex items-center p-3 bg-yellow-50 rounded-md text-yellow-800 text-sm">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            Order value: ₹{(Number(quantity) * Number(price)).toFixed(2)}
            <br />
            Please verify all details before placing the order
          </span>
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            type === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
          }`}
        >
          Place {type.toLowerCase()} Order
        </button>
      </div>
    </form>
  );
};

export default OrderForm;