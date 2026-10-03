import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  parseISO, 
  subMonths,
  isBefore
} from 'date-fns';
import { 
  Transaction, 
  Category, 
  PaymentMethod,
  MonthlyReport, 
  MonthlyReportCategoryBreakdown,
  MonthlyReportPaymentMethodBreakdown
} from '../types';
import { getLocalDateKey, getMonthDailyBudget } from './budgetCalculations';
import { getCategoryChartColor } from './utils';

/**
 * Generates a complete financial snapshot report for a completed calendar month.
 */
export function generateMonthlyReportSnapshot(
  targetMonthDate: Date,
  transactions: Transaction[],
  categories: Category[],
  dailyBudget: number
): MonthlyReport {
  const monthKey = format(targetMonthDate, 'yyyy-MM');
  const monthName = format(targetMonthDate, 'MMMM yyyy');
  const monthStart = startOfMonth(targetMonthDate);
  const monthEnd = endOfMonth(targetMonthDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = monthDays.length;

  // Filter transactions for this month in local calendar time
  const monthTransactions = transactions.filter(t => {
    const key = getLocalDateKey(t.date);
    return key.startsWith(monthKey);
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  let fixedExpensesTotal = 0;
  let dailyBudgetSpending = 0;
  let incomeTxCount = 0;
  let expenseTxCount = 0;

  const expenseByDayMap = new Map<string, number>();
  const expenseCatMap = new Map<string, number>();
  const incomeCatMap = new Map<string, number>();

  monthTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    const dateKey = getLocalDateKey(t.date);

    if (t.type === 'income') {
      totalIncome += amt;
      incomeTxCount++;
      incomeCatMap.set(t.categoryId, (incomeCatMap.get(t.categoryId) || 0) + amt);
    } else if (t.type === 'expense') {
      totalExpenses += amt;
      expenseTxCount++;
      expenseCatMap.set(t.categoryId, (expenseCatMap.get(t.categoryId) || 0) + amt);

      if (t.fixedExpense === true) {
        fixedExpensesTotal += amt;
      } else {
        dailyBudgetSpending += amt;
        expenseByDayMap.set(dateKey, (expenseByDayMap.get(dateKey) || 0) + amt);
      }
    }
  });

  const netCashFlow = totalIncome - totalExpenses;
  const totalBudgetAvailable = dailyBudget * totalDays;
  const finalBudgetCashFlow = totalBudgetAvailable - dailyBudgetSpending;

  // Day-by-day budget metrics
  let daysUnderBudget = 0;
  let daysOverBudget = 0;
  let daysOnBudget = 0;
  let highestDay: { dateKey: string; amount: number } | undefined = undefined;
  let lowestDay: { dateKey: string; amount: number } | undefined = undefined;

  monthDays.forEach(dayDate => {
    const dateKey = format(dayDate, 'yyyy-MM-dd');
    const daySpent = expenseByDayMap.get(dateKey) || 0;
    const diff = dailyBudget - daySpent;

    if (diff > 0) daysUnderBudget++;
    else if (diff === 0) daysOnBudget++;
    else daysOverBudget++;

    if (daySpent > 0) {
      if (!highestDay || daySpent > highestDay.amount) {
        highestDay = { dateKey, amount: daySpent };
      }
      if (!lowestDay || daySpent < lowestDay.amount) {
        lowestDay = { dateKey, amount: daySpent };
      }
    }
  });

  // Expense categories breakdown
  const expenseByCategory: MonthlyReportCategoryBreakdown[] = Array.from(expenseCatMap.entries())
    .map(([categoryId, amount]) => {
      const cat = categories.find(c => c.id === categoryId);
      const name = cat?.name || 'Uncategorized';
      const color = getCategoryChartColor(cat?.color || 'cat-others');
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return { categoryId, name, amount, percentage, color };
    })
    .sort((a, b) => b.amount - a.amount);

  // Income categories breakdown
  const incomeByCategory: MonthlyReportCategoryBreakdown[] = Array.from(incomeCatMap.entries())
    .map(([categoryId, amount]) => {
      const cat = categories.find(c => c.id === categoryId);
      const name = cat?.name || 'Income';
      const color = getCategoryChartColor(cat?.color || 'cat-salary');
      const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
      return { categoryId, name, amount, percentage, color };
    })
    .sort((a, b) => b.amount - a.amount);

  const highestExpenseCategory = expenseByCategory.length > 0 
    ? { name: expenseByCategory[0].name, amount: expenseByCategory[0].amount }
    : undefined;

  // Spending by payment method breakdown for expenses
  const paymentMethodDefs: { method: PaymentMethod; name: string }[] = [
    { method: 'eWallet', name: 'E-Wallet' },
    { method: 'bank', name: 'Bank' },
    { method: 'cash', name: 'Cash' },
  ];

  const paymentMethodMap = new Map<PaymentMethod, { amount: number; count: number }>();
  paymentMethodDefs.forEach(pm => paymentMethodMap.set(pm.method, { amount: 0, count: 0 }));

  monthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const pm = t.paymentMethod;
      const current = paymentMethodMap.get(pm) || { amount: 0, count: 0 };
      paymentMethodMap.set(pm, {
        amount: current.amount + (Number(t.amount) || 0),
        count: current.count + 1,
      });
    });

  const spendingByPaymentMethod: MonthlyReportPaymentMethodBreakdown[] = paymentMethodDefs.map(pm => {
    const stat = paymentMethodMap.get(pm.method) || { amount: 0, count: 0 };
    const percentage = totalExpenses > 0 ? (stat.amount / totalExpenses) * 100 : 0;
    return {
      method: pm.method,
      name: pm.name,
      amount: stat.amount,
      percentage,
      transactionCount: stat.count,
    };
  });

  return {
    id: `report_${monthKey}`,
    monthKey,
    monthName,
    generatedAt: new Date().toISOString(),
    version: 1,
    totalIncome,
    totalExpenses,
    netCashFlow,
    dailyBudget,
    totalDays,
    daysPassed: totalDays,
    totalBudgetAvailable,
    dailyBudgetSpending,
    fixedExpensesTotal,
    finalBudgetCashFlow,
    daysUnderBudget,
    daysOverBudget,
    daysOnBudget,
    expenseByCategory,
    incomeByCategory,
    spendingByPaymentMethod,
    highestSpendingDay: highestDay,
    lowestSpendingDay: lowestDay,
    highestExpenseCategory,
    expenseTransactionCount: expenseTxCount,
    incomeTransactionCount: incomeTxCount,
  };
}

/**
 * Checks for past completed months and ensures persistent historical report snapshots exist.
 */
export function ensureHistoricalReports(
  transactions: Transaction[],
  categories: Category[],
  dailyBudgets?: Record<string, number>,
  defaultDailyBudget?: number,
  existingReports: Record<string, MonthlyReport> = {}
): Record<string, MonthlyReport> {
  const updatedReports = { ...existingReports };
  const now = new Date();
  const currentMonthStart = startOfMonth(now);

  // Find all distinct months in transactions
  const monthKeysSet = new Set<string>();
  
  transactions.forEach(t => {
    const key = getLocalDateKey(t.date).substring(0, 7); // 'yyyy-MM'
    monthKeysSet.add(key);
  });

  // Also include the immediately preceding month
  const lastMonthKey = format(subMonths(now, 1), 'yyyy-MM');
  monthKeysSet.add(lastMonthKey);

  monthKeysSet.forEach(monthKey => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return;

    const monthDate = new Date(year, month, 1);
    
    // Only generate snapshot if month has completely concluded (before current month)
    if (isBefore(monthDate, currentMonthStart)) {
      if (!updatedReports[monthKey]) {
        const budget = getMonthDailyBudget(dailyBudgets, defaultDailyBudget, monthKey);
        updatedReports[monthKey] = generateMonthlyReportSnapshot(
          monthDate,
          transactions,
          categories,
          budget
        );
      }
    }
  });

  return updatedReports;
}
