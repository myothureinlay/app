import { getRateToBase } from '../constants/currencies';
import type { BaseCurrency, BudgetWithUsage, GoalWithProgress, InvestmentRecord, TransactionWithMeta, Wallet } from '../types';
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

export type ReportInsightType =
  | 'no_data'
  | 'positive_cashflow'
  | 'negative_cashflow'
  | 'high_expense_ratio'
  | 'no_income'
  | 'top_category'
  | 'largest_transaction'
  | 'expense_trend_up'
  | 'expense_trend_down'
  | 'budget_warning'
  | 'goal_suggestion'
  | 'fee_loss_tax_warning'
  | 'investment_concentration';

export interface ReportInsight {
  type: ReportInsightType;
  severity: 'positive' | 'info' | 'warning';
  icon: string;
  amount?: number;
  currency?: BaseCurrency;
  label?: string;
  ratio?: number;
}

export interface ReportInsightInput {
  transactions: TransactionWithMeta[];
  summary: ReportSummary;
  expenseByCategory: NamedTotal[];
  trend: MonthlyPoint[];
  budgets?: BudgetWithUsage[];
  goals?: GoalWithProgress[];
  investments?: InvestmentRecord[];
  baseCurrency: BaseCurrency;
}

function activeTransactions(transactions: TransactionWithMeta[]) {
  return transactions.filter((transaction) => !transaction.deletedAt);
}

function valueInBase(transaction: TransactionWithMeta, baseCurrency: BaseCurrency) {
  if (transaction.baseCurrency === baseCurrency) {
    return transaction.baseAmount;
  }
  return transaction.amount * getRateToBase(baseCurrency, transaction.currency);
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

export function groupTransactionsByParentCategory(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency,
  mode: 'income' | 'expense'
): NamedTotal[] {
  const totals = activeTransactions(transactions).reduce<Record<string, NamedTotal>>((acc, transaction) => {
    const include = mode === 'income' ? isIncomeLike(transaction.type) : isExpenseLike(transaction.type) || transaction.type === 'loss';
    if (!include) return acc;

    const key = transaction.parentCategoryId ?? transaction.categoryId ?? `uncategorized-parent-${mode}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        label: transaction.parentCategoryName ?? transaction.categoryName ?? 'Uncategorized',
        color: transaction.parentCategoryColor ?? transaction.categoryColor ?? (mode === 'income' ? '#16A34A' : '#E5484D'),
        total: 0,
      };
    }
    acc[key].total += valueInBase(transaction, baseCurrency);
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) => b.total - a.total);
}

export function groupTransactionsBySubcategory(
  transactions: TransactionWithMeta[],
  baseCurrency: BaseCurrency,
  mode: 'income' | 'expense'
): NamedTotal[] {
  const totals = activeTransactions(transactions).reduce<Record<string, NamedTotal>>((acc, transaction) => {
    const include = mode === 'income' ? isIncomeLike(transaction.type) : isExpenseLike(transaction.type) || transaction.type === 'loss';
    if (!include) return acc;

    const key = transaction.subcategoryId ?? `no-subcategory-${mode}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        label: transaction.subcategoryName ?? 'No subcategory',
        color: transaction.subcategoryColor ?? transaction.categoryColor ?? (mode === 'income' ? '#16A34A' : '#E5484D'),
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

function largestReportTransaction(transactions: TransactionWithMeta[], baseCurrency: BaseCurrency) {
  return activeTransactions(transactions)
    .filter((transaction) => transaction.type !== 'transfer' && transaction.type !== 'exchange')
    .sort((a, b) => Math.abs(valueInBase(b, baseCurrency)) - Math.abs(valueInBase(a, baseCurrency)))[0];
}

function expenseTrendInsight(trend: MonthlyPoint[]): ReportInsight | null {
  const points = trend.filter((point) => point.expenses > 0);
  if (points.length < 2) return null;

  const first = points[0];
  const latest = points[points.length - 1];
  if (latest.expenses >= first.expenses * 1.2) {
    return {
      type: 'expense_trend_up',
      severity: 'warning',
      icon: 'trending-up-outline',
      amount: latest.expenses - first.expenses,
    };
  }

  if (latest.expenses <= first.expenses * 0.8) {
    return {
      type: 'expense_trend_down',
      severity: 'positive',
      icon: 'trending-down-outline',
      amount: first.expenses - latest.expenses,
    };
  }

  return null;
}

function investmentConcentrationInsight(investments: InvestmentRecord[], baseCurrency: BaseCurrency): ReportInsight | null {
  const totals = investments
    .filter((investment) => !investment.deletedAt)
    .reduce<Record<string, number>>((acc, investment) => {
      const value = Math.abs(investment.currentValue ?? investment.amount ?? 0) * getRateToBase(baseCurrency, investment.currency);
      if (value <= 0) return acc;
      const key = investment.assetName || investment.assetType;
      acc[key] = (acc[key] ?? 0) + value;
      return acc;
    }, {});

  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  if (rows.length < 2 || total <= 0) return null;

  const [label, amount] = rows[0];
  const ratio = amount / total;
  if (ratio < 0.7) return null;

  return {
    type: 'investment_concentration',
    severity: 'warning',
    icon: 'pie-chart-outline',
    amount,
    currency: baseCurrency,
    label,
    ratio,
  };
}

export function generateReportInsights({
  transactions,
  summary,
  expenseByCategory,
  trend,
  budgets = [],
  goals = [],
  investments = [],
  baseCurrency,
}: ReportInsightInput): ReportInsight[] {
  const rows = activeTransactions(transactions);
  if (rows.length === 0) {
    return [{ type: 'no_data', severity: 'info', icon: 'information-circle-outline' }];
  }

  const insights: ReportInsight[] = [];
  const totalOutflow = summary.expenses + summary.losses + summary.investments;
  const savingsRate = summary.income > 0 ? summary.netCashflow / summary.income : 0;
  const overBudget = budgets.find((budget) => budget.isOverBudget);
  const feeLossTaxTotal = summary.fees + summary.losses + summary.taxes;
  const largest = largestReportTransaction(rows, baseCurrency);
  const trendInsight = expenseTrendInsight(trend);
  const concentration = investmentConcentrationInsight(investments, baseCurrency);

  if (overBudget) {
    insights.push({
      type: 'budget_warning',
      severity: 'warning',
      icon: 'speedometer-outline',
      label: overBudget.categoryName ?? overBudget.name,
      amount: (overBudget.usedAmount - overBudget.amountLimit) * getRateToBase(baseCurrency, overBudget.currency),
      currency: baseCurrency,
    });
  }

  if (summary.netCashflow < 0) {
    insights.push({
      type: 'negative_cashflow',
      severity: 'warning',
      icon: 'alert-circle-outline',
      amount: Math.abs(summary.netCashflow),
      currency: baseCurrency,
    });
  } else if (summary.netCashflow > 0) {
    insights.push({
      type: 'positive_cashflow',
      severity: 'positive',
      icon: 'checkmark-circle-outline',
      amount: summary.netCashflow,
      currency: baseCurrency,
      ratio: savingsRate,
    });
  }

  if (summary.income <= 0 && totalOutflow > 0) {
    insights.push({ type: 'no_income', severity: 'warning', icon: 'trending-down-outline', amount: totalOutflow, currency: baseCurrency });
  } else if (summary.income > 0 && totalOutflow / summary.income >= 0.8) {
    insights.push({
      type: 'high_expense_ratio',
      severity: 'warning',
      icon: 'speedometer-outline',
      ratio: totalOutflow / summary.income,
    });
  }

  const topCategory = expenseByCategory[0];
  if (topCategory && topCategory.total > 0) {
    insights.push({
      type: 'top_category',
      severity: 'info',
      icon: 'pricetag-outline',
      label: topCategory.label,
      amount: topCategory.total,
      currency: baseCurrency,
    });
  }

  if (largest) {
    insights.push({
      type: 'largest_transaction',
      severity: 'info',
      icon: 'receipt-outline',
      label: largest.categoryName ?? largest.note ?? largest.type,
      amount: valueInBase(largest, baseCurrency),
      currency: baseCurrency,
    });
  }

  if (trendInsight) {
    insights.push({ ...trendInsight, currency: baseCurrency });
  }

  if (feeLossTaxTotal > 0 && (summary.income <= 0 || feeLossTaxTotal / Math.max(summary.income, totalOutflow, 1) >= 0.15)) {
    insights.push({
      type: 'fee_loss_tax_warning',
      severity: 'warning',
      icon: 'warning-outline',
      amount: feeLossTaxTotal,
      currency: baseCurrency,
    });
  }

  if (goals.some((goal) => goal.status === 'active') && summary.netCashflow > 0) {
    insights.push({
      type: 'goal_suggestion',
      severity: 'positive',
      icon: 'flag-outline',
      amount: summary.netCashflow,
      currency: baseCurrency,
    });
  }

  if (concentration) {
    insights.push(concentration);
  }

  return insights.slice(0, 8);
}

export function walletDistribution(wallets: Wallet[], baseCurrency: BaseCurrency): NamedTotal[] {
  return wallets
    .filter((wallet) => !wallet.isArchived)
    .map((wallet) => ({
      key: wallet.id,
      label: wallet.name,
      color: wallet.color,
      total: wallet.balance * getRateToBase(baseCurrency, wallet.currency),
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
