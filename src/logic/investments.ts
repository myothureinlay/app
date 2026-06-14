import { getRateToBase } from '../constants/currencies';
import type { BaseCurrency, InvestmentRecord } from '../types';

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  realizedProfitLoss: number;
  unrealizedProfitLoss: number;
  fees: number;
  income: number;
}

export interface InvestmentAllocation {
  key: string;
  label: string;
  total: number;
  color: string;
}

const colors = ['#6366F1', '#14B8A6', '#F97316', '#E5484D', '#8B5CF6', '#16A34A', '#0EA5E9', '#F59E0B'];

function active(records: InvestmentRecord[]) {
  return records.filter((record) => !record.deletedAt);
}

function valueInBase(record: InvestmentRecord, baseCurrency: BaseCurrency, value = record.amount) {
  if (record.currency === baseCurrency) return value;
  return value * getRateToBase(baseCurrency, record.currency);
}

export function calculateInvestmentSummary(records: InvestmentRecord[], baseCurrency: BaseCurrency): InvestmentSummary {
  return active(records).reduce<InvestmentSummary>(
    (summary, record) => {
      const amount = valueInBase(record, baseCurrency);
      if (record.type === 'buy') summary.totalInvested += amount;
      if (record.type === 'sell') summary.totalInvested -= amount;
      if (record.type === 'fee') summary.fees += amount;
      if (record.type === 'income') summary.income += amount;
      summary.currentValue += valueInBase(record, baseCurrency, record.currentValue ?? record.amount);
      summary.realizedProfitLoss += valueInBase(record, baseCurrency, record.realizedProfitLoss ?? 0);
      summary.unrealizedProfitLoss += valueInBase(record, baseCurrency, record.unrealizedProfitLoss ?? 0);
      return summary;
    },
    {
      totalInvested: 0,
      currentValue: 0,
      realizedProfitLoss: 0,
      unrealizedProfitLoss: 0,
      fees: 0,
      income: 0,
    }
  );
}

export function investmentAllocation(records: InvestmentRecord[], baseCurrency: BaseCurrency): InvestmentAllocation[] {
  const totals = active(records).reduce<Record<string, InvestmentAllocation>>((acc, record) => {
    const key = record.assetType;
    if (!acc[key]) {
      acc[key] = {
        key,
        label: key.replace(/_/g, ' '),
        total: 0,
        color: colors[Object.keys(acc).length % colors.length],
      };
    }
    acc[key].total += valueInBase(record, baseCurrency, record.currentValue ?? record.amount);
    return acc;
  }, {});

  return Object.values(totals)
    .filter((row) => Math.abs(row.total) > 0.000001)
    .sort((a, b) => b.total - a.total);
}
