import type { CategoryType, CurrencyCode, Transaction, TransactionType } from '../types';

export const transactionTypes: TransactionType[] = [
  'income',
  'expense',
  'exchange',
  'adjustment',
  'loan_given',
  'loan_received',
  'loan_repayment_paid',
  'loan_repayment_received',
  'interest_income',
  'interest_expense',
  'fee',
  'loss',
  'compensation_received',
  'compensation_paid',
  'refund',
  'tax',
  'investment',
  'transfer',
];

export const categoryTypes: CategoryType[] = [
  'income',
  'expense',
  'loan',
  'debt',
  'transfer',
  'adjustment',
  'other',
];

export const transactionTypeIcons: Record<TransactionType, string> = {
  income: 'trending-up-outline',
  expense: 'trending-down-outline',
  exchange: 'swap-horizontal-outline',
  adjustment: 'options-outline',
  loan_given: 'arrow-up-circle-outline',
  loan_received: 'arrow-down-circle-outline',
  loan_repayment_paid: 'return-up-forward-outline',
  loan_repayment_received: 'return-down-back-outline',
  interest_income: 'sparkles-outline',
  interest_expense: 'time-outline',
  fee: 'receipt-outline',
  loss: 'alert-circle-outline',
  compensation_received: 'medkit-outline',
  compensation_paid: 'shield-outline',
  refund: 'refresh-circle-outline',
  tax: 'document-text-outline',
  investment: 'bar-chart-outline',
  transfer: 'repeat-outline',
};

export const reportColorByType: Record<TransactionType, string> = {
  income: '#16A34A',
  expense: '#E5484D',
  exchange: '#5E6AD2',
  adjustment: '#64748B',
  loan_given: '#F97316',
  loan_received: '#0EA5E9',
  loan_repayment_paid: '#FB7185',
  loan_repayment_received: '#22C55E',
  interest_income: '#14B8A6',
  interest_expense: '#F59E0B',
  fee: '#F97316',
  loss: '#DC2626',
  compensation_received: '#10B981',
  compensation_paid: '#A855F7',
  refund: '#22C55E',
  tax: '#B45309',
  investment: '#6366F1',
  transfer: '#64748B',
};

export interface WalletDelta {
  walletId: string;
  amount: number;
}

export type LedgerTransactionInput = Pick<
  Transaction,
  'type' | 'amount' | 'walletId' | 'toWalletId' | 'toAmount' | 'feeAmount'
>;

export function categoryTypeForTransaction(type: TransactionType): CategoryType {
  if (['income', 'interest_income', 'refund', 'compensation_received'].includes(type)) {
    return 'income';
  }

  if (['expense', 'interest_expense', 'fee', 'loss', 'compensation_paid', 'tax'].includes(type)) {
    return 'expense';
  }

  if (['loan_given', 'loan_repayment_received'].includes(type)) {
    return 'loan';
  }

  if (['loan_received', 'loan_repayment_paid'].includes(type)) {
    return 'debt';
  }

  if (['transfer', 'exchange'].includes(type)) {
    return 'transfer';
  }

  if (['adjustment', 'investment'].includes(type)) {
    return 'adjustment';
  }

  return 'other';
}

export function isIncomeLike(type: TransactionType) {
  return ['income', 'interest_income', 'refund', 'compensation_received'].includes(type);
}

export function isExpenseLike(type: TransactionType) {
  return ['expense', 'interest_expense', 'fee', 'tax', 'compensation_paid'].includes(type);
}

export function isLoanOrDebt(type: TransactionType) {
  return [
    'loan_given',
    'loan_received',
    'loan_repayment_paid',
    'loan_repayment_received',
  ].includes(type);
}

export function isNeutralTransfer(type: TransactionType) {
  return type === 'transfer' || type === 'exchange';
}

export function getCashDirection(type: TransactionType): -1 | 0 | 1 {
  if (
    [
      'income',
      'loan_received',
      'loan_repayment_received',
      'interest_income',
      'compensation_received',
      'refund',
      'adjustment',
    ].includes(type)
  ) {
    return 1;
  }

  if (
    [
      'expense',
      'loan_given',
      'loan_repayment_paid',
      'interest_expense',
      'fee',
      'loss',
      'compensation_paid',
      'tax',
      'investment',
    ].includes(type)
  ) {
    return -1;
  }

  return 0;
}

export function getWalletDeltas(input: LedgerTransactionInput): WalletDelta[] {
  const feeAmount = input.feeAmount ?? 0;

  if (input.type === 'transfer' || input.type === 'exchange') {
    const deltas: WalletDelta[] = [
      {
        walletId: input.walletId,
        amount: -(input.amount + feeAmount),
      },
    ];

    if (input.toWalletId) {
      deltas.push({
        walletId: input.toWalletId,
        amount: input.toAmount ?? input.amount,
      });
    }

    return compactWalletDeltas(deltas);
  }

  const direction = getCashDirection(input.type);
  return direction === 0
    ? []
    : compactWalletDeltas([{ walletId: input.walletId, amount: input.amount * direction }]);
}

export function compactWalletDeltas(deltas: WalletDelta[]) {
  const totals = deltas.reduce<Record<string, number>>((acc, delta) => {
    if (!delta.walletId || !Number.isFinite(delta.amount)) return acc;
    acc[delta.walletId] = (acc[delta.walletId] ?? 0) + delta.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([walletId, amount]) => ({ walletId, amount }))
    .filter((delta) => Math.abs(delta.amount) > 0.000001);
}

export function formatTransactionType(type: TransactionType) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function transactionNeedsDestination(type: TransactionType) {
  return type === 'transfer' || type === 'exchange';
}

export function transactionSupportsCounterparty(type: TransactionType) {
  return isLoanOrDebt(type) || type.startsWith('compensation');
}

export function transactionSupportsFees(type: TransactionType) {
  return type === 'exchange' || type === 'transfer' || type === 'investment';
}

export function normalizeFeeCurrency(currency: CurrencyCode, feeCurrency?: CurrencyCode | null) {
  return feeCurrency ?? currency;
}
