import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, UploadCloud, File as FileIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

import { formatCurrency } from '../lib/utils';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string(),
  paymentMethod: z.enum(['eWallet', 'cash', 'bank']),
  merchant: z.string().optional(),
  notes: z.string().optional(),
  receiptImage: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentType: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: Props) {
  const { categories, transactions, addTransaction, settings } = useStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue, resetField } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'eWallet',
      amount: 0,
    }
  });

  const txType = watch('type');
  const filteredCategories = categories.filter(c => c.type === txType);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setAttachmentName(file.name);
        setAttachmentType(file.type);
        setValue('receiptImage', base64String);
        setValue('attachmentName', file.name);
        setValue('attachmentType', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: FormData) => {
    addTransaction({
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      date: new Date(data.date).toISOString(),
      paymentMethod: data.paymentMethod,
      merchant: data.merchant,
      notes: data.notes,
      receiptImage: data.receiptImage,
      attachmentName: data.attachmentName,
      attachmentType: data.attachmentType,
    });
    reset();
    setPreviewImage(null);
    setAttachmentName(null);
    setAttachmentType(null);
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
            className="relative w-full max-w-md max-h-[90vh] flex flex-col glass-card shadow-2xl overflow-hidden rounded-t-3xl md:rounded-3xl"
          >
            <div className="flex justify-between items-center p-4 md:p-6 pb-3 md:pb-4 shrink-0 border-b border-surface-variant/10">
              <h3 className="font-display text-lg md:text-xl font-bold text-on-surface">Add Record</h3>
              <button onClick={onClose} className="p-2 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto">
              <form id="add-record-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (txType !== 'expense') {
                        setValue('type', 'expense');
                        resetField('amount');
                        resetField('categoryId');
                      }
                    }}
                    className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${txType === 'expense' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (txType !== 'income') {
                        setValue('type', 'income');
                        resetField('amount');
                        resetField('categoryId');
                      }
                    }}
                    className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${txType === 'income' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'}`}
                  >
                    Income
                  </button>
                </div>

                <div>
                  <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm md:text-base">
                      {settings.currency === 'MYR' ? 'RM' : (settings.currency === 'USD' ? '$' : (settings.currency === 'EUR' ? '€' : (settings.currency === 'GBP' ? '£' : (settings.currency === 'SGD' ? 'S$' : settings.currency))))}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={watch('amount') > 0 ? watch('amount').toFixed(2) : ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const decimalValue = digits ? parseInt(digits, 10) / 100 : 0;
                        setValue('amount', decimalValue, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 pl-10 md:pl-12 pr-3 md:pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg md:text-xl font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && <p className="text-error text-[10px] md:text-xs mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Category</label>
                  <select
                    {...register('categoryId')}
                    className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  >
                    <option value="">Select Category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-error text-[10px] md:text-xs mt-1">{errors.categoryId.message}</p>}
                </div>

                <div>
                  <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Payment Method</label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  >
                    <option value="eWallet">E-Wallet</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Account</option>
                  </select>
                  {errors.paymentMethod && <p className="text-error text-[10px] md:text-xs mt-1">{errors.paymentMethod.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Date</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Merchant</label>
                    <input
                      type="text"
                      {...register('merchant')}
                      className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Starbucks"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Notes</label>
                  <input
                    type="text"
                    {...register('notes')}
                    className="w-full bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] md:text-xs text-on-surface-variant mb-1">Attachment</label>
                  <div className="mt-1 flex justify-center px-4 md:px-6 pt-4 md:pt-5 pb-4 md:pb-6 border-2 border-surface-variant/50 border-dashed rounded-xl hover:bg-surface-container-lowest/50 transition-colors">
                    <div className="space-y-1 text-center">
                      {previewImage ? (
                        <div className="relative inline-block">
                          {attachmentType?.startsWith('image/') ? (
                            <img src={previewImage} alt="Attachment preview" className="mx-auto h-24 object-cover rounded-md" />
                          ) : (
                            <div className="mx-auto h-24 w-24 bg-surface-container flex flex-col items-center justify-center rounded-md text-on-surface-variant border border-surface-variant/30">
                              <FileIcon size={32} className="mb-2" />
                              <span className="text-[10px] truncate w-20 px-1">{attachmentName || 'File'}</span>
                            </div>
                          )}
                          <button type="button" onClick={() => { setPreviewImage(null); setAttachmentName(null); setAttachmentType(null); setValue('receiptImage', ''); setValue('attachmentName', ''); setValue('attachmentType', ''); }} className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-sm">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="mx-auto h-8 w-8 text-on-surface-variant" />
                          <div className="flex text-sm text-on-surface-variant justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary-container focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                              <span>Upload a file</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} />
                            </label>
                          </div>
                          <p className="text-xs text-on-surface-variant/70">Images or Documents up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 md:p-6 pt-3 md:pt-4 shrink-0 bg-surface border-t border-surface-variant/10 pb-safe">
              <button
                form="add-record-form"
                type="submit"
                className="w-full bg-primary text-on-primary font-medium rounded-xl py-3 md:py-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 border-t border-white/20"
              >
                Save Record
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
