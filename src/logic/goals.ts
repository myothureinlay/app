import type { Goal, GoalContribution, GoalWithProgress } from '../types';

export function calculateGoalProgress(goal: Goal): GoalWithProgress {
  const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const suggestedMonthlySaving = calculateSuggestedMonthlySaving(goal, remainingAmount);

  return {
    ...goal,
    status: remainingAmount <= 0 && goal.status === 'active' ? 'completed' : goal.status,
    progress,
    remainingAmount,
    suggestedMonthlySaving,
  };
}

export function calculateSuggestedMonthlySaving(goal: Goal, remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)) {
  if (!goal.deadline || remainingAmount <= 0) return goal.monthlyTargetAmount ?? 0;
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const months = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth() + 1);
  return remainingAmount / months;
}

export function applyGoalContribution(goal: Goal, contribution: Pick<GoalContribution, 'amount'>): Goal {
  const currentAmount = goal.currentAmount + contribution.amount;
  return {
    ...goal,
    currentAmount,
    status: currentAmount >= goal.targetAmount ? 'completed' : goal.status,
  };
}
