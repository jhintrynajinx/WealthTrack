import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  value: number;
  formatCurrency: (amount: number, currency: string) => string;
  currency: string;
  className?: string;
  colorClass?: string;
  isIncome?: boolean; // For +/- sign
}

export function AdaptiveNumber({ value, formatCurrency, currency, className, colorClass, isIncome }: Props) {
  const formattedValue = React.useMemo(() => {
    let text = formatCurrency(Math.abs(value), currency);
    if (isIncome !== undefined) {
      text = `${isIncome ? '+' : '-'}${text}`;
    } else if (value < 0) {
      text = `-${text}`;
    }
    return text;
  }, [value, currency, formatCurrency, isIncome]);

  const scale = React.useMemo(() => {
    const len = formattedValue.length;
    if (len <= 10) return 1;
    if (len <= 13) return 0.85;
    if (len <= 16) return 0.7;
    if (len <= 20) return 0.55;
    return 0.45; // Smallest allowed size
  }, [formattedValue]);

  return (
    <div className={cn("flex items-baseline max-w-full", className)}>
      <motion.span
        key="value"
        animate={{ 
          fontSize: `${scale}em`, 
          lineHeight: 1.1 
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn("break-words", colorClass)}
      >
        {formattedValue}
      </motion.span>
    </div>
  );
}

