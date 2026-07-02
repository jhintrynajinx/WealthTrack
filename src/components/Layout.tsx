import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PlusCircle, Settings as SettingsIcon, Moon, Sun, CalendarDays } from 'lucide-react';
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
  const { settings, updateSettings, timeRange } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTimeSelectorOpen, setIsTimeSelectorOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'add', label: 'Add', icon: PlusCircle, isAction: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={cn("min-h-screen bg-surface text-on-surface antialiased transition-colors duration-300", settings.theme)}>
      
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
          <div className="flex items-center space-x-6">
            <button onClick={toggleTheme} className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-2 transition-colors duration-300">
              {settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary font-mono text-sm px-6 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all duration-300 shadow-md shadow-primary/20 border-t border-white/20"
            >
              Add Record
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
            <button onClick={toggleTheme} className="text-on-surface-variant hover:bg-surface-container-high rounded-full p-2 transition-colors duration-300">
              {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed left-0 top-0 h-full md:w-52 lg:w-64 z-50 border-r border-[var(--sys-glass-border)] p-4 pt-8 transition-colors duration-300">
        <div className="mb-12 px-4">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-primary truncate">WealthTrack</h2>
          <p className="text-xs lg:text-sm text-on-surface-variant mt-1 truncate">Manage your wealth</p>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.filter(i => !i.isAction).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]",
                activeView === item.id
                  ? "bg-primary-container text-on-primary-container font-medium shadow-sm"
                  : "text-on-surface-variant hover:bg-tertiary-container/20"
              )}
            >
              <item.icon className="mr-3" size={20} />
              <span className="font-mono text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden bg-[var(--sys-glass-bg)] backdrop-blur-xl fixed bottom-0 left-0 w-full z-40 border-t border-[var(--sys-glass-border)] transition-colors duration-300 shadow-lg px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.filter(i => !i.isAction).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all flex-1",
                activeView === item.id ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <item.icon size={20} className="mb-1" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed top-[calc(env(safe-area-inset-top)+0.25rem)] right-4 z-50 bg-primary text-on-primary p-2.5 shadow-lg shadow-primary/30 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <PlusCircle size={22} />
      </button>

      {/* Main Content */}
      <main className="md:ml-52 lg:ml-64 pt-20 md:pt-28 pb-24 md:pb-12 px-4 md:px-12 max-w-[1200px] mx-auto min-h-screen">
        {children}
      </main>

      <QuickAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TimeSelectorModal isOpen={isTimeSelectorOpen} onClose={() => setIsTimeSelectorOpen(false)} />
    </div>
  );
}
