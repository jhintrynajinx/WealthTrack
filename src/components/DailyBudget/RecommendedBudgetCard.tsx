import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { RecommendedBudgetInfo } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface Props {
  recommendedInfo: RecommendedBudgetInfo;
  currency: string;
}

export function RecommendedBudgetCard({ recommendedInfo, currency }: Props) {
  const {
    remainingDays,
    recommendedDailyBudget,
    isExceeded,
    exceededAmount,
    isFinalDay,
    isPastMonth,
  } = recommendedInfo;

  const renderContent = () => {
    // Case 1: Past Month
    if (isPastMonth) {
      return (
        <div>
          <span className="text-xs font-medium text-on-surface-variant block">Recommended</span>
          <div className="font-display text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
            Completed
          </div>
        </div>
      );
    }

    // Case 2: Final Day of Month
    if (isFinalDay) {
      return (
        <div>
          <span className="text-xs font-medium text-on-surface-variant block">Recommended</span>
          <div className="font-display text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
            Final Day
          </div>
        </div>
      );
    }

    // Case 3: Monthly Budget Exceeded
    if (isExceeded) {
      return (
        <div>
          <span className="text-xs font-medium text-rose-700 block">Recommended</span>
          <div className="font-display text-2xl sm:text-3xl font-bold font-mono text-rose-600 mt-0.5">
            RM 0.00 <span className="text-xs font-normal text-on-surface-variant">/ day</span>
          </div>
          <p className="text-xs text-rose-600 mt-1">
            Exceeded by {formatCurrency(exceededAmount, currency)}
          </p>
        </div>
      );
    }

    // Case 4: Normal recommendation
    return (
      <div>
        <span className="text-xs font-medium text-on-surface-variant block">Recommended</span>
        <div className="font-display text-2xl sm:text-3xl font-bold font-mono text-primary mt-0.5">
          {formatCurrency(recommendedDailyBudget, currency)}
          <span className="text-xs font-normal text-on-surface-variant ml-1">/ day</span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
        </p>
      </div>
    );
  };

  return (
    <div className="glass-card p-4 sm:p-4.5 flex flex-col justify-between space-y-3 relative overflow-hidden">
      {/* Background subtle tint */}
      <div 
        className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-10"
        style={{
          background: isExceeded ? 'var(--sys-error)' : 'var(--sys-primary)'
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-variant/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Sparkles size={14} />
          </div>
          <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface">
            Recommended Daily Budget
          </h3>
        </div>

        {!isPastMonth && !isFinalDay && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant">
            {remainingDays}d left
          </span>
        )}
        {isFinalDay && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700">
            <Clock size={11} />
            Final Day
          </span>
        )}
      </div>

      {/* Primary Value & Short Note */}
      {renderContent()}

      {/* Subtle bottom row */}
      <div className="text-[11px] text-on-surface-variant pt-1.5 border-t border-surface-variant/10 font-mono">
        <span>Pace target</span>
      </div>
    </div>
  );
}
