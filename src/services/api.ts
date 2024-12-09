import axios from 'axios';
import { AuthService } from '../services/authService.ts';
import KiteService from '../services/kiteService.ts';

const API_URL = 'http://localhost:3001/api';

const accessToken = new KiteService().accessToken;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add API key to requests if available
api.interceptors.request.use(config => {
  const savedCredentials: any = AuthService.getCredentialsFromCookie() || {};
  if (savedCredentials.apiKey) {
    config.headers.apiKey = savedCredentials.apiKey;
  }
  if (savedCredentials.requestToken) {
    config.headers.requestToken = savedCredentials.requestToken;
  }
  if (savedCredentials.accessToken) {
    // config.headers.Authorization = `token api_key:${savedCredentials.accessToken}`;
    config.headers.Authorization = savedCredentials.accessToken;
  }
  // const accessToken = new KiteService(savedCredentials).accessToken;
  // if (!accessToken) {
  //   const access_token = await authAPI.callback(savedCredentials.requestToken, savedCredentials.apiKey);
  //   config.headers.accessToken = `token api_key:${access_token.accessToken}`;
  // } else if (accessToken) {
  //   config.headers.accessToken = `token api_key:${accessToken}`;
  // } 
  return config;
});

export const authAPI = {
  login: async (apiKey: string, apiSecret: string) => {
    const response = await api.post('/auth/login', { apiKey, apiSecret });
    return response.data;
  },

  callback: async (requestToken: string, apiKey: string) => {
    const response = await api.post('/auth/callback', { requestToken, apiKey });
    return response.data;
  }
};

export const marketAPI = {
  getInstruments: async () => {
    const response = await api.get('/market/instruments');
    return response.data;
  },

  getQuote: async (symbol: string) => {
    const response = await api.get(`/market/quote/${symbol}`);
    return response.data;
  }
};

export const tradingAPI = {
  getPositions: async () => {
    const response = await api.get('/trading/positions');
    return response.data;
  },

  placeOrder: async (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }) => {
    const response = await api.post('/trading/orders', order);
    return response.data;
  }
};