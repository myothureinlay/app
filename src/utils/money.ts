import { getCurrencyDecimalPlaces, getCurrencySymbol } from '../constants/currencies';
import type { BaseCurrency, CurrencyCode } from '../types';

export function formatMoney(amount: number, currency: CurrencyCode | BaseCurrency) {
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const factor = 10 ** decimalPlaces;
  const rounded = Math.round(amount * factor) / factor;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces > 4 ? 2 : decimalPlaces,
  }).format(rounded);

  if (currency === 'USDT') {
    return `${formatted} USDT`;
  }

  return `${getCurrencySymbol(currency)} ${formatted}`;
}

export function parseNumber(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
