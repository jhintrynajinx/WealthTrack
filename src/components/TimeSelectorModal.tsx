import React, { useState } from 'react';
import { useStore, TimeRange } from '../store/useStore';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, isSameMonth, startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TimeSelectorModal({ isOpen, onClose }: Props) {
  const { timeRange, setTimeRange } = useStore();
  const [activeTab, setActiveTab] = useState(timeRange.type);
  const [currentViewDate, setCurrentViewDate] = useState(new Date(timeRange.start));
  
  const [customStart, setCustomStart] = useState(timeRange.type === 'custom' ? format(new Date(timeRange.start), 'yyyy-MM-dd') : '');
  const [customEnd, setCustomEnd] = useState(timeRange.type === 'custom' ? format(new Date(timeRange.end), 'yyyy-MM-dd') : '');

  if (!isOpen) return null;

  const handleSelect = (start: Date, end: Date, label: string) => {
    setTimeRange({
      type: activeTab,
      start: start.toISOString(),
      end: end.toISOString(),
      label
    });
    onClose();
  };

  const handleDaySelect = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    handleSelect(start, end, format(date, 'MMM d, yyyy'));
  };

  const handleWeekSelect = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    handleSelect(start, end, `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`);
  };

  const handleMonthSelect = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    handleSelect(start, end, format(start, 'MMMM yyyy'));
  };

  const handleYearSelect = (date: Date) => {
    const start = startOfYear(date);
    const end = endOfYear(date);
    handleSelect(start, end, format(start, 'yyyy'));
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const [sYear, sMonth, sDay] = customStart.split('-').map(Number);
      const [eYear, eMonth, eDay] = customEnd.split('-').map(Number);
      const start = new Date(sYear, sMonth - 1, sDay);
      const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
      handleSelect(start, end, `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`);
    }
  };

  const tabs = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'custom', label: 'Custom' },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          className="relative w-full max-w-md bg-surface border border-surface-variant/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-surface-variant/10">
            <h3 className="font-display text-lg font-semibold text-on-surface">Select Time Range</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-container-low p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[60px] py-2 px-3 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content based on tab */}
            <div className="min-h-[250px]">
              {(activeTab === 'day' || activeTab === 'week' || activeTab === 'month') && (
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setCurrentViewDate(activeTab === 'month' ? subYears(currentViewDate, 1) : subMonths(currentViewDate, 1))} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium text-on-surface text-lg">
                    {format(currentViewDate, activeTab === 'month' ? 'yyyy' : 'MMMM yyyy')}
                  </span>
                  <button onClick={() => setCurrentViewDate(activeTab === 'month' ? addYears(currentViewDate, 1) : addMonths(currentViewDate, 1))} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {activeTab === 'day' && (
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-on-surface-variant py-2">{d}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const d = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
                    const dayOffset = (d.getDay() + 6) % 7; // Monday = 0
                    const currentDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), i - dayOffset + 1);
                    const isCurrentMonth = isSameMonth(currentDate, currentViewDate);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handleDaySelect(currentDate)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-colors ${
                          !isCurrentMonth ? 'text-on-surface-variant/30 hover:bg-surface-container/50' : 
                          'text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {format(currentDate, 'd')}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'week' && (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const start = startOfWeek(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1 + i * 7), { weekStartsOn: 1 });
                    const end = endOfWeek(start, { weekStartsOn: 1 });
                    return (
                      <button
                        key={i}
                        onClick={() => handleWeekSelect(start)}
                        className="w-full flex justify-between items-center p-4 rounded-xl border border-surface-variant/20 hover:bg-surface-container transition-colors"
                      >
                        <span className="text-on-surface font-medium">Week {i + 1}</span>
                        <span className="text-sm text-on-surface-variant">{format(start, 'MMM d')} - {format(end, 'MMM d')}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'month' && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date(currentViewDate.getFullYear(), i, 1);
                    return (
                      <button
                        key={i}
                        onClick={() => handleMonthSelect(d)}
                        className="py-4 px-2 rounded-xl border border-surface-variant/20 hover:bg-surface-container transition-colors text-center text-on-surface font-medium"
                      >
                        {format(d, 'MMM')}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'year' && (
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setCurrentViewDate(subYears(currentViewDate, 9))} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium text-on-surface text-lg">
                    {currentViewDate.getFullYear() - 4} - {currentViewDate.getFullYear() + 4}
                  </span>
                  <button onClick={() => setCurrentViewDate(addYears(currentViewDate, 9))} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {activeTab === 'year' && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {Array.from({ length: 9 }).map((_, i) => {
                    const year = currentViewDate.getFullYear() - 4 + i;
                    const d = new Date(year, 0, 1);
                    return (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(d)}
                        className="py-4 px-2 rounded-xl border border-surface-variant/20 hover:bg-surface-container transition-colors text-center text-on-surface font-medium"
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'custom' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-2">End Date</label>
                    <input 
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                    />
                  </div>
                  <button 
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className="w-full bg-primary text-on-primary font-medium rounded-xl py-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:active:scale-100"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
