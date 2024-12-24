import axios from 'axios';
import { AuthService } from '../services/authService.ts';
// import KiteService from '../services/kiteService.ts';

const API_URL = 'http://3.25.193.58/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add API key to requests if available
api.interceptors.request.use(async (config) => {
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
  // const kiteService = new KiteService(savedCredentials);
  // if (!kiteService.accessToken) {
  //   const access_token = await kiteService.handleCallback(savedCredentials.requestToken);
  //   config.headers.accessToken = access_token;
  // } else if (kiteService.accessToken) {
  //   config.headers.accessToken = kiteService.accessToken;
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
