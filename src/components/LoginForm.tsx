import React, { useState } from 'react';
import { Key, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore.ts';
import { AuthService } from '../services/authService.ts';

const LoginForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const setCredentials = useAuthStore((state) => state.setCredentials);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials({ apiKey, apiSecret });
    // Redirect to Zerodha login
    window.location.href = AuthService.generateLoginUrl(apiKey);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <Key className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Zerodha Trading Platform</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API Key"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Secret
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API Secret"
              required
            />
            <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Connect to Zerodha
        </button>

        <div className="mt-6">
          <p className="text-sm text-gray-600">
            Don't have API credentials?{' '}
            <a
              href="https://kite.trade/docs/connect/v3/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Get them from Zerodha
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;