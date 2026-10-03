import React from 'react';
import { format } from 'date-fns';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Wallet
} from 'lucide-react';
import { TodayBudgetInfo } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface Props {
  todayInfo: TodayBudgetInfo;
  currency: string;
}

export function TodayBudgetCard({ todayInfo, currency }: Props) {
  const {
    todayDate,
    dailyBudget,
    spentToday,
    remaining,
    status,
  } = todayInfo;

  const formattedDate = format(todayDate, 'EEE, d MMM');

  const renderStatusBadge = () => {
    if (status === 'under') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
          <TrendingDown size={12} />
          <span>Under</span>
        </span>
      );
    }
    if (status === 'over') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/25">
          <TrendingUp size={12} />
          <span>Over</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/25">
        <Minus size={12} />
        <span>On Budget</span>
      </span>
    );
  };

  const remainingColorClass = 
    remaining > 0 
      ? 'text-positive font-bold' 
      : remaining < 0 
      ? 'text-negative font-bold' 
      : 'text-on-surface font-bold';

  const getRemainingText = () => {
    if (remaining > 0) return `+${formatCurrency(remaining, currency)}`;
    if (remaining < 0) return `-${formatCurrency(Math.abs(remaining), currency)}`;
    return formatCurrency(0, currency);
  };

  return (
    <div className="glass-card p-4 sm:p-4.5 flex flex-col justify-between space-y-3 relative overflow-hidden">
      {/* Background subtle tint */}
      <div 
        className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-10"
        style={{
          background: remaining >= 0 ? 'var(--sys-primary)' : 'var(--sys-error)'
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-variant/10 pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Wallet size={14} />
          </div>
          <div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-on-surface">
              Today Budget
            </h3>
          </div>
          <span className="text-[11px] text-on-surface-variant font-mono">
            ({formattedDate})
          </span>
        </div>

        {renderStatusBadge()}
      </div>

      {/* Primary Value: Remaining Today */}
      <div>
        <span className="text-xs font-medium text-on-surface-variant block">
          Remaining Today
        </span>
        <div className={`font-display text-2xl sm:text-3xl font-bold font-mono mt-0.5 ${remainingColorClass}`}>
          {getRemainingText()}
        </div>
      </div>

      {/* Compact breakdown row */}
      <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-surface-variant/10 text-on-surface-variant">
        <span>Today Budget: <strong className="text-on-surface font-medium">{formatCurrency(dailyBudget, currency)}</strong></span>
        <span>•</span>
        <span>Spent: <strong className="text-on-surface font-medium">{formatCurrency(spentToday, currency)}</strong></span>
      </div>
    </div>
  );
}
