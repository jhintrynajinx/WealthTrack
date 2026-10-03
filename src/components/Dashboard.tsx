import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getCategoryChartColor, getValueColorClass } from '../lib/utils';
import { AdaptiveNumber } from './AdaptiveNumber';
import { format, differenceInDays } from 'date-fns';
import { 
  Wallet, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Landmark, Banknote, SmartphoneNfc, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function Dashboard() {
  const { transactions, categories, settings, timeRange: globalTimeRange } = useStore();

  // Lifetime balances (unaffected by time range)
  const balances = useMemo(() => {
    let eWallet = 0, cash = 0, bank = 0;
    transactions.forEach(t => {
      const amount = t.type === 'income' ? t.amount : -t.amount;
      if (t.paymentMethod === 'eWallet') eWallet += amount;
      else if (t.paymentMethod === 'cash') cash += amount;
      else if (t.paymentMethod === 'bank') bank += amount;
    });
    return {
      eWallet,
      cash,
      bank,
      total: eWallet + cash + bank
    };
  }, [transactions]);

  // Time-filtered transactions
  const filteredTransactions = useMemo(() => {
    const start = new Date(globalTimeRange.start).getTime();
    const end = new Date(globalTimeRange.end).getTime();
    
    return transactions.filter(t => {
      const date = new Date(t.date).getTime();
      return date >= start && date <= end;
    });
  }, [transactions, globalTimeRange]);

  const timeFilteredExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);
  
  const timeFilteredIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const [breakdownType, setBreakdownType] = React.useState<'expense' | 'income'>('expense');

  const expenseByCategory = useMemo(() => {
    const data: Record<string, { value: number, colorClass: string }> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Other';
      const colorClass = cat?.color || 'cat-others';
      if (!data[name]) {
        data[name] = { value: 0, colorClass };
      }
      data[name].value += t.amount;
    });
    return Object.entries(data)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, { value, colorClass }]) => ({ 
        name, 
        value, 
        color: getCategoryChartColor(colorClass),
        percentage: timeFilteredExpenses > 0 ? (value / timeFilteredExpenses) * 100 : 0
      }));
  }, [filteredTransactions, categories, timeFilteredExpenses]);

  const incomeByCategory = useMemo(() => {
    const data: Record<string, { value: number, colorClass: string }> = {};
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Income';
      const colorClass = cat?.color || 'cat-salary';
      if (!data[name]) {
        data[name] = { value: 0, colorClass };
      }
      data[name].value += t.amount;
    });
    return Object.entries(data)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, { value, colorClass }]) => ({ 
        name, 
        value, 
        color: getCategoryChartColor(colorClass),
        percentage: timeFilteredIncome > 0 ? (value / timeFilteredIncome) * 100 : 0
      }));
  }, [filteredTransactions, categories, timeFilteredIncome]);

  const activeBreakdownData = breakdownType === 'expense' ? expenseByCategory : incomeByCategory;
  const activeBreakdownTotal = breakdownType === 'expense' ? timeFilteredExpenses : timeFilteredIncome;

  const [selectedCategoryName, setSelectedCategoryName] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedCategoryName(null);
  }, [breakdownType, globalTimeRange]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryName) return null;
    return activeBreakdownData.find(c => c.name === selectedCategoryName) || null;
  }, [selectedCategoryName, activeBreakdownData]);

  const chartData = useMemo(() => {
    const start = new Date(globalTimeRange.start);
    const end = new Date(globalTimeRange.end);
    const diffDays = differenceInDays(end, start);
    
    const data: Record<string, { income: number, expense: number }> = {};
    
    // Initialize data points based on time range to ensure a smooth chart
    if (diffDays <= 35) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        data[format(d, 'MMM d')] = { income: 0, expense: 0 };
      }
    } else if (diffDays <= 366) {
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        data[format(d, 'MMM yy')] = { income: 0, expense: 0 };
      }
    } else {
      for (let d = new Date(start); d <= end; d.setFullYear(d.getFullYear() + 1)) {
        data[format(d, 'yyyy')] = { income: 0, expense: 0 };
      }
    }

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      let key = "";
      if (diffDays <= 35) {
        key = format(date, 'MMM d');
      } else if (diffDays <= 366) {
        key = format(date, 'MMM yy');
      } else {
        key = format(date, 'yyyy');
      }
      
      if (!data[key]) {
        data[key] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') data[key].income += t.amount;
      if (t.type === 'expense') data[key].expense += t.amount;
    });

    return Object.entries(data).map(([name, values]) => ({
      name,
      ...values
    }));
  }, [filteredTransactions, globalTimeRange]);

  const globalCards = [
    { title: 'Total Balance', amount: balances.total, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Bank', amount: balances.bank, icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'E-Wallet', amount: balances.eWallet, icon: SmartphoneNfc, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Cash', amount: balances.cash, icon: Banknote, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  const timeFilteredCards = [
    { title: 'Expenses', amount: timeFilteredExpenses, icon: ArrowDownToLine, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Income', amount: timeFilteredIncome, icon: ArrowUpFromLine, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Net Flow', amount: timeFilteredIncome - timeFilteredExpenses, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-2.5 sm:space-y-4">
      
      {/* Global Balances Section */}
      <section>
        <h3 className="font-sans text-[11px] font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Balances</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {globalCards.map((card, i) => (
            <div 
              key={card.title}
              className={`glass-card p-2.5 sm:p-3.5 flex flex-col justify-center gap-1.5 glass-card-hover min-w-0 ${
                i === 0 ? 'blue-card-glow' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-md ${card.bg} ${card.color} shrink-0`}>
                  <card.icon strokeWidth={2} className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-on-surface-variant truncate">{card.title}</p>
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg sm:text-2xl font-bold break-words leading-tight">
                  <AdaptiveNumber value={card.amount} formatCurrency={formatCurrency} currency={settings.currency} colorClass={getValueColorClass(card.amount)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Time-Filtered Section */}
      <section>
        <h3 className="font-sans text-[11px] font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">{globalTimeRange.label}</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {timeFilteredCards.map((card, i) => (
            <div 
              key={card.title}
              className="glass-card p-2 sm:p-3 flex flex-col justify-center gap-1 glass-card-hover min-w-0"
            >
              <div className="flex items-center gap-1">
                <div className={`p-1 rounded-md ${card.bg} ${card.color} shrink-0`}>
                  <card.icon strokeWidth={2} className="w-3 h-3" />
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-on-surface-variant truncate">{card.title}</p>
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm sm:text-lg font-bold break-words leading-tight">
                  <AdaptiveNumber value={card.amount} formatCurrency={formatCurrency} currency={settings.currency} colorClass={getValueColorClass(card.amount)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="glass-card p-3 sm:p-4.5 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2.5 sm:mb-4 gap-2">
            <h3 className="font-display text-sm sm:text-lg font-semibold text-on-surface">Cash Flow</h3>
          </div>
          <div className="flex-1 min-h-[160px] md:min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(44, 123, 229, 0.08)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4a6080' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4a6080' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--sys-glass-bg)', borderRadius: '12px', border: '1px solid var(--sys-glass-border)', boxShadow: '0 4px 20px var(--sys-glass-shadow)', color: 'var(--sys-on-surface)', backdropFilter: 'blur(16px)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#dc2626" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-4.5 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-surface-variant/15 pb-2">
            <h3 className="font-display text-sm sm:text-base font-bold text-on-surface">
              Breakdown
            </h3>
            
            {/* Segmented Control */}
            <div className="flex bg-surface-container-low p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setBreakdownType('expense')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  breakdownType === 'expense'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setBreakdownType('income')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  breakdownType === 'income'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {activeBreakdownData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-on-surface-variant text-xs space-y-1">
              <p>No {breakdownType} records in this period.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Floating Callout Card for Selected Category (Outside Donut Center) */}
              {selectedCategory && (
                <div className="p-2 rounded-xl bg-surface-container-lowest/95 border border-primary/25 shadow-sm backdrop-blur-md flex items-center justify-between gap-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: selectedCategory.color }} />
                    <span className="font-semibold text-on-surface truncate">{selectedCategory.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="font-bold text-on-surface">{formatCurrency(selectedCategory.value, settings.currency)}</span>
                    <span className="text-primary font-semibold text-[11px]">({selectedCategory.percentage.toFixed(1)}%)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryName(null)}
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors"
                      aria-label="Dismiss selection"
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Donut Chart */}
              <div className="h-36 sm:h-42 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeBreakdownData}
                      innerRadius={38}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      isAnimationActive={false}
                      onClick={(entry) => {
                        setSelectedCategoryName(prev => prev === entry.name ? null : entry.name);
                      }}
                    >
                      {activeBreakdownData.map((entry, index) => {
                        const isSelected = selectedCategoryName === entry.name;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke={isSelected ? 'var(--sys-surface)' : 'transparent'}
                            strokeWidth={isSelected ? 3 : 0}
                            className="cursor-pointer transition-opacity"
                            opacity={selectedCategoryName === null || isSelected ? 1 : 0.55}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center total — completely unblocked and clearly visible */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[9px] uppercase font-mono text-on-surface-variant font-medium">Total</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-on-surface">
                    {formatCurrency(activeBreakdownTotal, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Mobile-friendly touch list with category name, amount, and percentage */}
              <div className="space-y-1.5 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                {activeBreakdownData.map((cat, idx) => {
                  const isSelected = selectedCategoryName === cat.name;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedCategoryName(prev => prev === cat.name ? null : cat.name)}
                      className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer text-xs space-y-1 ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20 shadow-xs'
                          : 'bg-surface-container-low/60 hover:bg-surface-container/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: cat.color }} 
                          />
                          <span className="font-medium text-[11px] sm:text-xs text-on-surface truncate">{cat.name}</span>
                        </div>
                        <span className="font-mono font-semibold text-[11px] sm:text-xs text-on-surface shrink-0 ml-2">
                          {formatCurrency(cat.value, settings.currency)}
                        </span>
                      </div>

                      {/* Percentage bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} 
                          />
                        </div>
                        <span className="text-[9px] font-mono text-on-surface-variant shrink-0 w-8 text-right">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
