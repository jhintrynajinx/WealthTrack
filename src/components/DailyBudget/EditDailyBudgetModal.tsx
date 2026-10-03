import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  monthName: string;
  totalDays: number;
  currency: string;
  onSave: (amount: number) => void;
}

export function EditDailyBudgetModal({
  isOpen,
  onClose,
  currentAmount,
  monthName,
  totalDays,
  currency,
  onSave,
}: Props) {
  const [inputValue, setInputValue] = useState(currentAmount.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentAmount > 0 ? currentAmount.toString() : '30');
      setError(null);
    }
  }, [isOpen, currentAmount]);

  const numVal = parseFloat(inputValue);
  const isValid = !isNaN(numVal) && numVal > 0;
  const projectedTotal = isValid ? numVal * totalDays : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Please enter a valid daily budget greater than 0.');
      return;
    }
    onSave(numVal);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md flex flex-col glass-card shadow-2xl overflow-hidden rounded-t-3xl md:rounded-3xl"
          >
            <div className="flex justify-between items-center p-4 md:p-6 pb-3 md:pb-4 border-b border-surface-variant/10">
              <div>
                <h3 className="font-display text-lg md:text-xl font-bold text-on-surface">
                  Edit Daily Budget
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Set daily limit for {monthName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Daily Budget Amount
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono text-sm font-semibold text-primary">
                    RM
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    placeholder="30.00"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-3 pl-12 pr-4 text-on-surface font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1.5 text-error text-xs mt-2">
                    <AlertCircle size={14} />
                    {error}
                  </p>
                )}
              </div>

              {/* Month summary preview */}
              <div className="p-3.5 bg-surface-container-low rounded-xl space-y-2 border border-surface-variant/20">
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Days in {monthName}:</span>
                  <span className="font-mono font-medium text-on-surface">{totalDays} days</span>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Total Budget for Month:</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {isValid ? formatCurrency(projectedTotal, currency) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-on-surface bg-surface-container-low hover:bg-surface-container font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1 py-2.5 px-4 rounded-xl blue-card text-white hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-medium text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Save Budget</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
