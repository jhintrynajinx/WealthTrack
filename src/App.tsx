import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { DailyBudget } from './components/DailyBudget/DailyBudget';
import { MonthlyReports } from './components/MonthlyReports/MonthlyReports';
import { Settings } from './components/Settings';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'daily-budget':
      case 'budget':
        return <DailyBudget />;
      case 'reports':
        return <MonthlyReports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </Layout>
  );
}

