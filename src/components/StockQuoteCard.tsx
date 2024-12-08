import React from 'react';
import { StockQuote } from '../types/kite.ts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockQuoteCardProps {
  quote: StockQuote;
}

const StockQuoteCard: React.FC<StockQuoteCardProps> = ({ quote }) => {
  const isPositive = quote.change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{quote.symbol}</h3>
          <p className="text-3xl font-bold mt-2">₹{quote.lastPrice.toFixed(2)}</p>
        </div>
        <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 mr-1" />
          ) : (
            <TrendingDown className="w-5 h-5 mr-1" />
          )}
          <span className="text-lg font-semibold">
            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Volume</p>
          <p className="text-lg font-semibold">{quote.volume.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Day's Range</p>
          <p className="text-lg font-semibold">
            ₹{quote.low.toFixed(2)} - ₹{quote.high.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockQuoteCard;