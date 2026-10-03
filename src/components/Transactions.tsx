import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, getValueColorClass } from '../lib/utils';
import { 
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState
} from '@tanstack/react-table';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { Transaction } from '../types';
import { ArrowUpDown, Trash2, Search, ChevronDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Image as ImageIcon, File as FileIcon, Download } from 'lucide-react';
import { AdaptiveNumber } from './AdaptiveNumber';

const columnHelper = createColumnHelper<Transaction>();

export function Transactions() {
  const { transactions, categories, deleteTransaction, settings, timeRange } = useStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterType, setActiveFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExpenseExpanded, setIsExpenseExpanded] = useState(false);
  const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    const start = new Date(timeRange.start).getTime();
    const end = new Date(timeRange.end).getTime();

    return transactions.filter(t => {
      const txTime = new Date(t.date).getTime();
      const matchesTimeRange = txTime >= start && txTime <= end;

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (t.merchant?.toLowerCase().includes(q)) || 
        (t.notes?.toLowerCase().includes(q));

      const matchesMode = activeFilterType === 'all' || t.type === activeFilterType;
      const matchesCategory = !selectedCategory || t.categoryId === selectedCategory;

      return matchesTimeRange && matchesSearch && matchesMode && matchesCategory;
    });
  }, [transactions, searchQuery, activeFilterType, selectedCategory, timeRange]);

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: info => <span className="font-mono text-sm text-on-surface-variant">{formatDate(info.getValue(), settings.dateFormat)}</span>,
    }),
    columnHelper.accessor('merchant', {
      header: 'Merchant',
      cell: info => (
        <span className="font-medium text-on-surface line-clamp-2" title={info.getValue() || 'Unknown'}>{info.getValue() || 'Unknown'}</span>
      ),
    }),
    columnHelper.accessor('categoryId', {
      header: 'Category',
      cell: info => {
        const cat = categories.find(c => c.id === info.getValue());
        const isFixed = info.row.original.fixedExpense;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat?.color || 'bg-surface-variant text-on-surface-variant'} transition-colors duration-300`}>
              {cat?.name || 'Uncategorized'}
            </span>
            {isFixed && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                Fixed
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('paymentMethod', {
      header: 'Account',
      cell: info => {
        const method = info.getValue();
        const label = method === 'eWallet' ? 'E-Wallet' : method === 'cash' ? 'Cash' : 'Bank';
        return <span className="font-medium text-on-surface text-sm">{label}</span>;
      },
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => {
        return (
          <button
            className="flex items-center space-x-1 hover:text-primary transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            <span>Amount</span>
            <ArrowUpDown size={14} />
          </button>
        )
      },
      cell: info => {
        const isIncome = info.row.original.type === 'income';
        const amountVal = isIncome ? info.getValue() : -info.getValue();
        return (
          <div className="w-24 lg:w-32">
            <AdaptiveNumber 
              value={info.getValue()} 
              formatCurrency={formatCurrency} 
              currency={settings.currency} 
              isIncome={isIncome}
              colorClass={`font-mono font-medium ${getValueColorClass(amountVal)}`}
            />
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => {
        const tx = info.row.original;
        const isImage = !tx.attachmentType || tx.attachmentType.startsWith('image/');
        return (
          <div className="flex items-center gap-2">
            {tx.receiptImage && isImage && (
              <button
                onClick={() => setPreviewImage(tx.receiptImage!)}
                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
                title="View Attachment"
              >
                <ImageIcon size={16} />
              </button>
            )}
            {tx.receiptImage && !isImage && (
              <a
                href={tx.receiptImage}
                download={tx.attachmentName || 'attachment'}
                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors inline-flex items-center justify-center"
                title={`Download ${tx.attachmentName || 'Attachment'}`}
              >
                <Download size={16} />
              </a>
            )}
            <button 
              onClick={() => deleteTransaction(tx.id)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    })
  ], [categories, deleteTransaction, settings]);

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
        <h2 className="font-display text-lg sm:text-2xl font-semibold text-on-surface">Transactions</h2>
      </div>
      
      <div className="glass-card p-2.5 sm:p-5">
        <div className="flex flex-col gap-2 sm:gap-3 mb-2.5 sm:mb-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input
                type="text"
                placeholder="Search by merchant or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-surface-container-low/70 border border-surface-variant/40 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-full transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="bg-surface-container-low/80 border border-surface-variant/40 rounded-xl p-0.5 inline-flex">
              <button
                onClick={() => { setActiveFilterType('all'); setSelectedCategory(null); setIsExpenseExpanded(false); setIsIncomeExpanded(false); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ease-in-out ${activeFilterType === 'all' && !isExpenseExpanded && !isIncomeExpanded ? 'bg-surface-container-lowest text-primary shadow-xs border border-primary/20 font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                All
              </button>
              
              <div className="flex items-center ml-0.5">
                <button
                  onClick={() => { setActiveFilterType('expense'); setSelectedCategory(null); setIsExpenseExpanded(false); setIsIncomeExpanded(false); }}
                  className={`px-3 py-1 rounded-l-lg text-xs font-medium transition-all duration-200 ease-in-out ${(isExpenseExpanded || (!isIncomeExpanded && activeFilterType === 'expense')) ? 'bg-surface-container-lowest text-primary shadow-xs border border-primary/20 font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => { setIsExpenseExpanded(!isExpenseExpanded); setIsIncomeExpanded(false); }}
                  className={`px-1.5 py-1 rounded-r-lg border-l border-surface-variant/20 transition-all duration-200 ease-in-out ${(isExpenseExpanded || (!isIncomeExpanded && activeFilterType === 'expense')) ? 'bg-surface-container-lowest text-primary shadow-xs border border-primary/20 border-l-transparent' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isExpenseExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="flex items-center ml-0.5">
                <button
                  onClick={() => { setActiveFilterType('income'); setSelectedCategory(null); setIsIncomeExpanded(false); setIsExpenseExpanded(false); }}
                  className={`px-3 py-1 rounded-l-lg text-xs font-medium transition-all duration-200 ease-in-out ${(isIncomeExpanded || (!isExpenseExpanded && activeFilterType === 'income')) ? 'bg-surface-container-lowest text-primary shadow-xs border border-primary/20 font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Income
                </button>
                <button
                  onClick={() => { setIsIncomeExpanded(!isIncomeExpanded); setIsExpenseExpanded(false); }}
                  className={`px-1.5 py-1 rounded-r-lg border-l border-surface-variant/20 transition-all duration-200 ease-in-out ${(isIncomeExpanded || (!isExpenseExpanded && activeFilterType === 'income')) ? 'bg-surface-container-lowest text-primary shadow-xs border border-primary/20 border-l-transparent' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isIncomeExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            {selectedCategory && activeFilterType !== 'all' && (
              (() => {
                const cat = categories.find(c => c.id === selectedCategory);
                return (
                  <div className={`flex items-center px-3 py-1.5 ${cat?.color || 'bg-primary-container text-on-primary-container'} rounded-xl text-sm font-medium shadow-sm transition-colors duration-300`}>
                    {cat?.name}
                    <button onClick={() => setSelectedCategory(null)} className="ml-2 hover:bg-black/10 rounded-full p-0.5 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                );
              })()
            )}
          </div>

            {(isExpenseExpanded || isIncomeExpanded) && (
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-2 p-4 bg-surface-container-lowest border border-surface-variant/30 rounded-xl mt-1">
                  {categories.filter(c => c.type === (isExpenseExpanded ? 'expense' : 'income')).map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveFilterType(isExpenseExpanded ? 'expense' : 'income');
                        setSelectedCategory(c.id);
                        setIsExpenseExpanded(false);
                        setIsIncomeExpanded(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCategory === c.id ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container border border-surface-variant/50 text-on-surface hover:bg-surface-container-high'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
        
        {/* Mobile & Tablet Card Layout */}
        <div className="grid lg:hidden gap-2 sm:gap-2.5">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const amountVal = isIncome ? tx.amount : -tx.amount;
              const cat = categories.find(c => c.id === tx.categoryId);
              const label = tx.paymentMethod === 'eWallet' ? 'E-Wallet' : tx.paymentMethod === 'cash' ? 'Cash' : 'Bank';
              
              return (
                <div
                  key={tx.id}
                  className="bg-surface-container-lowest/90 p-2.5 sm:p-3.5 rounded-xl border border-surface-variant/20 shadow-xs flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm sm:text-base text-on-surface truncate" title={tx.merchant || 'Unknown Merchant'}>
                        {tx.merchant || 'Unknown Merchant'}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium ${cat?.color || 'bg-surface-variant text-on-surface-variant'}`}>
                          {cat?.name || 'Uncategorized'}
                        </span>
                        {tx.fixedExpense && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                            Fixed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 max-w-[130px] sm:max-w-[180px]">
                      <div className="font-mono text-sm sm:text-base font-bold text-right leading-tight">
                        <AdaptiveNumber 
                          value={tx.amount} 
                          formatCurrency={formatCurrency} 
                          currency={settings.currency} 
                          isIncome={isIncome} 
                          colorClass={getValueColorClass(amountVal)} 
                          className="justify-end"
                        />
                      </div>
                      <span className="text-[9.5px] font-medium text-on-surface-variant mt-0.5 px-1.5 py-0.2 bg-surface-container rounded">
                        {label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-surface-variant/10">
                    <span className="font-mono">{formatDate(tx.date, settings.dateFormat)}</span>
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {(tx.notes || tx.receiptImage) && (
                    <div className="flex flex-col gap-2 mt-1">
                      {tx.notes && (
                        <div className="bg-surface-container-lowest/50 p-2.5 rounded-xl border border-surface-variant/20 text-xs md:text-sm text-on-surface-variant">
                          <span className="font-semibold mr-1">Notes:</span>
                          <span className="whitespace-pre-wrap break-words">{tx.notes}</span>
                        </div>
                      )}
                      {tx.receiptImage && (
                        (!tx.attachmentType || tx.attachmentType.startsWith('image/')) ? (
                          <div 
                            onClick={() => setPreviewImage(tx.receiptImage!)}
                            className="relative h-20 md:h-24 rounded-xl border border-surface-variant/30 overflow-hidden cursor-pointer group w-fit min-w-[80px]"
                          >
                            <img src={tx.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="text-white" size={24} />
                            </div>
                          </div>
                        ) : (
                          <a
                            href={tx.receiptImage}
                            download={tx.attachmentName || 'attachment'}
                            className="flex items-center gap-3 p-3 bg-surface-container-lowest/50 rounded-xl border border-surface-variant/30 hover:bg-surface-container-low transition-colors w-fit"
                          >
                            <div className="bg-surface-variant/20 p-2 rounded-lg text-on-surface-variant">
                              <FileIcon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs md:text-sm font-medium text-on-surface truncate max-w-[150px]">
                                {tx.attachmentName || 'Document'}
                              </span>
                              <span className="text-[10px] text-on-surface-variant uppercase">
                                {tx.attachmentType?.split('/')[1] || 'FILE'}
                              </span>
                            </div>
                            <Download size={16} className="text-on-surface-variant ml-2" />
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          {filteredTransactions.length === 0 && (
            <div className="py-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant/20">
              <div className="inline-flex flex-col items-center justify-center text-on-surface-variant">
                <Search size={40} className="mb-4 opacity-20" />
                <p className="text-base font-medium text-on-surface">No transactions found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters.</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-surface-variant/20">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="pb-3 text-sm font-semibold text-on-surface-variant whitespace-nowrap px-2 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
              <tbody>
                {table.getRowModel().rows.map(row => {
                const tx = row.original as Transaction;
                return (
                <React.Fragment key={row.id}>
                  <tr className={`hover:bg-surface-container-low/30 transition-colors ${!tx.notes && !tx.receiptImage ? 'border-b border-surface-variant/10' : ''}`}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={`py-4 px-2 text-sm ${(tx.notes || tx.receiptImage) ? 'pb-2' : ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {(tx.notes || tx.receiptImage) && (
                    <tr className="border-b border-surface-variant/10">
                      <td colSpan={6} className="pt-0 pb-3 px-2">
                        <div className="flex flex-col gap-2 bg-surface-container-lowest/50 p-3 rounded-lg border border-surface-variant/20 ml-2">
                          {tx.notes && (
                            <div className="text-xs text-on-surface-variant">
                              <span className="font-semibold mr-1">Notes:</span>
                              <span className="whitespace-pre-wrap break-words">{tx.notes}</span>
                            </div>
                          )}
                          {tx.receiptImage && (
                            (!tx.attachmentType || tx.attachmentType.startsWith('image/')) ? (
                              <div 
                                onClick={() => setPreviewImage(tx.receiptImage!)}
                                className="relative h-20 w-32 rounded-lg border border-surface-variant/30 overflow-hidden cursor-pointer group shrink-0"
                              >
                                <img src={tx.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon className="text-white" size={20} />
                                </div>
                              </div>
                            ) : (
                              <a
                                href={tx.receiptImage}
                                download={tx.attachmentName || 'attachment'}
                                className="flex items-center gap-3 p-2.5 bg-surface-container-lowest/50 rounded-lg border border-surface-variant/30 hover:bg-surface-container-low transition-colors w-fit shrink-0"
                              >
                                <div className="bg-surface-variant/20 p-2 rounded text-on-surface-variant">
                                  <FileIcon size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-on-surface truncate max-w-[120px]">
                                    {tx.attachmentName || 'Document'}
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant uppercase">
                                    {tx.attachmentType?.split('/')[1] || 'FILE'}
                                  </span>
                                </div>
                                <Download size={14} className="text-on-surface-variant ml-2" />
                              </a>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-on-surface-variant">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium text-on-surface">No transactions found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              </tbody>
          </table>
        </div>
      </div>

      {previewImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8">
            <div 
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-md"
              onClick={() => setPreviewImage(null)}
            />
            <div
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col glass-card shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="p-2 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="w-full h-full overflow-auto flex items-center justify-center p-2 bg-black/20">
                <img 
                  src={previewImage} 
                  alt="Receipt Full Preview" 
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}


