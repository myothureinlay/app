import { getRateToBase } from '../constants/currencies';
import type { BaseCurrency, CurrencyCode, Transaction } from '../types';

export interface TransactionCurrencyFormState {
  currency: CurrencyCode;
  baseCurrency: BaseCurrency;
  exchangeRate: string;
  baseAmount: number;
  toCurrency: CurrencyCode | null;
  toAmount: number | null;
}

export function initialTransactionCurrencyState(
  transaction: Transaction | null | undefined,
  appBaseCurrency: BaseCurrency,
  fallbackCurrency: CurrencyCode
): TransactionCurrencyFormState {
  const currency = transaction?.currency ?? fallbackCurrency;
  const baseCurrency = transaction?.baseCurrency ?? appBaseCurrency;
  const exchangeRate = transaction?.exchangeRate ?? getRateToBase(baseCurrency, currency);

  return {
    currency,
    baseCurrency,
    exchangeRate: String(exchangeRate),
    baseAmount: transaction?.baseAmount ?? 0,
    toCurrency: transaction?.toCurrency ?? null,
    toAmount: transaction?.toAmount ?? null,
  };
}
