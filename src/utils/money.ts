import { currencySymbols } from '../constants/currencies';
import type { BaseCurrency, CurrencyCode } from '../types';

export function formatMoney(amount: number, currency: CurrencyCode | BaseCurrency) {
  const rounded = currency === 'MMK' ? Math.round(amount) : Math.round(amount * 100) / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: currency === 'MMK' ? 0 : 2,
    minimumFractionDigits: currency === 'MMK' ? 0 : 2,
  }).format(rounded);

  if (currency === 'USDT') {
    return `${formatted} USDT`;
  }

  return `${currencySymbols[currency]} ${formatted}`;
}

export function parseNumber(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
