import assert from 'node:assert/strict';

import { BUILD_INFO } from '../src/constants/build';
import { calculateBudgetUsage, enrichBudgetWithUsage } from '../src/logic/budgets';
import { manualSections } from '../src/constants/manual';
import { en } from '../src/i18n/locales/en';
import { my } from '../src/i18n/locales/my';
import { th } from '../src/i18n/locales/th';
import { zhHans } from '../src/i18n/locales/zh-Hans';
import { buildCategoryTree, categoryDisplayName } from '../src/logic/categories';
import { dateRangeForPreset, formatDateRangeLabel, isWithinDateRange } from '../src/logic/dateRanges';
import { applyGoalContribution, calculateGoalProgress } from '../src/logic/goals';
import { calculateInvestmentSummary, investmentAllocation } from '../src/logic/investments';
import { categoryTypeForTransaction, getWalletDeltas } from '../src/logic/ledger';
import { mergeUserProfile, normalizeUserProfile } from '../src/logic/profile';
import {
  calculateReportSummary,
  generateReportInsights,
  groupTransactionsByCategory,
  groupTransactionsByParentCategory,
  groupTransactionsBySubcategory,
  monthlyIncomeExpense,
} from '../src/logic/reports';
import { formatTransactionBaseAmount, formatTransactionPrimaryAmount } from '../src/logic/transactionDisplay';
import { initialTransactionCurrencyState } from '../src/logic/transactionFormState';
import { getCategoryRemoveDecision, getWalletRemoveDecision } from '../src/logic/removal';
import { iconForTab, mainTabConfig } from '../src/navigation/tabConfig';
import { iconForStyle } from '../src/utils/icons';
import { formatMoney } from '../src/utils/money';
import type { AppSettings, BackupPayload, Budget, Category, Goal, InvestmentRecord, TransactionType, TransactionWithMeta } from '../src/types';

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
    parentCategoryId: overrides.parentCategoryId ?? overrides.categoryId ?? `${type}-category`,
    subcategoryId: overrides.subcategoryId ?? null,
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
    parentCategoryName: overrides.parentCategoryName ?? overrides.categoryName ?? type,
    parentCategoryColor: overrides.parentCategoryColor ?? overrides.categoryColor ?? '#16A34A',
    parentCategoryIcon: null,
    subcategoryName: overrides.subcategoryName ?? null,
    subcategoryColor: overrides.subcategoryColor ?? null,
    subcategoryIcon: null,
    ...overrides,
  };
}

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-food',
    parentId: null,
    name: 'Food',
    type: 'expense',
    icon: 'restaurant-outline',
    color: '#ff0000',
    sortOrder: 0,
    isDefault: true,
    isArchived: false,
    removedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function investment(overrides: Partial<InvestmentRecord> = {}): InvestmentRecord {
  return {
    id: 'inv-btc',
    type: 'buy',
    assetType: 'crypto',
    assetName: 'BTC',
    quantity: 1,
    unitPrice: 100,
    amount: 100,
    currency: 'USD',
    walletId: null,
    transactionId: null,
    currentValue: null,
    realizedProfitLoss: 0,
    unrealizedProfitLoss: 0,
    date: '2026-06-01T12:00:00.000Z',
    note: null,
    deletedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function applyBalance(balance: Record<string, number>, transaction: TransactionWithMeta, multiplier = 1) {
  for (const delta of getWalletDeltas(transaction)) {
    balance[delta.walletId] = (balance[delta.walletId] ?? 0) + delta.amount * multiplier;
  }
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-food',
    name: 'Food budget',
    categoryId: 'food',
    currency: 'USD',
    amountLimit: 100,
    period: 'monthly',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T23:59:59.999Z',
    notes: null,
    alertThreshold: 80,
    isRemoved: false,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-emergency',
    name: 'Emergency fund',
    type: 'emergency_fund',
    targetAmount: 500,
    currency: 'USD',
    currentAmount: 200,
    monthlyTargetAmount: 75,
    deadline: null,
    linkedWalletId: null,
    notes: null,
    icon: 'flag-outline',
    color: '#0EA5E9',
    status: 'active',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function run() {
  assert.equal(BUILD_INFO.appVersion, '7.3.0', 'V7.3 build info version is current');
  assert.equal(BUILD_INFO.label, 'Mobile V7.3 UI refinement', 'V7.3 build label is current');
  assert.equal(en.dashboard.v7Label, 'Mobile V7.3', 'dashboard build pill uses V7.3 label');
  for (const locale of [en, my, th, zhHans]) {
    assert.ok(locale.dashboard.openProfile, 'profile accessibility label exists');
    assert.ok(locale.dashboard.openSettings, 'settings accessibility label exists');
    assert.ok(locale.dashboard.openNotifications, 'notifications accessibility label exists');
  }

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

  const hierarchicalGrouped = groupTransactionsByParentCategory(
    [
      tx('expense', 20, {
        categoryId: 'food-dining',
        parentCategoryId: 'food',
        subcategoryId: 'dining',
        parentCategoryName: 'Food',
        subcategoryName: 'Dining out',
      }),
      tx('expense', 30, {
        categoryId: 'food-groceries',
        parentCategoryId: 'food',
        subcategoryId: 'groceries',
        parentCategoryName: 'Food',
        subcategoryName: 'Groceries',
      }),
    ],
    'USD',
    'expense'
  );
  assert.equal(hierarchicalGrouped[0].label, 'Food', 'parent category report groups multiple subcategories');
  assert.equal(hierarchicalGrouped[0].total, 50, 'parent category report totals subcategories');

  const subcategoryGrouped = groupTransactionsBySubcategory(
    [
      tx('expense', 12, { parentCategoryId: 'food', subcategoryId: 'dining', subcategoryName: 'Dining out' }),
      tx('expense', 8, { parentCategoryId: 'food', subcategoryId: 'dining', subcategoryName: 'Dining out' }),
    ],
    'USD',
    'expense'
  );
  assert.equal(subcategoryGrouped[0].label, 'Dining out', 'subcategory report groups by child category');
  assert.equal(subcategoryGrouped[0].total, 20, 'subcategory report totals amounts');

  const categoryTree = buildCategoryTree([
    category({ id: 'food', name: 'Food', sortOrder: 2 }),
    category({ id: 'housing', name: 'Housing', sortOrder: 1 }),
    category({ id: 'dining', parentId: 'food', name: 'Dining out', sortOrder: 1 }),
    category({ id: 'groceries', parentId: 'food', name: 'Groceries', sortOrder: 0 }),
  ]);
  assert.deepEqual(categoryTree.map((node) => node.id), ['housing', 'food'], 'category tree sorts parent categories');
  assert.deepEqual(categoryTree.find((node) => node.id === 'food')?.children.map((node) => node.id), ['groceries', 'dining'], 'category tree sorts subcategories');
  assert.equal(categoryDisplayName(categoryTree.flatMap((node) => [node, ...node.children]), 'dining'), 'Food -> Dining out', 'category display includes parent path');

  const investmentSummary = calculateInvestmentSummary(
    [
      investment({ type: 'buy', amount: 100, currentValue: 130, unrealizedProfitLoss: 30 }),
      investment({ id: 'inv-sell', type: 'sell', amount: 25, currentValue: 0, realizedProfitLoss: 5 }),
      investment({ id: 'inv-fee', type: 'fee', amount: 2, currentValue: 0 }),
      investment({ id: 'inv-income', type: 'income', amount: 3, currentValue: 0 }),
      investment({ id: 'inv-deleted', amount: 999, deletedAt: '2026-06-02T00:00:00.000Z' }),
    ],
    'USD'
  );
  assert.equal(investmentSummary.totalInvested, 75, 'investment summary nets buys and sells');
  assert.equal(investmentSummary.currentValue, 130, 'investment summary uses user-entered current value');
  assert.equal(investmentSummary.realizedProfitLoss, 5, 'investment summary totals realized profit/loss');
  assert.equal(investmentSummary.unrealizedProfitLoss, 30, 'investment summary totals unrealized profit/loss');
  assert.equal(investmentSummary.fees, 2, 'investment summary tracks fees');
  assert.equal(investmentSummary.income, 3, 'investment summary tracks investment income');
  assert.equal(investmentAllocation([investment({ assetType: 'crypto' }), investment({ id: 'inv-gold', assetType: 'gold', amount: 80, currentValue: 90 })], 'USD').length, 2, 'investment allocation groups by asset type');

  assert.deepEqual(
    mainTabConfig.map((tab) => tab.name),
    ['Dashboard', 'Records', 'Reports', 'Investments'],
    'V7 bottom tabs are exactly Dashboard, Records, Reports, Investments'
  );
  assert.equal(iconForTab('Records'), 'receipt-outline', 'records tab uses receipt icon');

  assert.equal(getCategoryRemoveDecision(0).action, 'hard_delete', 'unused category can be hard deleted');
  const usedCategoryDecision = getCategoryRemoveDecision(2);
  assert.equal(usedCategoryDecision.action, 'soft_remove', 'used category is soft removed');
  assert.equal(
    usedCategoryDecision.warning,
    'This category is used by past transactions. Removing it will hide it from new entries but keep your history safe.',
    'used category warning protects history'
  );

  assert.equal(
    getWalletRemoveDecision({ transactionCount: 0, balance: 0, isDefault: false }).action,
    'hard_delete',
    'unused zero-balance custom wallet can be hard deleted'
  );
  assert.equal(
    getWalletRemoveDecision({ transactionCount: 1, balance: 0, isDefault: false }).action,
    'soft_remove',
    'wallet with history is soft removed'
  );
  assert.equal(
    getWalletRemoveDecision({ transactionCount: 0, balance: 5, isDefault: false }).action,
    'soft_remove',
    'non-zero wallet is soft removed'
  );
  assert.equal(
    getWalletRemoveDecision({ transactionCount: 0, balance: 0, isDefault: true }).action,
    'soft_remove',
    'default wallet is not permanently deleted'
  );

  const juneRange = dateRangeForPreset('this_month', new Date('2026-06-15T12:00:00.000Z'));
  assert.equal(isWithinDateRange('2026-06-01T00:00:00.000Z', juneRange), true, 'this month includes first day');
  assert.equal(isWithinDateRange('2026-07-01T00:00:00.000Z', juneRange), false, 'this month excludes next month');
  assert.equal(formatDateRangeLabel(juneRange, 'en-US'), 'Jun 1 – Jun 30, 2026', 'date range label is readable');
  const customRange = dateRangeForPreset('custom', new Date('2026-06-15T12:00:00.000Z'), {
    from: '2026-06-10',
    to: '2026-06-12',
  });
  assert.equal(isWithinDateRange('2026-06-11T12:00:00.000Z', customRange), true, 'custom range includes middle date');
  assert.equal(isWithinDateRange('2026-06-13T00:00:00.000Z', customRange), false, 'custom range excludes outside date');

  const foodBudget = budget();
  const budgetTransactions = [
    tx('expense', 60, { categoryId: 'food', currency: 'USD', date: '2026-06-05T12:00:00.000Z' }),
    tx('loss', 60, { categoryId: 'food', currency: 'USD', date: '2026-06-10T12:00:00.000Z' }),
    tx('expense', 20, { categoryId: 'travel', currency: 'USD', date: '2026-06-10T12:00:00.000Z' }),
    tx('income', 999, { categoryId: 'food', currency: 'USD', date: '2026-06-10T12:00:00.000Z' }),
    tx('expense', 30, { categoryId: 'food', currency: 'USD', date: '2026-07-01T12:00:00.000Z' }),
    tx('expense', 30, { categoryId: 'food', currency: 'EUR', date: '2026-06-10T12:00:00.000Z' }),
  ];
  assert.equal(calculateBudgetUsage(foodBudget, budgetTransactions), 120, 'budget usage filters by date, category, currency, and expense-like types');
  const budgetUsage = enrichBudgetWithUsage(foodBudget, budgetTransactions, 'Food', '#ff0000');
  assert.equal(budgetUsage.progress, 120, 'budget progress reflects usage over limit');
  assert.equal(budgetUsage.isOverBudget, true, 'budget flags over-budget status');
  assert.equal(budgetUsage.remainingAmount, -20, 'budget remaining can show overage');

  const emergencyGoal = goal();
  const progress = calculateGoalProgress(emergencyGoal);
  assert.equal(progress.progress, 40, 'goal progress uses current over target amount');
  assert.equal(progress.remainingAmount, 300, 'goal remaining amount is calculated');
  assert.equal(progress.suggestedMonthlySaving, 75, 'goal uses monthly target when no deadline is set');
  const completedGoal = applyGoalContribution(emergencyGoal, { amount: 300 });
  assert.equal(completedGoal.currentAmount, 500, 'goal contribution increases current amount');
  assert.equal(completedGoal.status, 'completed', 'goal contribution completes target');

  const thbExpense = tx('expense', 300, {
    currency: 'THB',
    baseCurrency: 'USD',
    baseAmount: 8.5,
    exchangeRate: 0.0283333333,
  });
  const thbEditState = initialTransactionCurrencyState(thbExpense, 'MMK', 'MMK');
  assert.equal(thbEditState.currency, 'THB', 'edit state preserves THB transaction currency');
  assert.equal(thbEditState.baseCurrency, 'USD', 'edit state preserves saved USD base currency');
  assert.equal(thbEditState.baseAmount, 8.5, 'edit state preserves base amount');

  const usdtIncome = tx('income', 125, {
    currency: 'USDT',
    baseCurrency: 'USD',
    baseAmount: 125,
    exchangeRate: 1,
  });
  const usdtEditState = initialTransactionCurrencyState(usdtIncome, 'MMK', 'MMK');
  assert.equal(usdtEditState.currency, 'USDT', 'edit state preserves USDT income currency');
  assert.equal(usdtEditState.baseCurrency, 'USD', 'edit state preserves USDT income base currency');

  const exchangeRecord = tx('exchange', 100, {
    currency: 'USDT',
    baseCurrency: 'USD',
    baseAmount: 100,
    exchangeRate: 1,
    toWalletId: 'cash-mmk',
    toAmount: 360000,
    toCurrency: 'MMK',
  });
  const exchangeEditState = initialTransactionCurrencyState(exchangeRecord, 'THB', 'THB');
  assert.equal(exchangeEditState.currency, 'USDT', 'exchange edit preserves source currency');
  assert.equal(exchangeEditState.baseCurrency, 'USD', 'exchange edit preserves base currency');
  assert.equal(exchangeEditState.toCurrency, 'MMK', 'exchange edit preserves destination currency');
  assert.equal(exchangeEditState.toAmount, 360000, 'exchange edit preserves destination amount');

  assert.equal(formatMoney(-300, 'MMK'), '-Ks 300', 'negative MMK formats cleanly');
  assert.equal(formatMoney(-15, 'THB'), '-฿ 15.00', 'negative THB formats cleanly');
  assert.equal(formatMoney(-1.25, 'USDT'), '-1.25 USDT', 'negative USDT formats cleanly');
  assert.equal(formatTransactionPrimaryAmount(thbExpense), '-฿ 300.00', 'records primary amount shows original currency');
  assert.equal(formatTransactionBaseAmount(thbExpense), '-$ 8.50', 'records base line shows base amount when currencies differ');
  assert.equal(formatTransactionBaseAmount(tx('expense', 10, { currency: 'USD', baseCurrency: 'USD', baseAmount: 10 })), null, 'records suppress redundant base line');

  const reportTransactions = [
    tx('income', 1000, { categoryId: 'salary', categoryName: 'Salary' }),
    tx('expense', 850, { categoryId: 'food', categoryName: 'Food & Drinks', categoryColor: '#ff0000' }),
    tx('fee', 50, { categoryId: 'fees', categoryName: 'Fees' }),
  ];
  const reportSummary = calculateReportSummary(reportTransactions, 'USD');
  const reportCategories = groupTransactionsByCategory(reportTransactions, 'USD', 'expense');
  const reportTrend = monthlyIncomeExpense(reportTransactions, 'USD', 2);
  const reportInsights = generateReportInsights({
    transactions: reportTransactions,
    summary: reportSummary,
    expenseByCategory: reportCategories,
    trend: reportTrend,
    budgets: [
      {
        ...enrichBudgetWithUsage(budget({ categoryId: 'food', amountLimit: 500 }), reportTransactions, 'Food & Drinks', '#ff0000'),
        isOverBudget: true,
      },
    ],
    goals: [calculateGoalProgress(goal())],
    investments: [
      investment({ assetName: 'BTC', amount: 900, currentValue: 900 }),
      investment({ id: 'inv-gold', assetType: 'gold', assetName: 'Gold', amount: 100, currentValue: 100 }),
    ],
    baseCurrency: 'USD',
  });
  assert.equal(generateReportInsights({ transactions: [], summary: calculateReportSummary([], 'USD'), expenseByCategory: [], trend: [], baseCurrency: 'USD' })[0].type, 'no_data', 'insights handle no data');
  assert.ok(reportInsights.some((insight) => insight.type === 'positive_cashflow'), 'insights include positive cashflow');
  assert.ok(reportInsights.some((insight) => insight.type === 'high_expense_ratio'), 'insights include high expense ratio');
  assert.ok(reportInsights.some((insight) => insight.type === 'top_category' && insight.label === 'Food & Drinks'), 'insights identify top category');
  assert.ok(reportInsights.some((insight) => insight.type === 'budget_warning'), 'insights warn on budget overrun');
  assert.ok(reportInsights.some((insight) => insight.type === 'goal_suggestion'), 'insights suggest goal funding when surplus exists');
  assert.ok(reportInsights.some((insight) => insight.type === 'investment_concentration'), 'insights identify investment concentration');

  const negativeInsights = generateReportInsights({
    transactions: [tx('income', 100), tx('expense', 300, { categoryId: 'food', categoryName: 'Food' })],
    summary: calculateReportSummary([tx('income', 100), tx('expense', 300, { categoryId: 'food', categoryName: 'Food' })], 'USD'),
    expenseByCategory: groupTransactionsByCategory([tx('expense', 300, { categoryId: 'food', categoryName: 'Food' })], 'USD', 'expense'),
    trend: [],
    baseCurrency: 'USD',
  });
  assert.ok(negativeInsights.some((insight) => insight.type === 'negative_cashflow'), 'insights include negative cashflow warning');

  const profile = normalizeUserProfile({ displayName: ' Myoe ', gender: 'bad' as never, planType: 'pro' });
  assert.equal(profile.displayName, 'Myoe', 'profile normalizes display name');
  assert.equal(profile.gender, 'prefer_not_to_say', 'profile falls back for invalid gender');
  assert.equal(profile.planType, 'pro', 'profile preserves valid plan');
  const updatedProfile = mergeUserProfile(profile, { mobileNumber: '09123456789' }, '2026-06-15T00:00:00.000Z');
  assert.equal(updatedProfile.mobileNumber, '09123456789', 'profile update persists mobile number');
  assert.equal(updatedProfile.updatedAt, '2026-06-15T00:00:00.000Z', 'profile update stamps updatedAt');

  assert.equal(iconForStyle('wallet-outline', 'filled'), 'wallet-outline', 'icon style utility keeps line icons only');
  assert.equal(manualSections.length, 25, 'manual exposes 25 sections');
  assert.equal(manualSections.map((section) => String(section.key)).includes('themesIconStyle'), false, 'manual no longer exposes icon style setting');
  for (const locale of [en, my, th, zhHans]) {
    const manual = locale.manual as Record<string, { title?: string; body?: string }>;
    for (const section of manualSections) {
      assert.ok(manual[section.key]?.title, `manual title exists for ${section.key}`);
      assert.ok(manual[section.key]?.body, `manual body exists for ${section.key}`);
    }
  }
  assert.equal(en.about.publisherBody, 'MyoeThuShein', 'about developer name is set');
  assert.ok(en.about.supportEmail.includes('myoethureinlay@gmail.com'), 'about support email is set');
  assert.ok(en.about.privacyPolicyBody.includes('stored locally'), 'about privacy policy explains local storage');
  assert.ok(en.about.termsBody.includes('informational'), 'about terms mention informational reports');

  const settings: AppSettings = {
    theme: 'system',
    language: 'en',
    baseCurrency: 'USD',
    dashboardCurrencyFilter: 'all',
    iconStyle: 'line',
    profile: updatedProfile,
  };
  const backupPayload: BackupPayload = {
    version: 4,
    exportedAt: '2026-06-15T00:00:00.000Z',
    settings,
    wallets: [],
    categories: [],
    transactions: [thbExpense, usdtIncome, exchangeRecord],
  };
  const roundTrippedBackup = JSON.parse(JSON.stringify(backupPayload)) as BackupPayload;
  assert.equal(roundTrippedBackup.transactions[0].currency, 'THB', 'JSON backup preserves transaction currency');
  assert.equal(roundTrippedBackup.transactions[0].baseCurrency, 'USD', 'JSON backup preserves base currency');
  assert.equal(roundTrippedBackup.transactions[2].toCurrency, 'MMK', 'JSON backup preserves exchange destination currency');
  assert.equal(roundTrippedBackup.settings.profile?.planType, 'pro', 'JSON backup preserves profile fields');
}

run();
console.log('Ledger V7 tests passed');
