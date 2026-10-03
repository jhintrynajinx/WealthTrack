import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  RotateCcw
} from 'lucide-react';
import { DailyBudgetSummary, TodayBudgetInfo, RecommendedBudgetInfo } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AdaptiveNumber } from '../AdaptiveNumber';

interface Props {
  summary: DailyBudgetSummary;
  todayInfo?: TodayBudgetInfo;
  recommendedInfo?: RecommendedBudgetInfo;
  monthTitle: string;
  isCurrentMonth: boolean;
  currency: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onEditBudget: () => void;
}

export function MonthlySummaryCard({
  summary,
  todayInfo,
  recommendedInfo,
  monthTitle,
  isCurrentMonth,
  currency,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onEditBudget,
}: Props) {
  const {
    dailyBudget,
    totalDays,
    applicableDays,
    budgetAvailableSoFar,
    actualSpending,
    budgetCashFlow,
    status,
  } = summary;

  const getStatusBadge = () => {
    if (status === 'under') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
          <TrendingDown size={11} />
          <span>Under</span>
        </span>
      );
    }
    if (status === 'over') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/25">
          <TrendingUp size={11} />
          <span>Over</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/25">
        <Minus size={11} />
        <span>On Budget</span>
      </span>
    );
  };

  const cashFlowColorClass = 
    budgetCashFlow > 0 
      ? 'text-positive font-bold' 
      : budgetCashFlow < 0 
      ? 'text-negative font-bold' 
      : 'text-on-surface font-bold';

  const percentSpent = budgetAvailableSoFar > 0 
    ? Math.round((actualSpending / budgetAvailableSoFar) * 100)
    : 0;

  return (
    <div className="glass-card p-3 sm:p-4.5 space-y-2.5 relative overflow-hidden">
      {/* Background ambient subtle gradient glow */}
      <div 
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-10"
        style={{
          background: budgetCashFlow >= 0 ? 'var(--sys-primary)' : 'var(--sys-error)'
        }}
      />

      {/* Month Navigation Header */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-variant/15 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors active:scale-95"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={15} />
          </button>
          
          <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-low/60 rounded-lg">
            <Calendar size={13} className="text-primary shrink-0" />
            <span className="font-display font-bold text-xs sm:text-sm text-on-surface">
              {monthTitle}
            </span>
          </div>

          <button
            onClick={onNextMonth}
            className="p-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors active:scale-95"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <button
              onClick={onCurrentMonth}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary transition-colors"
            >
              <RotateCcw size={11} />
              <span>This Month</span>
            </button>
          )}

          <button
            onClick={onEditBudget}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95"
          >
            <Pencil size={11} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Primary 1: Monthly Budget Cash Flow (Full Width) */}
      <div className="p-2.5 sm:p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 via-surface-container-lowest to-sky-50/70 border border-blue-200/50 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
            Monthly Budget Cash Flow
          </span>
          {getStatusBadge()}
        </div>
        <div className="mt-0.5">
          <AdaptiveNumber
            value={budgetCashFlow}
            formatCurrency={formatCurrency}
            currency={currency}
            isIncome={budgetCashFlow > 0 ? true : budgetCashFlow < 0 ? false : undefined}
            className="font-display text-xl sm:text-2xl font-bold font-mono"
            colorClass={cashFlowColorClass}
          />
        </div>

        {/* Actual Spending vs Expected So Far Comparison & Progress Bar */}
        <div className="pt-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span>Actual spending</span>
              <strong className="text-on-surface font-semibold">{formatCurrency(actualSpending, currency)}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span>Expected so far</span>
              <strong className="text-on-surface font-semibold">{formatCurrency(budgetAvailableSoFar, currency)}</strong>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  budgetAvailableSoFar > 0 ? (actualSpending / budgetAvailableSoFar) * 100 : 0, 
                  100
                )}%`,
                background: actualSpending > budgetAvailableSoFar
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Two Compact Side-by-Side Components */}
      <div className="grid grid-cols-2 gap-2">
        {/* Remaining Today */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low/70 border border-surface-variant/15 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block truncate">
            Remaining Today
          </span>
          <div className="mt-0.5">
            <div className={`font-display text-base sm:text-lg font-bold font-mono ${
              (todayInfo?.remaining ?? 0) > 0 ? 'text-positive' : (todayInfo?.remaining ?? 0) < 0 ? 'text-negative' : 'text-on-surface'
            }`}>
              {todayInfo ? (
                todayInfo.remaining > 0 
                  ? `+${formatCurrency(todayInfo.remaining, currency)}` 
                  : todayInfo.remaining < 0 
                  ? `-${formatCurrency(Math.abs(todayInfo.remaining), currency)}` 
                  : formatCurrency(0, currency)
              ) : '—'}
            </div>
            {todayInfo && todayInfo.remaining < 0 && (
              <span className="text-[9px] font-semibold text-rose-600 block mt-0.5">
                Over budget
              </span>
            )}
          </div>
        </div>

        {/* Recommended Daily Budget */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low/70 border border-surface-variant/15 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block truncate">
            Recommended Daily Budget
          </span>
          <div className="mt-0.5">
            <div className={`font-display text-base sm:text-lg font-bold font-mono ${
              recommendedInfo?.isExceeded ? 'text-rose-600' : 'text-primary'
            }`}>
              {recommendedInfo ? (
                recommendedInfo.isPastMonth ? 'Done' :
                recommendedInfo.isFinalDay ? 'Final Day' :
                recommendedInfo.isExceeded ? 'RM 0.00/day' :
                `${formatCurrency(recommendedInfo.recommendedDailyBudget, currency)}/day`
              ) : '—'}
            </div>
            {recommendedInfo && !recommendedInfo.isPastMonth && !recommendedInfo.isFinalDay && !recommendedInfo.isExceeded && (
              <span className="text-[9px] font-mono text-on-surface-variant block mt-0.5">
                {recommendedInfo.remainingDays} days left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Supporting Line: Daily Budget • Days Passed */}
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5 px-1 font-mono">
        <span>Daily Budget <strong className="text-on-surface font-semibold">{formatCurrency(dailyBudget, currency)}/day</strong></span>
        <span>•</span>
        <span>{applicableDays}/{totalDays} days</span>
      </div>
    </div>
  );
}
