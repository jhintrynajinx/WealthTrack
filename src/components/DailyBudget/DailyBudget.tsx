import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  startOfMonth 
} from 'date-fns';
import { 
  CalendarDays, 
  Filter, 
  ListOrdered, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculateMonthlyDailyBudget, getMonthDailyBudget } from '../../lib/budgetCalculations';
import { formatCurrency } from '../../lib/utils';
import { MonthlySummaryCard } from './MonthlySummaryCard';
import { DailyBudgetCard } from './DailyBudgetCard';
import { EditDailyBudgetModal } from './EditDailyBudgetModal';

export function DailyBudget() {
  const { 
    transactions, 
    categories, 
    settings, 
    dailyBudgets, 
    defaultDailyBudget, 
    setDailyBudget 
  } = useStore();

  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'under' | 'over' | 'on' | 'upcoming'>('all');
  const [searchDayQuery, setSearchDayQuery] = useState('');

  const now = useMemo(() => new Date(), []);
  const monthKey = format(selectedMonthDate, 'yyyy-MM');
  const isCurrentMonth = isSameMonth(selectedMonthDate, now);
  const monthTitle = format(selectedMonthDate, 'MMMM yyyy');

  // Daily budget amount for the currently selected month
  const currentDailyBudget = useMemo(() => {
    return getMonthDailyBudget(dailyBudgets, defaultDailyBudget, monthKey);
  }, [dailyBudgets, defaultDailyBudget, monthKey]);

  // Daily budget amount for the real current month (for Today's card)
  const todayMonthBudget = useMemo(() => {
    const todayMonthKey = format(now, 'yyyy-MM');
    return getMonthDailyBudget(dailyBudgets, defaultDailyBudget, todayMonthKey);
  }, [dailyBudgets, defaultDailyBudget, now]);

  // Compute summary, todayInfo, recommendedInfo, and daily items for this month
  const { summary, days, todayInfo, recommendedInfo } = useMemo(() => {
    return calculateMonthlyDailyBudget(
      transactions,
      selectedMonthDate,
      currentDailyBudget,
      now,
      todayMonthBudget
    );
  }, [transactions, selectedMonthDate, currentDailyBudget, now, todayMonthBudget]);

  // Counts for each filter status
  const filterCounts = useMemo(() => {
    return {
      all: days.length,
      under: days.filter(d => d.status === 'under').length,
      over: days.filter(d => d.status === 'over').length,
      on: days.filter(d => d.status === 'on').length,
      upcoming: days.filter(d => d.status === 'upcoming').length,
    };
  }, [days]);

  // Filtered day items
  const filteredDays = useMemo(() => {
    return days.filter(day => {
      const matchesStatus = filterStatus === 'all' || day.status === filterStatus;
      
      const q = searchDayQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      const dayFormatted = format(day.date, 'd MMMM yyyy EEE').toLowerCase();
      const hasMatchingTx = day.transactions.some(t => 
        t.merchant?.toLowerCase().includes(q) || 
        t.notes?.toLowerCase().includes(q)
      );

      return matchesStatus && (dayFormatted.includes(q) || hasMatchingTx);
    });
  }, [days, filterStatus, searchDayQuery]);

  const handlePrevMonth = () => {
    setSelectedMonthDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(prev => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonthDate(new Date());
  };

  const handleSaveDailyBudget = (newAmount: number) => {
    setDailyBudget(monthKey, newAmount);
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 pb-6 max-w-[1200px] mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="font-display text-lg sm:text-2xl font-bold text-on-surface tracking-tight">
            Daily Budget
          </h1>
        </div>
      </div>

      {/* 1. Monthly Budget Cash Flow Summary & Key Daily Metrics */}
      <MonthlySummaryCard
        summary={summary}
        todayInfo={todayInfo}
        recommendedInfo={recommendedInfo}
        monthTitle={monthTitle}
        isCurrentMonth={isCurrentMonth}
        currency={settings.currency}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
        onEditBudget={() => setIsEditModalOpen(true)}
      />

      {/* 3. Daily Breakdown Section Header & Filters */}
      <div className="space-y-2 pt-0.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
              <CalendarDays size={16} className="text-primary" />
              <span>Daily Breakdown · {monthTitle}</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              All ({filterCounts.all})
            </button>
            <button
              onClick={() => setFilterStatus('under')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'under'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-emerald-700'
              }`}
            >
              <TrendingDown size={11} />
              <span>Under ({filterCounts.under})</span>
            </button>
            <button
              onClick={() => setFilterStatus('over')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'over'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-rose-700'
              }`}
            >
              <TrendingUp size={11} />
              <span>Over ({filterCounts.over})</span>
            </button>
            <button
              onClick={() => setFilterStatus('on')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'on'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-amber-700'
              }`}
            >
              <Minus size={11} />
              <span>On Budget ({filterCounts.on})</span>
            </button>
            {filterCounts.upcoming > 0 && (
              <button
                onClick={() => setFilterStatus('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  filterStatus === 'upcoming'
                    ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <Clock size={12} />
                <span>Upcoming ({filterCounts.upcoming})</span>
              </button>
            )}
          </div>
        </div>

        {/* Day cards list */}
        {filteredDays.length === 0 ? (
          <div className="glass-card p-8 text-center text-on-surface-variant space-y-2">
            <p className="font-medium text-sm">No days match the selected filter.</p>
            <button
              onClick={() => {
                setFilterStatus('all');
                setSearchDayQuery('');
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDays.map(day => (
              <DailyBudgetCard
                key={day.dateKey}
                day={day}
                currency={settings.currency}
                dateFormat={settings.dateFormat}
                categories={categories}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Daily Budget Modal */}
      <EditDailyBudgetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentAmount={currentDailyBudget}
        monthName={monthTitle}
        totalDays={summary.totalDays}
        currency={settings.currency}
        onSave={handleSaveDailyBudget}
      />
    </div>
  );
}
