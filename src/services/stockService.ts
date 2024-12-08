import { Stock } from '../types/kite.ts';

export const sectors = [
  'Banking',
  'IT',
  'FMCG',
  'Oil & Gas',
  'Telecom',
  'Automotive',
  'Pharma',
];

export function filterStocksBySector(stocks: Stock[], sector: string): Stock[] {
  return stocks.filter(stock => stock.sector === sector);
}

export function searchStocks(stocks: Stock[], query: string): Stock[] {
  const lowercaseQuery = query.toLowerCase();
  return stocks.filter(
    stock =>
      stock.symbol.toLowerCase().includes(lowercaseQuery) ||
      stock.name.toLowerCase().includes(lowercaseQuery)
  );
}