import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  isAfter, 
  startOfDay,
  parseISO
} from 'date-fns';
import { 
  Transaction, 
  DailyBudgetSummary, 
  DayBudgetBreakdown, 
  BudgetStatus,
  TodayBudgetInfo,
  RecommendedBudgetInfo
} from '../types';

/**
 * Retrieves the daily budget for a specific month key ('yyyy-MM').
 * Falls back to defaultDailyBudget or 30.
 */
export function getMonthDailyBudget(
  dailyBudgets: Record<string, number> | undefined,
  defaultDailyBudget: number | undefined,
  monthKey: string
): number {
  if (dailyBudgets && typeof dailyBudgets[monthKey] === 'number') {
    return dailyBudgets[monthKey];
  }
  return defaultDailyBudget ?? 30;
}

/**
 * Safely extracts 'yyyy-MM-dd' from an ISO date string or Date object in local time.
 */
export function getLocalDateKey(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return format(new Date(dateInput), 'yyyy-MM-dd');
    }
    return format(date, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

/**
 * Calculates monthly budget statistics, today's budget, forward-looking recommendation,
 * and daily breakdown for a given target month.
 */
export function calculateMonthlyDailyBudget(
  transactions: Transaction[],
  selectedMonth: Date,
  dailyBudget: number,
  now: Date = new Date(),
  currentMonthDailyBudget?: number
): { 
  summary: DailyBudgetSummary; 
  days: DayBudgetBreakdown[];
  todayInfo: TodayBudgetInfo;
  recommendedInfo: RecommendedBudgetInfo;
} {
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const currentMonthKey = format(now, 'yyyy-MM');
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const todayStart = startOfDay(now);
  const todayKey = format(now, 'yyyy-MM-dd');

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = monthDays.length;

  const isCurrentMonth = monthKey === currentMonthKey;
  const isPastMonth = selectedMonth < startOfMonth(now);
  const isFutureMonth = selectedMonth > endOfMonth(now);

  // Determine applicable days for the month
  let applicableDays = 0;
  if (isCurrentMonth) {
    applicableDays = now.getDate(); // includes today
  } else if (isPastMonth) {
    applicableDays = totalDays;
  } else if (isFutureMonth) {
    applicableDays = 0;
  }

  // Pre-filter expenses for this month to optimize day lookup
  const allExpenseTransactions = transactions.filter(t => t.type === 'expense');
  const expenseByDayMap = new Map<string, Transaction[]>();
  let fixedExpensesTotal = 0;
  let totalMonthlyExpenses = 0;

  allExpenseTransactions.forEach(t => {
    const key = getLocalDateKey(t.date);
    const existing = expenseByDayMap.get(key) || [];
    existing.push(t);
    expenseByDayMap.set(key, existing);
    
    // Total expenses across all categories
    const amt = Number(t.amount) || 0;
    totalMonthlyExpenses += amt;
    if (t.fixedExpense === true) {
      fixedExpensesTotal += amt;
    }
  });

  let totalDailyBudgetSpending = 0;

  const days: DayBudgetBreakdown[] = monthDays.map(dayDate => {
    const dayStart = startOfDay(dayDate);
    const dateKey = format(dayDate, 'yyyy-MM-dd');
    const isToday = isSameDay(dayStart, todayStart);
    const isFuture = isAfter(dayStart, todayStart);

    const dayTxList = expenseByDayMap.get(dateKey) || [];
    // Only non-fixed expenses count toward daily budget spending
    const dailyBudgetTxList = dayTxList.filter(t => t.fixedExpense !== true);
    const daySpent = dailyBudgetTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    let status: BudgetStatus;
    let difference = 0;

    if (isFuture) {
      status = 'upcoming';
      difference = 0;
    } else {
      totalDailyBudgetSpending += daySpent;
      difference = dailyBudget - daySpent;

      if (difference > 0) {
        status = 'under';
      } else if (difference === 0) {
        status = 'on';
      } else {
        status = 'over';
      }
    }

    return {
      date: dayDate,
      dateKey,
      dailyBudget,
      actualSpending: daySpent,
      difference,
      status,
      transactions: dayTxList, // All transactions kept for detailed view
      isToday,
      isFuture,
    };
  });

  const budgetAvailableSoFar = dailyBudget * applicableDays;
  const budgetCashFlow = budgetAvailableSoFar - totalDailyBudgetSpending;

  let overallStatus: 'under' | 'on' | 'over' = 'on';
  if (budgetCashFlow > 0) {
    overallStatus = 'under';
  } else if (budgetCashFlow < 0) {
    overallStatus = 'over';
  }

  const summary: DailyBudgetSummary = {
    monthKey,
    dailyBudget,
    totalDays,
    applicableDays,
    budgetAvailableSoFar,
    actualSpending: totalDailyBudgetSpending,
    fixedExpensesTotal,
    totalMonthlyExpenses,
    budgetCashFlow,
    status: overallStatus,
  };

  // 1. Calculate Today's Budget info
  const effectiveTodayBudget = currentMonthDailyBudget ?? dailyBudget;
  const todayTxList = expenseByDayMap.get(todayKey) || [];
  const spentToday = todayTxList
    .filter(t => t.fixedExpense !== true)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const remainingToday = effectiveTodayBudget - spentToday;
  const todayStatus: 'under' | 'on' | 'over' = 
    remainingToday > 0 ? 'under' : remainingToday === 0 ? 'on' : 'over';

  const todayInfo: TodayBudgetInfo = {
    todayDate: now,
    dateKey: todayKey,
    dailyBudget: effectiveTodayBudget,
    spentToday,
    remaining: remainingToday,
    status: todayStatus,
    transactions: todayTxList,
  };

  // 2. Calculate Forward-Looking Recommended Daily Budget
  const totalMonthlyBudget = dailyBudget * totalDays;
  const actualSpendingSoFar = totalDailyBudgetSpending;
  const remainingMonthlyBudget = totalMonthlyBudget - actualSpendingSoFar;
  
  let remainingDays = 0;
  let isFinalDay = false;

  if (isCurrentMonth) {
    remainingDays = Math.max(0, totalDays - applicableDays);
    isFinalDay = remainingDays === 0;
  } else if (isPastMonth) {
    remainingDays = 0;
    isFinalDay = false;
  } else if (isFutureMonth) {
    remainingDays = totalDays;
    isFinalDay = false;
  }

  const isExceeded = remainingMonthlyBudget < 0;
  const exceededAmount = isExceeded ? Math.abs(remainingMonthlyBudget) : 0;

  let recommendedDailyBudget = 0;
  if (remainingDays > 0) {
    if (remainingMonthlyBudget > 0) {
      recommendedDailyBudget = remainingMonthlyBudget / remainingDays;
    } else {
      recommendedDailyBudget = 0;
    }
  } else {
    recommendedDailyBudget = 0;
  }

  const recommendedInfo: RecommendedBudgetInfo = {
    totalMonthlyBudget,
    actualSpendingSoFar,
    remainingMonthlyBudget,
    remainingDays,
    recommendedDailyBudget,
    isExceeded,
    exceededAmount,
    isFinalDay,
    isPastMonth,
    isFutureMonth,
  };

  return { summary, days, todayInfo, recommendedInfo };
}
