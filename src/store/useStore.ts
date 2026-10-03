import { create } from 'zustand';
import { StorageService } from '../services/storage';
import { AppData, Transaction, Category, Budget, FinancialGoal, Account, Settings, MonthlyReport } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ensureHistoricalReports, generateMonthlyReportSnapshot } from '../lib/reportService';
import { getMonthDailyBudget } from '../lib/budgetCalculations';

const defaultCategories: Category[] = [
  // Expense
  { id: 'c_exp_food', name: 'Food', icon: 'utensils', color: 'cat-food', type: 'expense' },
  { id: 'c_exp_groceries', name: 'Groceries', icon: 'shopping-cart', color: 'cat-groceries', type: 'expense' },
  { id: 'c_exp_transportation', name: 'Transportation', icon: 'car', color: 'cat-transportation', type: 'expense' },
  { id: 'c_exp_shopping', name: 'Shopping', icon: 'shopping-bag', color: 'cat-shopping', type: 'expense' },
  { id: 'c_exp_entertainment', name: 'Entertainment', icon: 'film', color: 'cat-entertainment', type: 'expense' },
  { id: 'c_exp_bills', name: 'Bills', icon: 'file-text', color: 'cat-bills', type: 'expense' },
  { id: 'c_exp_housing', name: 'Housing', icon: 'home', color: 'cat-housing', type: 'expense' },
  { id: 'c_exp_healthcare', name: 'Healthcare', icon: 'heart', color: 'cat-healthcare', type: 'expense' },
  { id: 'c_exp_education', name: 'Education', icon: 'book', color: 'cat-education', type: 'expense' },
  { id: 'c_exp_gifts', name: 'Gifts', icon: 'gift', color: 'cat-gifts', type: 'expense' },
  { id: 'c_exp_travel', name: 'Travel', icon: 'plane', color: 'cat-travel', type: 'expense' },
  { id: 'c_exp_utilities', name: 'Utilities', icon: 'zap', color: 'cat-utilities', type: 'expense' },
  { id: 'c_exp_others', name: 'Others', icon: 'more-horizontal', color: 'cat-others', type: 'expense' },
  // Income
  { id: 'c_inc_salary', name: 'Salary', icon: 'briefcase', color: 'cat-salary', type: 'income' },
  { id: 'c_inc_allowance', name: 'Allowance', icon: 'wallet', color: 'cat-allowance', type: 'income' },
  { id: 'c_inc_part_time', name: 'Part-time', icon: 'clock', color: 'cat-part-time', type: 'income' },
  { id: 'c_inc_freelance', name: 'Freelance', icon: 'laptop', color: 'cat-freelance', type: 'income' },
  { id: 'c_inc_bonus', name: 'Bonus', icon: 'award', color: 'cat-bonus', type: 'income' },
  { id: 'c_inc_investment', name: 'Investment', icon: 'trending-up', color: 'cat-investment', type: 'income' },
  { id: 'c_inc_refund', name: 'Refund', icon: 'corner-down-left', color: 'cat-refund', type: 'income' },
  { id: 'c_inc_gift_received', name: 'Gift Received', icon: 'gift', color: 'cat-gift-received', type: 'income' },
  { id: 'c_inc_others', name: 'Others', icon: 'plus-circle', color: 'cat-others', type: 'income' },
];

const defaultData: AppData = {
  transactions: [
    { id: 't0', amount: 10000, type: 'income', categoryId: 'c_inc_salary', date: new Date(Date.now() - 2592000000).toISOString(), merchant: 'Company A', paymentMethod: 'bank' },
    { id: 't0_2', amount: 2000, type: 'income', categoryId: 'c_inc_allowance', date: new Date(Date.now() - 2000000000).toISOString(), merchant: 'Dad', paymentMethod: 'eWallet' },
    { id: 't0_3', amount: 500, type: 'income', categoryId: 'c_inc_freelance', date: new Date(Date.now() - 1000000000).toISOString(), merchant: 'Client B', paymentMethod: 'cash' },
    { id: 't1', amount: 3500, type: 'income', categoryId: 'c_inc_salary', date: new Date().toISOString(), merchant: 'Company A', paymentMethod: 'bank' },
    { id: 't2', amount: 1200, type: 'expense', categoryId: 'c_exp_bills', date: new Date(Date.now() - 86400000).toISOString(), merchant: 'City Apartments', paymentMethod: 'bank' },
    { id: 't3', amount: 45, type: 'expense', categoryId: 'c_exp_groceries', date: new Date(Date.now() - 172800000).toISOString(), merchant: 'Whole Foods', paymentMethod: 'eWallet' },
  ],
  categories: defaultCategories,
  budgets: [
    { categoryId: 'c_exp_food', amount: 500 },
    { categoryId: 'c_exp_shopping', amount: 1500 },
  ],
  goals: [
    { id: 'g1', name: 'Vacation Fund', targetAmount: 5000, currentAmount: 2500, color: 'bg-primary' },
    { id: 'g2', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 8000, color: 'bg-secondary' },
  ],
  accounts: [
    { id: 'a1', name: 'Main Checking', balance: 24562 },
  ],
  settings: {
    currency: 'MYR',
    theme: 'light',
    dateFormat: "do 'of' MMMM yyyy",
  },
  dailyBudgets: {},
  defaultDailyBudget: 30,
  monthlyReports: {},
};

const emptyData: AppData = {
  transactions: [],
  categories: defaultCategories,
  budgets: [],
  goals: [],
  accounts: [],
  settings: {
    currency: 'MYR',
    theme: 'light',
    dateFormat: "do 'of' MMMM yyyy",
  },
  dailyBudgets: {},
  defaultDailyBudget: 30,
  monthlyReports: {},
};

export type TimeRangeType = 'day' | 'week' | 'month' | 'year' | 'custom';
export interface TimeRange {
  type: TimeRangeType;
  start: string;
  end: string;
  label: string;
}

interface AppState extends AppData {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setDailyBudget: (monthKey: string, amount: number) => void;
  generateMonthlyReport: (monthKey: string) => void;
  resetData: () => void;
  importData: (data: AppData) => void;
}

const loadInitialState = (): AppData => {
  const isFirstLaunch = localStorage.getItem('hasLaunchedBefore') === null;
  const stored = StorageService.loadData();
  if (stored) {
    // Force use of defaultCategories so existing users get the new categories
    stored.categories = defaultCategories;
    // Migrate old default date format to new human readable format if present
    if (stored.settings?.dateFormat === 'MMM dd, yyyy' || stored.settings?.dateFormat === 'yyyy-MM-dd') {
      stored.settings.dateFormat = "do 'of' MMMM yyyy";
    }
    stored.dailyBudgets = stored.dailyBudgets || {};
    stored.defaultDailyBudget = typeof stored.defaultDailyBudget === 'number' ? stored.defaultDailyBudget : 30;
    
    // Ensure historical reports exist for completed months
    const historicalReports = ensureHistoricalReports(
      stored.transactions || [],
      stored.categories,
      stored.dailyBudgets,
      stored.defaultDailyBudget,
      stored.monthlyReports || {}
    );
    stored.monthlyReports = historicalReports;
    StorageService.saveData(stored);
    return stored;
  }
  
  if (isFirstLaunch) {
    localStorage.setItem('hasLaunchedBefore', 'true');
    const initialReports = ensureHistoricalReports(
      defaultData.transactions,
      defaultData.categories,
      defaultData.dailyBudgets,
      defaultData.defaultDailyBudget,
      {}
    );
    defaultData.monthlyReports = initialReports;
    StorageService.saveData(defaultData);
    return defaultData;
  }

  return emptyData;
};

const getInitialTimeRange = (): TimeRange => {
  const now = new Date();
  return {
    type: 'month',
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
    label: 'This Month',
  };
};

export const useStore = create<AppState>()((set, get) => ({
  ...loadInitialState(),
  timeRange: getInitialTimeRange(),

  setTimeRange: (range) => set({ timeRange: range }),

  addTransaction: (tx) => set((state) => {
    const newTx = { ...tx, id: crypto.randomUUID() };
    const nextState = { ...state, transactions: [newTx, ...state.transactions] };
    StorageService.saveData(nextState);
    return nextState;
  }),

  updateTransaction: (id, tx) => set((state) => {
    const nextState = {
      ...state,
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)),
    };
    StorageService.saveData(nextState);
    return nextState;
  }),

  deleteTransaction: (id) => set((state) => {
    const nextState = {
      ...state,
      transactions: state.transactions.filter((t) => t.id !== id),
    };
    StorageService.saveData(nextState);
    return nextState;
  }),

  updateSettings: (newSettings) => set((state) => {
    const nextState = {
      ...state,
      settings: { ...state.settings, ...newSettings },
    };
    StorageService.saveData(nextState);
    return nextState;
  }),

  setDailyBudget: (monthKey, amount) => set((state) => {
    const nextDailyBudgets = { ...(state.dailyBudgets || {}), [monthKey]: amount };
    const nextState = {
      ...state,
      dailyBudgets: nextDailyBudgets,
      defaultDailyBudget: amount,
    };
    StorageService.saveData(nextState);
    return nextState;
  }),

  generateMonthlyReport: (monthKey) => set((state) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return state;

    const monthDate = new Date(year, month, 1);
    const budget = getMonthDailyBudget(state.dailyBudgets, state.defaultDailyBudget, monthKey);
    const report = generateMonthlyReportSnapshot(
      monthDate,
      state.transactions,
      state.categories,
      budget
    );

    const nextReports = { ...(state.monthlyReports || {}), [monthKey]: report };
    const nextState = { ...state, monthlyReports: nextReports };
    StorageService.saveData(nextState);
    return nextState;
  }),

  resetData: () => {
    StorageService.clearData();
    set(() => emptyData);
  },

  importData: (data) => set(() => {
    StorageService.saveData(data);
    return data;
  }),
}));
