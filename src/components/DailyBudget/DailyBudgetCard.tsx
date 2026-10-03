import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Receipt 
} from 'lucide-react';
import { DayBudgetBreakdown, Category } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  key?: string;
  day: DayBudgetBreakdown;
  currency: string;
  dateFormat: string;
  categories: Category[];
}

export function DailyBudgetCard({ day, currency, dateFormat, categories }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    date,
    dailyBudget,
    actualSpending,
    difference,
    status,
    transactions,
    isToday,
    isFuture,
  } = day;

  // Format date display (e.g. "Wed, 15 Oct 2026")
  const dayName = format(date, 'EEE');
  const formattedDay = format(date, 'd MMM');
  const yearStr = format(date, 'yyyy');

  const renderStatusBadge = () => {
    switch (status) {
      case 'under':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
            <TrendingDown size={12} />
            <span>Under</span>
          </span>
        );
      case 'over':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 border border-rose-500/20">
            <TrendingUp size={12} />
            <span>Over</span>
          </span>
        );
      case 'on':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/20">
            <Minus size={12} />
            <span>On Budget</span>
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant/80 border border-surface-variant/20">
            <Clock size={12} />
            <span>Upcoming</span>
          </span>
        );
    }
  };

  const getDifferenceText = () => {
    if (isFuture) return '—';
    if (difference > 0) return `+${formatCurrency(difference, currency)}`;
    if (difference < 0) return `-${formatCurrency(Math.abs(difference), currency)}`;
    return formatCurrency(0, currency);
  };

  const getDifferenceColorClass = () => {
    if (isFuture) return 'text-on-surface-variant';
    if (difference > 0) return 'text-positive font-semibold';
    if (difference < 0) return 'text-negative font-semibold';
    return 'text-on-surface font-semibold';
  };

  const hasTransactions = transactions.length > 0;

  return (
    <div
      className={`glass-card transition-all duration-200 overflow-hidden border ${
        isToday 
          ? 'border-primary/50 shadow-sm ring-1 ring-primary/20 bg-primary/5' 
          : 'border-[var(--sys-glass-border)]'
      }`}
    >
      <div 
        onClick={() => hasTransactions && setIsExpanded(!isExpanded)}
        className={`p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
          hasTransactions ? 'cursor-pointer hover:bg-surface-container/30' : ''
        }`}
      >
        {/* Date & Status */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex flex-col items-center justify-center font-mono ${
              isToday 
                ? 'bg-primary text-on-primary font-bold shadow-xs' 
                : 'bg-surface-container-low text-on-surface'
            }`}>
              <span className="text-[9px] uppercase font-semibold leading-tight">{dayName}</span>
              <span className="text-xs sm:text-sm font-bold leading-tight">{format(date, 'd')}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm text-on-surface">
                {formattedDay}, {yearStr}
              </span>
              {isToday && (
                <span className="bg-primary/15 text-primary font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Today
                </span>
              )}
            </div>
          </div>

          <div>
            {renderStatusBadge()}
          </div>
        </div>

        {/* Metrics: Budget, Spent, Difference */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-surface-variant/10">
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-on-surface-variant font-medium">Budget</div>
            <div className="font-mono text-xs sm:text-sm text-on-surface font-medium">
              {formatCurrency(dailyBudget, currency)}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[10px] text-on-surface-variant font-medium">Spent</div>
            <div className="font-mono text-xs sm:text-sm text-on-surface font-medium">
              {isFuture ? '—' : formatCurrency(actualSpending, currency)}
            </div>
          </div>

          <div className="text-right min-w-[65px] sm:min-w-[80px]">
            <div className="text-[10px] text-on-surface-variant font-medium">Difference</div>
            <div className={`font-mono text-xs sm:text-sm ${getDifferenceColorClass()}`}>
              {getDifferenceText()}
            </div>
          </div>

          {hasTransactions && (
            <button 
              type="button"
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors shrink-0"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable transaction breakdown */}
      <AnimatePresence>
        {isExpanded && hasTransactions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-surface-variant/15 bg-surface-container-lowest/50 px-4 py-3 space-y-2"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 mb-2">
              <Receipt size={13} className="text-primary" />
              <span>Day's Transactions ({transactions.length})</span>
            </div>
            
            <div className="space-y-1.5">
              {transactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${cat?.color || 'bg-surface-variant text-on-surface-variant'}`}>
                        {cat?.name || 'Expense'}
                      </span>
                      {t.fixedExpense && (
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[9px] font-semibold tracking-wider uppercase shrink-0">
                          Fixed
                        </span>
                      )}
                      <span className="font-medium text-on-surface truncate">
                        {t.merchant || t.notes || 'Expense'}
                      </span>
                    </div>

                    <div className="font-mono font-semibold text-on-surface shrink-0">
                      -{formatCurrency(t.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
