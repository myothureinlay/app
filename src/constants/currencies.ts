import type { BaseCurrency, CurrencyCode } from '../types';

export const CURRENCIES: CurrencyCode[] = ['USDT', 'USD', 'MMK', 'THB'];
export const BASE_CURRENCIES: BaseCurrency[] = ['USD', 'MMK', 'THB'];

export const currencySymbols: Record<CurrencyCode | BaseCurrency, string> = {
  USDT: 'USDT',
  USD: '$',
  MMK: 'Ks',
  THB: '฿',
};

const usdToMmk = 4200;
const usdToThb = 36.7;

export const defaultRatesToBase: Record<BaseCurrency, Record<CurrencyCode, number>> = {
  USD: {
    USDT: 1,
    USD: 1,
    MMK: 1 / usdToMmk,
    THB: 1 / usdToThb,
  },
  MMK: {
    USDT: usdToMmk,
    USD: usdToMmk,
    MMK: 1,
    THB: usdToMmk / usdToThb,
  },
  THB: {
    USDT: usdToThb,
    USD: usdToThb,
    MMK: usdToThb / usdToMmk,
    THB: 1,
  },
};
