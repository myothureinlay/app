import type { TransactionWithMeta } from '../types';
import { formatMoney } from '../utils/money';
import { isExpenseLike, isIncomeLike } from './ledger';

const epsilon = 0.005;

function signedAmountForDisplay(transaction: TransactionWithMeta, value: number) {
  if (isIncomeLike(transaction.type)) return Math.abs(value);
  if (isExpenseLike(transaction.type) || transaction.type === 'loss') return -Math.abs(value);
  return value;
}

export function formatTransactionPrimaryAmount(transaction: TransactionWithMeta) {
  const signed = signedAmountForDisplay(transaction, transaction.amount);
  return `${isIncomeLike(transaction.type) ? '+' : ''}${formatMoney(signed, transaction.currency)}`;
}

export function shouldShowBaseAmountLine(transaction: TransactionWithMeta) {
  if (!transaction.baseCurrency) return false;
  if (transaction.baseCurrency !== transaction.currency) return true;
  return Math.abs(transaction.baseAmount - transaction.amount) > epsilon;
}

export function formatTransactionBaseAmount(transaction: TransactionWithMeta) {
  if (!shouldShowBaseAmountLine(transaction)) return null;
  const signed = signedAmountForDisplay(transaction, transaction.baseAmount);
  return `${isIncomeLike(transaction.type) ? '+' : ''}${formatMoney(signed, transaction.baseCurrency)}`;
}
