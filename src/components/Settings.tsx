import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { StorageService } from '../services/storage';
import { Download, Upload, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function Settings() {
  const { settings, updateSettings, resetData, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Reference date: 30 June 2026
  const referenceDate = new Date(2026, 5, 30);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await StorageService.importData(file);
        importData(data);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Error importing data. Invalid file format.');
      }
    }
  };

  const handleExport = () => {
    const data = StorageService.loadData();
    if (data) {
      StorageService.exportData(data);
    }
  };

  const handleReset = () => {
    resetData();
    setShowConfirm(false);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {showToast && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-lg"
          >
            <CheckCircle2 size={18} className="text-primary" />
            <span className="text-sm font-medium">All data has been deleted successfully.</span>
          </div>
        )}

      {/* Confirmation Modal */}
      {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <div
              className="relative glass-card shadow-2xl w-full max-w-md p-6 overflow-hidden"
            >
              <h3 className="font-display text-xl font-bold text-on-surface mb-2">Reset All Data</h3>
              <p className="text-on-surface-variant mb-6">
                Are you sure you want to permanently delete all WealthTrack data?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg text-on-surface font-medium hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-error text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

      <div 
        className="glass-card p-4 md:p-6"
      >
        <h2 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-4 md:mb-6">Preferences</h2>
        
        <div className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Currency</label>
            <select 
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="w-full max-w-xs bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="MYR">MYR (RM)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Date Format</label>
            <select 
              value={settings.dateFormat}
              onChange={(e) => updateSettings({ dateFormat: e.target.value })}
              className="w-full max-w-xs bg-surface-container-lowest border border-surface-variant/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
              <option value="dd/MM/yyyy">{format(referenceDate, 'dd/MM/yyyy')} (DD/MM/YYYY)</option>
              <option value="MM/dd/yyyy">{format(referenceDate, 'MM/dd/yyyy')} (MM/DD/YYYY)</option>
              <option value="do 'of' MMMM yyyy">{format(referenceDate, "do 'of' MMMM yyyy")}</option>
            </select>
          </div>
        </div>
      </div>

      <div 
        className="glass-card p-4 md:p-6"
      >
        <h2 className="font-display text-xl md:text-2xl font-semibold text-on-surface mb-4 md:mb-6">Data Management</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 blue-card-soft border-0 text-blue-700 py-2 px-4 rounded-xl hover:opacity-80 transition-opacity"
            >
              <Download size={18} />
              <span>Export JSON</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 blue-card-soft border-0 text-blue-700 py-2 px-4 rounded-xl hover:opacity-80 transition-opacity"
            >
              <Upload size={18} />
              <span>Import JSON</span>
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImport}
              className="hidden" 
            />
          </div>

          <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-surface-variant/20">
            <h3 className="text-error font-medium mb-2">Danger Zone</h3>
            <p className="text-sm text-on-surface-variant mb-4">This will permanently delete all your data and settings.</p>
            <button 
              onClick={() => setShowConfirm(true)}
              className="flex items-center justify-center space-x-2 bg-error-container text-error py-2 px-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={18} />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
