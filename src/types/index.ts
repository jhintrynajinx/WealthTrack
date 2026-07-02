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

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  accounts: Account[];
  settings: Settings;
}
