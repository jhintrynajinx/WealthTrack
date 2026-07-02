import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date, formatStr: string = "do 'of' MMMM yyyy") {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  try {
    return format(date, formatStr);
  } catch (e) {
    return "";
  }
}

export function getCategoryChartColor(colorClass: string): string {
  const map: Record<string, string> = {
    'cat-food': '#22c55e',
    'cat-groceries': '#14b8a6',
    'cat-transportation': '#3b82f6',
    'cat-shopping': '#a855f7',
    'cat-entertainment': '#ec4899',
    'cat-bills': '#ef4444',
    'cat-housing': '#f97316',
    'cat-healthcare': '#f43f5e',
    'cat-education': '#6366f1',
    'cat-gifts': '#d946ef',
    'cat-travel': '#0ea5e9',
    'cat-utilities': '#eab308',
    'cat-salary': '#10b981',
    'cat-allowance': '#84cc16',
    'cat-part-time': '#06b6d4',
    'cat-freelance': '#8b5cf6',
    'cat-bonus': '#f59e0b',
    'cat-investment': '#16a34a',
    'cat-refund': '#64748b',
    'cat-gift-received': '#d946ef',
    'cat-others': '#78716c',
  };
  return map[colorClass] || '#78716c';
}

export function formatCurrency(amount: number, currency: string = "USD") {
  if (currency === "MYR") {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return amount < 0 ? `-RM ${formatted}` : `RM ${formatted}`;
  }
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : formatted;
}

export function getValueColorClass(amount: number): string {
  if (amount > 0) return 'text-positive';
  if (amount < 0) return 'text-negative';
  return 'text-on-surface';
}
