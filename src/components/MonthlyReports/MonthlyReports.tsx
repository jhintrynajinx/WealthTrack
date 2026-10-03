import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  ArrowLeft, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  Receipt, 
  Sparkles,
  RefreshCw,
  Wallet,
  SmartphoneNfc,
  Landmark,
  Banknote
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { MonthlyReport, Transaction, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getLocalDateKey } from '../../lib/budgetCalculations';
import { motion, AnimatePresence } from 'motion/react';

export function MonthlyReports() {
  const { monthlyReports, settings, transactions, categories, dailyBudgets, defaultDailyBudget, generateMonthlyReport } = useStore();
  const [selectedReportKey, setSelectedReportKey] = useState<string | null>(null);

  // Sort report keys descending
  const reportList = useMemo(() => {
    const list = Object.values(monthlyReports || {});
    return list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [monthlyReports]);

  const selectedReport = useMemo(() => {
    if (!selectedReportKey || !monthlyReports) return null;
    return monthlyReports[selectedReportKey] || null;
  }, [selectedReportKey, monthlyReports]);

  const currency = settings.currency;

  return (
    <div className="space-y-4 pb-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-on-surface tracking-tight">
            Monthly Reports
          </h1>
        </div>
      </div>

      {/* Main Content: List or Detailed View */}
      {selectedReport ? (
        <ReportDetailView
          report={selectedReport}
          currency={currency}
          transactions={transactions}
          onBack={() => setSelectedReportKey(null)}
          onRefresh={() => generateMonthlyReport(selectedReport.monthKey)}
        />
      ) : (
        <ReportListView
          reports={reportList}
          currency={currency}
          onSelectReport={(key) => setSelectedReportKey(key)}
        />
      )}
    </div>
  );
}

function ReportListView({
  reports,
  currency,
  onSelectReport,
}: {
  reports: MonthlyReport[];
  currency: string;
  onSelectReport: (key: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-on-surface-variant space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileText size={24} />
        </div>
        <h3 className="font-display text-base font-bold text-on-surface">
          No Monthly Reports Yet
        </h3>
        <p className="text-xs max-w-sm mx-auto">
          Reports are auto-generated at the end of each calendar month.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {reports.map((report) => {
        const isPositiveCashFlow = report.netCashFlow >= 0;
        const isBudgetPositive = report.finalBudgetCashFlow >= 0;

        return (
          <div
            key={report.id}
            onClick={() => onSelectReport(report.monthKey)}
            className="glass-card p-3.5 sm:p-4 cursor-pointer hover:bg-surface-container/30 transition-all active:scale-[0.99] flex items-center justify-between gap-3 border border-[var(--sys-glass-border)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-sm sm:text-base font-bold text-on-surface truncate">
                  {report.monthName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono mt-0.5">
                  <span>Expenses: {formatCurrency(report.totalExpenses, currency)}</span>
                  <span>•</span>
                  <span>{report.daysUnderBudget}d under budget</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-right">
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Net Cash Flow</div>
                <div className={`font-mono text-sm sm:text-base font-bold ${isPositiveCashFlow ? 'text-positive' : 'text-negative'}`}>
                  {isPositiveCashFlow ? '+' : ''}{formatCurrency(report.netCashFlow, currency)}
                </div>
              </div>
              <ChevronRight size={18} className="text-on-surface-variant" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportDetailView({
  report,
  currency,
  transactions,
  onBack,
  onRefresh,
}: {
  report: MonthlyReport;
  currency: string;
  transactions: Transaction[];
  onBack: () => void;
  onRefresh: () => void;
}) {
  const isPositiveCashFlow = report.netCashFlow >= 0;
  const isBudgetPositive = report.finalBudgetCashFlow >= 0;

  // Dedicated Spending by Payment Method with graceful fallback for older historical reports
  const paymentBreakdown = useMemo(() => {
    if (report.spendingByPaymentMethod && report.spendingByPaymentMethod.length > 0) {
      return report.spendingByPaymentMethod;
    }

    const monthKey = report.monthKey;
    const monthExpenses = (transactions || []).filter(t => {
      const key = getLocalDateKey(t.date);
      return key.startsWith(monthKey) && t.type === 'expense';
    });

    const paymentMethodDefs: { method: PaymentMethod; name: string }[] = [
      { method: 'eWallet', name: 'E-Wallet' },
      { method: 'bank', name: 'Bank' },
      { method: 'cash', name: 'Cash' },
    ];

    const map = new Map<PaymentMethod, { amount: number; count: number }>();
    paymentMethodDefs.forEach(pm => map.set(pm.method, { amount: 0, count: 0 }));

    monthExpenses.forEach(t => {
      const current = map.get(t.paymentMethod) || { amount: 0, count: 0 };
      map.set(t.paymentMethod, {
        amount: current.amount + (Number(t.amount) || 0),
        count: current.count + 1,
      });
    });

    const total = report.totalExpenses;
    return paymentMethodDefs.map(pm => {
      const stat = map.get(pm.method) || { amount: 0, count: 0 };
      const percentage = total > 0 ? (stat.amount / total) * 100 : 0;
      return {
        method: pm.method,
        name: pm.name,
        amount: stat.amount,
        percentage,
        transactionCount: stat.count,
      };
    });
  }, [report, transactions]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>All Reports</span>
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          title="Recalculate snapshot"
        >
          <RefreshCw size={12} />
          <span className="hidden sm:inline">Recalculate Snapshot</span>
        </button>
      </div>

      {/* 1. Overview */}
      <div className="glass-card p-3 sm:p-4.5 space-y-2.5 sm:space-y-3.5 border border-[var(--sys-glass-border)]">
        <div className="flex items-center justify-between border-b border-surface-variant/15 pb-2">
          <div>
            <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-variant uppercase tracking-wider block">
              Monthly Financial Report
            </span>
            <h2 className="font-display text-base sm:text-xl font-bold text-on-surface">
              {report.monthName}
            </h2>
          </div>
          <span className="text-xs font-mono text-on-surface-variant">
            {report.totalDays} Days
          </span>
        </div>

        {/* 3 Summary Metrics: Income, Expenses, Net Flow */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-surface-container-low/70 border border-surface-variant/15 flex flex-col justify-between min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Income</span>
            <span className="font-display text-xs sm:text-lg font-bold text-positive font-mono mt-0.5 block truncate">
              +{formatCurrency(report.totalIncome, currency)}
            </span>
          </div>

          <div className="p-2 sm:p-3 rounded-xl bg-surface-container-low/70 border border-surface-variant/15 flex flex-col justify-between min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Expenses</span>
            <span className="font-display text-xs sm:text-lg font-bold text-on-surface font-mono mt-0.5 block truncate">
              {formatCurrency(report.totalExpenses, currency)}
            </span>
          </div>

          <div className="p-2 sm:p-3 rounded-xl bg-surface-container-low/70 border border-surface-variant/15 flex flex-col justify-between min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Net Flow</span>
            <span className={`font-display text-xs sm:text-lg font-bold font-mono mt-0.5 block truncate ${isPositiveCashFlow ? 'text-positive' : 'text-negative'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(report.netCashFlow, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Spending by Category */}
      <div className="glass-card p-3.5 sm:p-4.5 space-y-3 border border-[var(--sys-glass-border)]">
        <div className="flex justify-between items-center border-b border-surface-variant/10 pb-2">
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface">
              Spending by Category
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">
              {report.expenseTransactionCount} records
            </p>
          </div>
          <span className="text-xs font-mono text-on-surface font-semibold">
            {formatCurrency(report.totalExpenses, currency)}
          </span>
        </div>

        {report.expenseByCategory.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">No expense transactions recorded.</p>
        ) : (
          <div className="space-y-2">
            {report.expenseByCategory.map(cat => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-on-surface truncate pr-2">{cat.name}</span>
                  <span className="font-mono text-on-surface shrink-0 font-medium">
                    {formatCurrency(cat.amount, currency)} ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Spending by Payment Method */}
      <div className="glass-card p-3.5 sm:p-4.5 space-y-3 border border-[var(--sys-glass-border)]">
        <div className="flex justify-between items-center border-b border-surface-variant/10 pb-2">
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface">
              Spending by Payment Method
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">
              Where your money went from
            </p>
          </div>
          <span className="text-xs font-mono text-on-surface font-semibold">
            {formatCurrency(report.totalExpenses, currency)}
          </span>
        </div>

        {paymentBreakdown.every(p => p.amount === 0) ? (
          <p className="text-xs text-on-surface-variant text-center py-3">No payment method records for this period.</p>
        ) : (
          <div className="space-y-2">
            {paymentBreakdown.map(pm => {
              const Icon = pm.method === 'eWallet' ? SmartphoneNfc : pm.method === 'bank' ? Landmark : Banknote;
              const barBg = pm.method === 'eWallet' ? '#0284c7' : pm.method === 'bank' ? '#4f46e5' : '#475569';
              const iconCls = pm.method === 'eWallet' ? 'text-sky-600 bg-sky-50' : pm.method === 'bank' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 bg-slate-50';

              return (
                <div key={pm.method} className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${iconCls} shrink-0`}>
                        <Icon size={13} />
                      </div>
                      <span className="font-semibold text-on-surface">{pm.name}</span>
                      {pm.transactionCount > 0 && (
                        <span className="text-[10px] font-mono text-on-surface-variant">({pm.transactionCount} tx)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-on-surface">{formatCurrency(pm.amount, currency)}</span>
                      <span className="text-on-surface-variant font-medium text-[11px] w-12 text-right">
                        {pm.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Compact Horizontal Progress Bar */}
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(pm.percentage, 100)}%`,
                        backgroundColor: barBg,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Daily Budget Performance */}
      <div className="glass-card p-3.5 sm:p-4.5 space-y-3 border border-[var(--sys-glass-border)]">
        <div className="flex items-center justify-between border-b border-surface-variant/15 pb-2.5">
          <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
            <Wallet size={15} className="text-primary" />
            <span>Daily Budget</span>
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
            isBudgetPositive ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'
          }`}>
            {isBudgetPositive ? 'Under Budget' : 'Over Budget'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container-lowest/60 border border-surface-variant/10">
            <span className="text-on-surface-variant text-[10px] sm:text-[11px] block">Daily Budget</span>
            <strong className="text-on-surface font-semibold text-xs sm:text-sm mt-0.5 block">
              {formatCurrency(report.dailyBudget, currency)}/day
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container-lowest/60 border border-surface-variant/10">
            <span className="text-on-surface-variant text-[10px] sm:text-[11px] block">Budget Spending</span>
            <strong className="text-on-surface font-semibold text-xs sm:text-sm mt-0.5 block">
              {formatCurrency(report.dailyBudgetSpending, currency)}
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container-lowest/60 border border-surface-variant/10">
            <span className="text-on-surface-variant text-[10px] sm:text-[11px] block">Fixed Expenses</span>
            <strong className="text-on-surface font-semibold text-xs sm:text-sm mt-0.5 block">
              {formatCurrency(report.fixedExpensesTotal, currency)}
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-surface-container-lowest/60 border border-surface-variant/10">
            <span className="text-on-surface-variant text-[10px] sm:text-[11px] block">Budget Cash Flow</span>
            <strong className={`font-semibold text-xs sm:text-sm mt-0.5 block ${isBudgetPositive ? 'text-positive' : 'text-negative'}`}>
              {isBudgetPositive ? '+' : ''}{formatCurrency(report.finalBudgetCashFlow, currency)}
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-on-surface-variant">
          <span>Under: <strong className="text-emerald-600">{report.daysUnderBudget}d</strong></span>
          <span>•</span>
          <span>Over: <strong className="text-rose-600">{report.daysOverBudget}d</strong></span>
          <span>•</span>
          <span>On: <strong className="text-amber-600">{report.daysOnBudget}d</strong></span>
        </div>
      </div>

      {/* 5. Income Breakdown */}
      <div className="glass-card p-3.5 sm:p-4.5 space-y-3 border border-[var(--sys-glass-border)]">
        <div className="flex justify-between items-center border-b border-surface-variant/10 pb-2">
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface">
              Income Breakdown
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">
              {report.incomeTransactionCount} records
            </p>
          </div>
          <span className="text-xs font-mono text-positive font-semibold">
            +{formatCurrency(report.totalIncome, currency)}
          </span>
        </div>

        {report.incomeByCategory.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">No income transactions recorded.</p>
        ) : (
          <div className="space-y-2">
            {report.incomeByCategory.map(cat => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-on-surface truncate pr-2">{cat.name}</span>
                  <span className="font-mono text-on-surface shrink-0 font-medium">
                    {formatCurrency(cat.amount, currency)} ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
