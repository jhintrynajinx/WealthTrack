import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PlusCircle, Settings as SettingsIcon, CalendarDays, CalendarCheck, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { QuickAddModal } from './QuickAddModal';
import { TimeSelectorModal } from './TimeSelectorModal';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}

export function Layout({ children, activeView, setActiveView }: LayoutProps) {
  const { timeRange } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTimeSelectorOpen, setIsTimeSelectorOpen] = useState(false);

  useEffect(() => {
    // Always enforce light theme — remove any previously stored dark class
    document.documentElement.classList.remove('dark');
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'daily-budget', label: 'Daily Budget', icon: CalendarCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'add', label: 'Add', icon: PlusCircle, isAction: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      
      {/* Desktop Top Nav */}
      <nav className="hidden md:flex bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed top-0 w-full z-40 border-b border-[var(--sys-glass-border)] shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center px-6 md:px-8 lg:px-12 py-4 max-w-[1200px] mx-auto w-full md:ml-52 lg:ml-64">
          <div className="flex items-center space-x-4 flex-1">
            <button 
              onClick={() => setIsTimeSelectorOpen(true)}
              className="flex items-center space-x-2 text-on-surface hover:bg-surface-container-high px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium"
            >
              <CalendarDays size={18} className="text-primary" />
              <span>{timeRange.label}</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="blue-card text-white font-sans text-sm px-5 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200"
            >
              + Add Record
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <nav className="md:hidden bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed top-0 left-0 w-full z-40 border-b border-[var(--sys-glass-border)] shadow-sm transition-colors duration-300 pt-[env(safe-area-inset-top)]">
        <div className="flex justify-between items-center px-4 py-2 h-14">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsTimeSelectorOpen(true)}
              className="flex items-center space-x-2 text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded-full transition-all duration-300 text-sm font-medium bg-surface-container-low"
            >
              <CalendarDays size={16} className="text-primary" />
              <span className="truncate max-w-[150px]">{timeRange.label}</span>
            </button>
          </div>
          <div className="flex items-center mr-14">
            {/* Dark mode removed — single light theme */}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed left-0 top-0 h-full md:w-52 lg:w-64 z-50 border-r border-[var(--sys-glass-border)] p-4 pt-8 transition-colors duration-300">
        <div className="mb-12 px-4">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-primary truncate">WealthTrack</h2>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate font-mono">Personal Finance</p>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.filter(i => !i.isAction).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200",
                activeView === item.id
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              <item.icon className="mr-3" size={20} />
              <span className="font-mono text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed bottom-0 left-0 w-full z-40 border-t border-[var(--sys-glass-border)] transition-colors duration-300 shadow-md px-2 pb-safe">
        <div className="flex justify-around items-center h-13 py-1">
          {navItems.filter(i => !i.isAction).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex items-center justify-center rounded-xl p-2.5 transition-all flex-1 min-w-0 max-w-[64px]",
                activeView === item.id
                  ? "text-primary bg-primary/10 shadow-xs"
                  : "text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container/50"
              )}
            >
              <item.icon size={21} />
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed top-[calc(env(safe-area-inset-top)+0.25rem)] right-4 z-50 blue-card text-white p-2.5 shadow-lg rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <PlusCircle size={22} />
      </button>

      {/* Main Content */}
      <main className="md:ml-52 lg:ml-64 pt-16 md:pt-28 pb-20 md:pb-12 px-3.5 sm:px-6 md:px-12 max-w-[1200px] mx-auto min-h-screen">
        {children}
      </main>

      <QuickAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TimeSelectorModal isOpen={isTimeSelectorOpen} onClose={() => setIsTimeSelectorOpen(false)} />
    </div>
  );
}
