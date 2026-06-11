import assert from 'node:assert/strict';

import { categoryTypeForTransaction, getWalletDeltas } from '../src/logic/ledger';
import { calculateReportSummary, groupTransactionsByCategory } from '../src/logic/reports';
import type { TransactionType, TransactionWithMeta } from '../src/types';

function tx(type: TransactionType, amount: number, overrides: Partial<TransactionWithMeta> = {}): TransactionWithMeta {
  return {
    id: `${type}-${amount}`,
    type,
    amount,
    currency: 'USD',
    walletId: 'wallet-a',
    toWalletId: null,
    toAmount: null,
    toCurrency: null,
    categoryId: overrides.categoryId ?? `${type}-category`,
    date: '2026-06-01T12:00:00.000Z',
    note: null,
    exchangeRate: 1,
    baseCurrency: 'USD',
    baseAmount: amount,
    counterparty: null,
    relatedTransactionId: null,
    feeAmount: 0,
    feeCurrency: null,
    metadata: null,
    deletedAt: null,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
    walletName: 'Wallet A',
    walletColor: '#000000',
    toWalletName: null,
    categoryName: overrides.categoryName ?? type,
    categoryColor: overrides.categoryColor ?? '#16A34A',
    categoryIcon: null,
    ...overrides,
  };
}

function applyBalance(balance: Record<string, number>, transaction: TransactionWithMeta, multiplier = 1) {
  for (const delta of getWalletDeltas(transaction)) {
    balance[delta.walletId] = (balance[delta.walletId] ?? 0) + delta.amount * multiplier;
  }
}

function run() {
  assert.deepEqual(getWalletDeltas(tx('income', 100)), [{ walletId: 'wallet-a', amount: 100 }], 'income increases balance');
  assert.deepEqual(getWalletDeltas(tx('expense', 40)), [{ walletId: 'wallet-a', amount: -40 }], 'expense decreases balance');
  assert.deepEqual(
    getWalletDeltas(tx('exchange', 100, { toWalletId: 'wallet-b', toAmount: 420000, feeAmount: 2 })),
    [
      { walletId: 'wallet-a', amount: -102 },
      { walletId: 'wallet-b', amount: 420000 },
    ],
    'exchange moves funds and subtracts fee'
  );

  const balance: Record<string, number> = { 'wallet-a': 0 };
  const oldExpense = tx('expense', 25);
  const newExpense = tx('expense', 10);
  applyBalance(balance, oldExpense);
  applyBalance(balance, oldExpense, -1);
  applyBalance(balance, newExpense);
  assert.equal(balance['wallet-a'], -10, 'edit transaction recalculates by reversing old and applying new');
  applyBalance(balance, newExpense, -1);
  assert.equal(balance['wallet-a'], 0, 'delete transaction reverses balance impact');

  assert.deepEqual(getWalletDeltas(tx('loan_received', 250)), [{ walletId: 'wallet-a', amount: 250 }], 'loan_received increases cash');
  assert.deepEqual(getWalletDeltas(tx('loan_given', 250)), [{ walletId: 'wallet-a', amount: -250 }], 'loan_given decreases cash');
  assert.deepEqual(getWalletDeltas(tx('loan_repayment_paid', 80)), [{ walletId: 'wallet-a', amount: -80 }], 'loan repayment paid decreases cash');
  assert.deepEqual(getWalletDeltas(tx('loan_repayment_received', 80)), [{ walletId: 'wallet-a', amount: 80 }], 'loan repayment received increases cash');

  const summary = calculateReportSummary(
    [
      tx('income', 1000),
      tx('expense', 300),
      tx('interest_income', 20),
      tx('interest_expense', 10),
      tx('loss', 50),
      tx('fee', 5),
      tx('tax', 30),
      tx('compensation_received', 70),
      tx('compensation_paid', 25),
      tx('loan_received', 200),
      tx('loan_given', 100),
      tx('loan_repayment_paid', 40),
      tx('loan_repayment_received', 30),
    ],
    'USD'
  );

  assert.equal(summary.income, 1090, 'income-like reports include income, interest, compensation received, and refunds');
  assert.equal(summary.expenses, 370, 'expense-like reports include expenses, interest expense, fees, tax, and compensation paid');
  assert.equal(summary.losses, 50, 'loss is reported separately');
  assert.equal(summary.compensationReceived, 70, 'compensation received summary');
  assert.equal(summary.compensationPaid, 25, 'compensation paid summary');
  assert.equal(summary.liabilityMovement, 160, 'loan_received minus repayment paid affects liability');
  assert.equal(summary.receivableMovement, 70, 'loan_given minus repayment received affects receivable');

  assert.equal(categoryTypeForTransaction('loan_given'), 'loan', 'loan given maps to loan category type');
  assert.equal(categoryTypeForTransaction('loan_received'), 'debt', 'loan received maps to debt category type');
  assert.equal(categoryTypeForTransaction('transfer'), 'transfer', 'transfer maps to transfer category type');

  const grouped = groupTransactionsByCategory(
    [
      tx('expense', 20, { categoryId: 'food', categoryName: 'Food', categoryColor: '#ff0000' }),
      tx('expense', 30, { categoryId: 'food', categoryName: 'Food', categoryColor: '#ff0000' }),
      tx('income', 50, { categoryId: 'salary', categoryName: 'Salary' }),
    ],
    'USD',
    'expense'
  );
  assert.equal(grouped[0].label, 'Food', 'category report groups by category name');
  assert.equal(grouped[0].total, 50, 'category report totals amounts');
}

run();
console.log('Ledger V2 tests passed');
