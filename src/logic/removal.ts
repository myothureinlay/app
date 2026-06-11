export interface RemoveDecision {
  action: 'hard_delete' | 'soft_remove' | 'blocked';
  warning?: string;
}

export function getCategoryRemoveDecision(transactionCount: number): RemoveDecision {
  if (transactionCount <= 0) {
    return { action: 'hard_delete' };
  }

  return {
    action: 'soft_remove',
    warning: 'This category is used by past transactions. Removing it will hide it from new entries but keep your history safe.',
  };
}

export function getWalletRemoveDecision({
  transactionCount,
  balance,
  isDefault,
}: {
  transactionCount: number;
  balance: number;
  isDefault: boolean;
}): RemoveDecision {
  if (transactionCount <= 0 && Math.abs(balance) < 0.000001 && !isDefault) {
    return { action: 'hard_delete' };
  }

  return {
    action: 'soft_remove',
    warning:
      Math.abs(balance) > 0.000001
        ? 'This wallet has a non-zero balance. Removing it hides it from new entries but keeps history and reports safe.'
        : 'This wallet has history or is a default wallet. Removing it hides it from new entries but keeps history safe.',
  };
}
