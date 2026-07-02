import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, getCategoryChartColor, getValueColorClass } from '../lib/utils';
import { AdaptiveNumber } from './AdaptiveNumber';
import { format, differenceInDays } from 'date-fns';
import { 
  Wallet, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Landmark, Banknote, SmartphoneNfc
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
      .map(([name, { value, colorClass }]) => ({ name, value, color: getCategoryChartColor(colorClass) }));
  }, [filteredTransactions, categories]);

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
    { title: 'Total Balance', amount: balances.total, icon: Wallet, color: 'text-tertiary', bg: 'bg-tertiary-container/20' },
    { title: 'Bank Account', amount: balances.bank, icon: Landmark, color: 'text-secondary', bg: 'bg-secondary-container/20' },
    { title: 'E-Wallet', amount: balances.eWallet, icon: SmartphoneNfc, color: 'text-primary', bg: 'bg-primary-container/20' },
    { title: 'Cash', amount: balances.cash, icon: Banknote, color: 'text-on-surface', bg: 'bg-surface-container-high' },
  ];

  const timeFilteredCards = [
    { title: 'Total Expenses', amount: timeFilteredExpenses, icon: ArrowDownToLine, color: 'text-error', bg: 'bg-error-container/20' },
    { title: 'Total Income', amount: timeFilteredIncome, icon: ArrowUpFromLine, color: 'text-positive', bg: 'bg-surface-container-low' },
    { title: 'Net Cash Flow', amount: timeFilteredIncome - timeFilteredExpenses, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary-container/20' },
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      
      {/* Global Balances Section */}
      <section>
        <h3 className="font-display text-sm md:text-base font-semibold text-on-surface-variant mb-3">Global Balances</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {globalCards.map((card, i) => (
            <div 
              key={card.title}
              className="glass-card p-3 sm:p-4 md:p-5 flex flex-col justify-center gap-2 sm:gap-3 glass-card-hover min-w-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`p-1.5 rounded-full ${card.bg} ${card.color} shrink-0`}>
                  <card.icon strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-on-surface-variant truncate">{card.title}</p>
              </div>
              <div className="min-w-0">
                <div className={`font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold break-words leading-tight`}>
                  <AdaptiveNumber value={card.amount} formatCurrency={formatCurrency} currency={settings.currency} colorClass={getValueColorClass(card.amount)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Time-Filtered Section */}
      <section>
        <h3 className="font-display text-sm md:text-base font-semibold text-on-surface-variant mb-3">{globalTimeRange.label} Overview</h3>
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {timeFilteredCards.map((card, i) => (
            <div 
              key={card.title}
              className="glass-card p-2 sm:p-3 md:p-5 flex flex-col justify-center gap-1.5 sm:gap-2 md:gap-3 glass-card-hover min-w-0"
            >
              <div className="flex items-center gap-1 md:gap-2">
                <div className={`p-1 md:p-1.5 rounded-full ${card.bg} ${card.color} shrink-0`}>
                  <card.icon strokeWidth={2} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-on-surface-variant truncate">{card.title}</p>
              </div>
              <div className="min-w-0">
                <div className={`font-display text-lg sm:text-xl md:text-3xl lg:text-4xl font-semibold break-words leading-tight`}>
                  <AdaptiveNumber value={card.amount} formatCurrency={formatCurrency} currency={settings.currency} colorClass={getValueColorClass(card.amount)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        <div className="glass-card p-4 md:p-6 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
            <h3 className="font-display text-lg md:text-2xl font-semibold text-on-surface">Cash Flow</h3>
          </div>
          <div className="flex-1 min-h-[200px] md:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffbf00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffbf00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e2725b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e2725b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(86, 66, 62, 0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#56423e' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#56423e' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--sys-glass-bg)', borderRadius: '12px', border: '1px solid var(--sys-glass-border)', boxShadow: '0 4px 20px var(--sys-glass-shadow)', color: 'var(--sys-on-surface)', backdropFilter: 'blur(16px)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#ffbf00" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#e2725b" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 flex flex-col">
          <h3 className="font-display text-lg md:text-2xl font-semibold text-on-surface mb-4 md:mb-6">Expenses</h3>
          <div className="flex-1 min-h-[180px] md:min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  isAnimationActive={false}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--sys-glass-bg)', borderRadius: '12px', border: '1px solid var(--sys-glass-border)', boxShadow: '0 4px 20px var(--sys-glass-shadow)', color: 'var(--sys-on-surface)', backdropFilter: 'blur(16px)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
