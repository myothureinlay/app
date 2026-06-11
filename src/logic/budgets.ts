import type { Budget, BudgetWithUsage, TransactionWithMeta } from '../types';
import { isExpenseLike } from './ledger';

export function calculateBudgetUsage(
  budget: Budget,
  transactions: TransactionWithMeta[],
  from = budget.startDate,
  to = budget.endDate ?? new Date().toISOString()
) {
  return transactions
    .filter((transaction) => !transaction.deletedAt)
    .filter((transaction) => isExpenseLike(transaction.type) || transaction.type === 'loss')
    .filter((transaction) => !budget.categoryId || transaction.categoryId === budget.categoryId)
    .filter((transaction) => transaction.currency === budget.currency)
    .filter((transaction) => new Date(transaction.date) >= new Date(from) && new Date(transaction.date) <= new Date(to))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function enrichBudgetWithUsage(
  budget: Budget,
  transactions: TransactionWithMeta[],
  categoryName?: string | null,
  categoryColor?: string | null
): BudgetWithUsage {
  const usedAmount = calculateBudgetUsage(budget, transactions);
  const remainingAmount = budget.amountLimit - usedAmount;
  const progress = budget.amountLimit > 0 ? Math.min(999, (usedAmount / budget.amountLimit) * 100) : 0;

  return {
    ...budget,
    categoryName,
    categoryColor,
    usedAmount,
    remainingAmount,
    progress,
    isOverBudget: usedAmount > budget.amountLimit,
  };
}
