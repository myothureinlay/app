import { defaultRatesToBase } from '../constants/currencies';
import type { BaseCurrency, TransactionWithMeta, Wallet } from '../types';
import { isExpenseLike, isIncomeLike } from './ledger';

export interface ReportSummary {
  income: number;
  expenses: number;
  interestIncome: number;
  interestExpense: number;
  fees: number;
  taxes: number;
  losses: number;
  compensationReceived: number;
  compensationPaid: number;
  refunds: number;
  loanReceived: number;
  loanGiven: number;
  loanRepaymentPaid: number;
  loanRepaymentReceived: number;
  investments: number;
  netCashflow: number;
  liabilityMovement: number;
  receivableMovement: number;
}

export interface NamedTotal {
  key: string;
  label: string;
  total: number;
  color: string;
}

export interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  cashflow: number;
}

export interface HistoryRow {
  id: string;
  date: string;
  title: string;
  amount: number;
  subtitle: string;
}

function activeTransactions(transactions: TransactionWithMeta[]) {
  return transactions.filter((transaction) => !transaction.deletedAt);
}

function valueInBase(transaction: TransactionWithMeta, baseCurrency: BaseCurrency) {
  if (transaction.baseCurrency === baseCurrency) {
    return transaction.baseAmount;
  }
  return transaction.amount * defaultRatesToBase[baseCurrency][transaction.currency];
}

function monthKey(dateIso: string) {
  const date = new Date(dateIso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

export function calculateReportSummary(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency
): ReportSummary {
  return activeTransactions(transactions).reduce<ReportSummary>(
    (summary, transaction) => {
      const value = valueInBase(transaction, baseCurrency);

      if (isIncomeLike(transaction.type)) summary.income += value;
      if (isExpenseLike(transaction.type)) summary.expenses += value;
      if (transaction.type === 'interest_income') summary.interestIncome += value;
      if (transaction.type === 'interest_expense') summary.interestExpense += value;
      if (transaction.type === 'fee') summary.fees += value;
      if (transaction.type === 'tax') summary.taxes += value;
      if (transaction.type === 'loss') summary.losses += value;
      if (transaction.type === 'compensation_received') summary.compensationReceived += value;
      if (transaction.type === 'compensation_paid') summary.compensationPaid += value;
      if (transaction.type === 'refund') summary.refunds += value;
      if (transaction.type === 'loan_received') {
        summary.loanReceived += value;
        summary.liabilityMovement += value;
      }
      if (transaction.type === 'loan_repayment_paid') {
        summary.loanRepaymentPaid += value;
        summary.liabilityMovement -= value;
      }
      if (transaction.type === 'loan_given') {
        summary.loanGiven += value;
        summary.receivableMovement += value;
      }
      if (transaction.type === 'loan_repayment_received') {
        summary.loanRepaymentReceived += value;
        summary.receivableMovement -= value;
      }
      if (transaction.type === 'investment') summary.investments += value;

      if (!['transfer', 'exchange'].includes(transaction.type)) {
        if (
          [
            'income',
            'loan_received',
            'loan_repayment_received',
            'interest_income',
            'compensation_received',
            'refund',
            'adjustment',
          ].includes(transaction.type)
        ) {
          summary.netCashflow += value;
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
          ].includes(transaction.type)
        ) {
          summary.netCashflow -= value;
        }
      }

      return summary;
    },
    {
      income: 0,
      expenses: 0,
      interestIncome: 0,
      interestExpense: 0,
      fees: 0,
      taxes: 0,
      losses: 0,
      compensationReceived: 0,
      compensationPaid: 0,
      refunds: 0,
      loanReceived: 0,
      loanGiven: 0,
      loanRepaymentPaid: 0,
      loanRepaymentReceived: 0,
      investments: 0,
      netCashflow: 0,
      liabilityMovement: 0,
      receivableMovement: 0,
    }
  );
}

export function monthlyIncomeExpense(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency,
  months = 6
): MonthlyPoint[] {
  const today = new Date();
  const keys = Array.from({ length: months }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (months - index - 1), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });

  const rows = keys.reduce<Record<string, MonthlyPoint>>((acc, key) => {
    acc[key] = { key, label: monthLabel(key), income: 0, expenses: 0, cashflow: 0 };
    return acc;
  }, {});

  for (const transaction of activeTransactions(transactions)) {
    const key = monthKey(transaction.date);
    if (!rows[key]) continue;
    const value = valueInBase(transaction, baseCurrency);
    if (isIncomeLike(transaction.type)) rows[key].income += value;
    if (isExpenseLike(transaction.type) || transaction.type === 'loss') rows[key].expenses += value;
    if (!['transfer', 'exchange'].includes(transaction.type)) {
      rows[key].cashflow += [
        'income',
        'loan_received',
        'loan_repayment_received',
        'interest_income',
        'compensation_received',
        'refund',
        'adjustment',
      ].includes(transaction.type)
        ? value
        : -value;
    }
  }

  return keys.map((key) => rows[key]);
}

export function groupTransactionsByCategory(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency,
  mode: 'income' | 'expense'
): NamedTotal[] {
  const totals = activeTransactions(transactions).reduce<Record<string, NamedTotal>>((acc, transaction) => {
    const include = mode === 'income' ? isIncomeLike(transaction.type) : isExpenseLike(transaction.type) || transaction.type === 'loss';
    if (!include) return acc;

    const key = transaction.categoryId ?? `uncategorized-${mode}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        label: transaction.categoryName ?? 'Uncategorized',
        color: transaction.categoryColor ?? (mode === 'income' ? '#16A34A' : '#E5484D'),
        total: 0,
      };
    }
    acc[key].total += valueInBase(transaction, baseCurrency);
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) => b.total - a.total);
}

export function groupExpensesByCurrency(transactions: TransactionWithMeta[]): NamedTotal[] {
  const totals = activeTransactions(transactions).reduce<Record<string, NamedTotal>>((acc, transaction) => {
    if (!(isExpenseLike(transaction.type) || transaction.type === 'loss')) return acc;
    if (!acc[transaction.currency]) {
      acc[transaction.currency] = {
        key: transaction.currency,
        label: transaction.currency,
        color: transaction.categoryColor ?? '#E5484D',
        total: 0,
      };
    }
    acc[transaction.currency].total += transaction.amount;
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) => b.total - a.total);
}

export function walletDistribution(wallets: Wallet[], baseCurrency: BaseCurrency): NamedTotal[] {
  return wallets
    .filter((wallet) => !wallet.isArchived)
    .map((wallet) => ({
      key: wallet.id,
      label: wallet.name,
      color: wallet.color,
      total: wallet.balance * defaultRatesToBase[baseCurrency][wallet.currency],
    }))
    .filter((row) => Math.abs(row.total) > 0.000001)
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

export function totalWalletValue(wallets: Wallet[], baseCurrency: BaseCurrency) {
  return walletDistribution(wallets, baseCurrency).reduce((sum, wallet) => sum + wallet.total, 0);
}

export function topIndividualExpenses(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency,
  limit = 5
): HistoryRow[] {
  return activeTransactions(transactions)
    .filter((transaction) => isExpenseLike(transaction.type) || transaction.type === 'loss')
    .sort((a, b) => valueInBase(b, baseCurrency) - valueInBase(a, baseCurrency))
    .slice(0, limit)
    .map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      title: transaction.categoryName ?? transaction.type,
      amount: valueInBase(transaction, baseCurrency),
      subtitle: `${transaction.walletName} · ${transaction.currency}`,
    }));
}

export function historyByTypes(
  transactions: TransactionWithMeta[],
  types: string[],
  baseCurrency: BaseCurrency,
  limit = 8
): HistoryRow[] {
  return activeTransactions(transactions)
    .filter((transaction) => types.includes(transaction.type))
    .slice(0, limit)
    .map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      title: transaction.categoryName ?? transaction.type,
      amount: valueInBase(transaction, baseCurrency),
      subtitle: transaction.toWalletName
        ? `${transaction.walletName} -> ${transaction.toWalletName}`
        : transaction.counterparty || transaction.walletName,
    }));
}
