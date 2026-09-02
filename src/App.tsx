/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navigation, NavTab } from './components/Navigation';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ExpensesList } from './components/ExpensesList';
import { RecurringExpenses } from './components/RecurringExpenses';
import { FinancialCalendar } from './components/FinancialCalendar';
import { ForecastView } from './components/ForecastView';
import { IncomesView } from './components/IncomesView';
import { CreditCardsView } from './components/CreditCardsView';
import { ReportsView } from './components/ReportsView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewIncomeModal } from './components/NewIncomeModal';
import { Expense } from './types';

function FinanceAppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const handleOpenNewExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenNewIncome = () => {
    setIsIncomeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation (Desktop) & Bottom Bar (Mobile) */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header with Month Navigator & Quick Actions */}
        <Header 
          onOpenNewExpense={handleOpenNewExpense}
          onOpenNewIncome={handleOpenNewIncome}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard 
              onOpenNewExpense={handleOpenNewExpense}
              onViewExpenses={() => setCurrentTab('expenses')}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesList 
              onEditExpense={handleEditExpense}
              onOpenNewExpense={handleOpenNewExpense}
            />
          )}

          {currentTab === 'incomes' && (
            <IncomesView onOpenNewIncome={handleOpenNewIncome} />
          )}

          {currentTab === 'calendar' && (
            <FinancialCalendar />
          )}

          {currentTab === 'cards' && (
            <CreditCardsView />
          )}

          {currentTab === 'recurring' && (
            <RecurringExpenses />
          )}

          {currentTab === 'forecast' && (
            <ForecastView />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'goals' && (
            <GoalsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <NewIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <FinanceAppContent />
    </FinanceProvider>
  );
}

