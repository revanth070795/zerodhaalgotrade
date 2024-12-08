import React from 'react';
import { TradingSession } from '../types/kite.ts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface ActiveTradingSessionProps {
  session: TradingSession;
  onStopTrading: (symbol: string) => void;
}

const ActiveTradingSession: React.FC<ActiveTradingSessionProps> = ({
  session,
  onStopTrading,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-blue-500 mr-2" />
          <div>
            <h3 className="font-medium">{session.symbol}</h3>
            <p className="text-sm text-gray-500">
              Active since: {session.lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {session.currentPosition !== 'NONE' && (
            <div className="flex items-center">
              {session.currentPosition === 'LONG' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className="text-sm font-medium">
                {session.entryPrice ? `₹${session.entryPrice.toFixed(2)}` : '-'}
              </span>
            </div>
          )}
          
          <button
            onClick={() => onStopTrading(session.symbol)}
            className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-600 hover:bg-red-200"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveTradingSession;