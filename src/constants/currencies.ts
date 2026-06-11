import type { BaseCurrency, CurrencyCode, CurrencyDefinition } from '../types';

export const defaultCurrencyDefinitions: CurrencyDefinition[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: true, isDefault: true, sortOrder: 1, createdAt: '', updatedAt: '' },
  { code: 'USDT', name: 'Tether', symbol: 'USDT', decimalPlaces: 2, type: 'crypto', isActive: true, isFavorite: true, isDefault: true, sortOrder: 2, createdAt: '', updatedAt: '' },
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC', decimalPlaces: 2, type: 'crypto', isActive: true, isFavorite: true, isDefault: true, sortOrder: 3, createdAt: '', updatedAt: '' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'Ks', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: true, isDefault: true, sortOrder: 4, createdAt: '', updatedAt: '' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: true, isDefault: true, sortOrder: 5, createdAt: '', updatedAt: '' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 6, createdAt: '', updatedAt: '' },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 7, createdAt: '', updatedAt: '' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 8, createdAt: '', updatedAt: '' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 9, createdAt: '', updatedAt: '' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 10, createdAt: '', updatedAt: '' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 11, createdAt: '', updatedAt: '' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 12, createdAt: '', updatedAt: '' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 13, createdAt: '', updatedAt: '' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 14, createdAt: '', updatedAt: '' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 15, createdAt: '', updatedAt: '' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 16, createdAt: '', updatedAt: '' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 17, createdAt: '', updatedAt: '' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 18, createdAt: '', updatedAt: '' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 19, createdAt: '', updatedAt: '' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 20, createdAt: '', updatedAt: '' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 21, createdAt: '', updatedAt: '' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', decimalPlaces: 0, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 22, createdAt: '', updatedAt: '' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, type: 'fiat', isActive: true, isFavorite: false, isDefault: true, sortOrder: 23, createdAt: '', updatedAt: '' },
  { code: 'BTC', name: 'Bitcoin', symbol: 'BTC', decimalPlaces: 8, type: 'crypto', isActive: true, isFavorite: false, isDefault: true, sortOrder: 24, createdAt: '', updatedAt: '' },
  { code: 'ETH', name: 'Ethereum', symbol: 'ETH', decimalPlaces: 6, type: 'crypto', isActive: true, isFavorite: false, isDefault: true, sortOrder: 25, createdAt: '', updatedAt: '' },
  { code: 'BNB', name: 'BNB', symbol: 'BNB', decimalPlaces: 6, type: 'crypto', isActive: true, isFavorite: false, isDefault: true, sortOrder: 26, createdAt: '', updatedAt: '' },
  { code: 'SOL', name: 'Solana', symbol: 'SOL', decimalPlaces: 6, type: 'crypto', isActive: true, isFavorite: false, isDefault: true, sortOrder: 27, createdAt: '', updatedAt: '' },
];

export const CURRENCIES: CurrencyCode[] = defaultCurrencyDefinitions.map((currency) => currency.code);
export const BASE_CURRENCIES: BaseCurrency[] = CURRENCIES;

export const currencySymbols: Record<string, string> = defaultCurrencyDefinitions.reduce<Record<string, string>>(
  (acc, currency) => {
    acc[currency.code] = currency.symbol;
    return acc;
  },
  {}
);

export function getCurrencyDefinition(currency: CurrencyCode) {
  return defaultCurrencyDefinitions.find((item) => item.code === currency);
}

export function getCurrencySymbol(currency: CurrencyCode) {
  return getCurrencyDefinition(currency)?.symbol ?? currency;
}

export function getCurrencyDecimalPlaces(currency: CurrencyCode) {
  return getCurrencyDefinition(currency)?.decimalPlaces ?? 2;
}

const usdRates: Record<string, number> = {
  USD: 1,
  USDT: 1,
  USDC: 1,
  MMK: 4200,
  THB: 36.7,
  EUR: 0.92,
  GBP: 0.78,
  CNY: 7.25,
  JPY: 157,
  KRW: 1370,
  SGD: 1.35,
  MYR: 4.7,
  IDR: 16200,
  VND: 25400,
  INR: 83.5,
  AUD: 1.5,
  CAD: 1.37,
  HKD: 7.8,
  TWD: 32.3,
  PHP: 58.6,
  LAK: 21800,
  KHR: 4100,
  AED: 3.67,
  BTC: 0.000015,
  ETH: 0.00028,
  BNB: 0.0017,
  SOL: 0.0065,
};

export function getRateToBase(baseCurrency: BaseCurrency, currency: CurrencyCode) {
  const basePerUsd = usdRates[baseCurrency] ?? 1;
  const currencyPerUsd = usdRates[currency] ?? 1;
  return basePerUsd / currencyPerUsd;
}

export const defaultRatesToBase: Record<string, Record<string, number>> = CURRENCIES.reduce<Record<string, Record<string, number>>>(
  (acc, base) => {
    acc[base] = CURRENCIES.reduce<Record<string, number>>((rates, currency) => {
      rates[currency] = getRateToBase(base, currency);
      return rates;
    }, {});
    return acc;
  },
  {}
);
