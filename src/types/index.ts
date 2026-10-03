export type TransactionType = "income" | "expense";
export type PaymentMethod = "eWallet" | "cash" | "bank";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO string
  merchant?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  fixedExpense?: boolean; // When true, excluded from Daily Budget calculations
  receiptImage?: string; // base64
  attachmentName?: string;
  attachmentType?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Balance {
  eWallet: number;
  cash: number;
  bank: number;
}

export interface Settings {
  currency: string;
  theme: "light" | "dark" | "system";
  dateFormat: string;
}

export type BudgetStatus = "under" | "on" | "over" | "upcoming";

export interface DailyBudgetSummary {
  monthKey: string; // "yyyy-MM"
  dailyBudget: number;
  totalDays: number;
  applicableDays: number;
  budgetAvailableSoFar: number;
  actualSpending: number; // Excludes fixed expenses
  fixedExpensesTotal: number; // Sum of fixed expenses
  totalMonthlyExpenses: number; // All expenses
  budgetCashFlow: number;
  status: "under" | "on" | "over";
}

export interface TodayBudgetInfo {
  todayDate: Date;
  dateKey: string;
  dailyBudget: number;
  spentToday: number;
  remaining: number;
  status: "under" | "on" | "over";
  transactions: Transaction[];
}

export interface RecommendedBudgetInfo {
  totalMonthlyBudget: number;
  actualSpendingSoFar: number;
  remainingMonthlyBudget: number;
  remainingDays: number;
  recommendedDailyBudget: number;
  isExceeded: boolean;
  exceededAmount: number;
  isFinalDay: boolean;
  isPastMonth: boolean;
  isFutureMonth: boolean;
}

export interface DayBudgetBreakdown {
  date: Date;
  dateKey: string; // "yyyy-MM-dd"
  dailyBudget: number;
  actualSpending: number;
  difference: number;
  status: BudgetStatus;
  transactions: Transaction[];
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthlyReportCategoryBreakdown {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyReportPaymentMethodBreakdown {
  method: PaymentMethod;
  name: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyReport {
  id: string;
  monthKey: string; // "yyyy-MM"
  monthName: string; // "September 2026"
  generatedAt: string; // ISO string
  version: number;
  
  // Month Summary
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  
  // Daily Budget Summary
  dailyBudget: number;
  totalDays: number;
  daysPassed: number;
  totalBudgetAvailable: number;
  dailyBudgetSpending: number;
  fixedExpensesTotal: number;
  finalBudgetCashFlow: number;
  daysUnderBudget: number;
  daysOverBudget: number;
  daysOnBudget: number;
  
  // Category Breakdowns
  expenseByCategory: MonthlyReportCategoryBreakdown[];
  incomeByCategory: MonthlyReportCategoryBreakdown[];

  // Payment Method Breakdown
  spendingByPaymentMethod?: MonthlyReportPaymentMethodBreakdown[];
  
  // Additional Insights
  highestSpendingDay?: { dateKey: string; amount: number };
  lowestSpendingDay?: { dateKey: string; amount: number };
  highestExpenseCategory?: { name: string; amount: number };
  expenseTransactionCount: number;
  incomeTransactionCount: number;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  accounts: Account[];
  settings: Settings;
  dailyBudgets?: Record<string, number>; // monthKey "yyyy-MM" -> daily budget amount
  defaultDailyBudget?: number;
  monthlyReports?: Record<string, MonthlyReport>; // monthKey "yyyy-MM" -> MonthlyReport
}
