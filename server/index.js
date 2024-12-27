import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';
import { KiteConnect } from 'kiteconnect';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ignore SSL certificate errors (for development purposes only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const port = process.env.NODE_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Kite Connect instance store
const kiteInstances = new Map();

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    const kite = new KiteConnect({ api_key: apiKey });
    const loginUrl = kite.getLoginURL();
    
    // Store kite instance
    kiteInstances.set(apiKey, { kite, apiSecret });
    
    res.json({ loginUrl });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
  }
});

app.post('/api/auth/callback', async (req, res) => {
  try {
    const { requestToken, apiKey } = req.body;
    const instance = kiteInstances.get(apiKey);
    
    if (!instance) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    const { kite, apiSecret } = instance;
    const response = await kite.generateSession(requestToken, apiSecret);
    
    // Update kite instance with access token
    kite.setAccessToken(response.access_token);
    
    res.json({ accessToken: response.access_token });
  } catch (error) {
    logger.error('Callback error:', error);
    res.status(500).json({ error: 'Failed to generate session' });
  }
});

app.get('/api/market/top-stocks', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stocks = await getTopStocks(req, res);
    const analyzed = await Promise.all(
      stocks.map(async (stock) => {
        const quote = await instance.kite.getQuote([`NSE:${stock.symbol}`]);
        return {
          ...stock,
          ...{quote}
        }
      })
    );
    return res.json(analyzed);
  } catch (error) {
    logger.error('Error analyzing market:', error);
    res.status(500).json({ error: 'Failed to analyze market' });
  }
});

async function getTopStocks(req, res) {
  const now = Date.now();
  let cachedTopStocks = [];
  let lastTopStocksUpdate = 0;
  const topStocksUpdateInterval = 5 * 60 * 1000; // 5 minutes
  if (
    cachedTopStocks.length === 0 ||
    now - lastTopStocksUpdate > topStocksUpdateInterval
  ) {
    try {
      const { apiKey, apikey } = req.headers;
      const instance = kiteInstances.get(apiKey || apikey);
      
      if (!instance) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const instruments = await instance.kite.getInstruments();

      const stocks = instruments
        .filter((inst) => inst.exchange === 'NSE')
        .map((inst) => ({
          symbol: inst.tradingsymbol,
          name: inst.name,
          sector: inst.segment,
          exchange: inst.exchange,
          instrumentToken: inst.instrument_token,
        }));

      // Get quotes for all stocks
      const quotes = await Promise.all(
        stocks.map(stock => instance.kite.getQuote([`NSE:${stock.symbol}`]))
      );

      // Sort by volume and price movement
      const stocksWithMetrics = stocks.map((stock, index) => ({
        ...stock,
        volume: quotes[index].volume,
        priceChange: Math.abs(quotes[index].changePercent),
      }));

      // Rank stocks based on volume and price movement
      cachedTopStocks = stocksWithMetrics
        .sort((a, b) => {
          const aScore = a.volume * Math.pow(a.priceChange, 2);
          const bScore = b.volume * Math.pow(b.priceChange, 2);
          return bScore - aScore;
        })
        .map(({ symbol, name, sector, exchange, instrumentToken }) => ({
          symbol,
          name,
          sector,
          exchange,
          instrumentToken,
        }));

      lastTopStocksUpdate = now;
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      return cachedTopStocks;
    }
  }

  return cachedTopStocks;
}

app.get('/api/market/instruments', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const instruments = await instance.kite.getInstruments(['NSE']);
    res.json(instruments);
  } catch (error) {
    logger.error('Get instruments error:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const { symbol } = req.params;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quote = await instance.kite.getProfile();
    res.json(quote);
  } catch (error) {
    logger.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/market/quote/:symbol', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const { symbol } = req.params;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quote = await instance.kite.getQuote([symbol]);
    res.json(quote[symbol]);
  } catch (error) {
    logger.error('Get quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/trading/positions', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const positions = await instance.kite.getPositions();
    res.json(positions);
  } catch (error) {
    logger.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

app.post('/api/trading/orders', async (req, res) => {
  try {
    const { apiKey, apikey } = req.headers;
    const { symbol, type, quantity, price } = req.body;
    const instance = kiteInstances.get(apiKey || apikey);
    
    if (!instance) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await instance.kite.placeOrder('regular', {
      tradingsymbol: symbol,
      exchange: 'NSE',
      transaction_type: type,
      quantity,
      price,
      product: 'CNC',
      order_type: 'LIMIT'
    });

    res.json(order);
  } catch (error) {
    logger.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});