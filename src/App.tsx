/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { AdminUsersView } from './components/AdminUsersView';
import { LoginView } from './components/LoginView';
import { NotificationModal } from './components/NotificationModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewIncomeModal } from './components/NewIncomeModal';
import { Expense } from './types';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

function FinanceAppContent() {
  const { currentUser, isMasterAdmin, isLoading, activeViewingUser, stopImpersonation } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Pop up de notificação abre automaticamente ao abrir ou atualizar a página
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(true);

  // Redireciona usuário comum caso tente acessar a aba de usuários diretamente
  useEffect(() => {
    if (currentTab === 'users' && !isMasterAdmin) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, isMasterAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Carregando sistema financeiro...</p>
      </div>
    );
  }

  // Redirecionamento obrigatório para tela de Login caso não esteja autenticado
  if (!currentUser) {
    return <LoginView />;
  }

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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col text-slate-900 font-sans antialiased">
      {/* Impersonation Top Banner (quando Master inspeciona planilha de outro usuário) */}
      {activeViewingUser && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              Você está visualizando a planilha de <strong>{activeViewingUser.name}</strong> (@{activeViewingUser.username}). As alterações são salvas para este usuário.
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Master</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation (Desktop) & Bottom Bar (Mobile) */}
        <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
          {/* Top Header with Month Navigator, Sync, Alerts and Quick Actions */}
          <Header 
            onOpenNewExpense={handleOpenNewExpense}
            onOpenNewIncome={handleOpenNewIncome}
            onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
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

            {currentTab === 'users' && isMasterAdmin && (
              <AdminUsersView 
                onNavigateToExpenses={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView />
            )}
          </main>
        </div>
      </div>

      {/* Pop-up de Notificação (abre na inicialização/atualização ou pelo sino) */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onViewExpenses={() => {
          setIsNotificationModalOpen(false);
          setCurrentTab('expenses');
        }}
      />

      {/* Modals de Nova Despesa e Receita */}
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
    <AuthProvider>
      <FinanceProvider>
        <FinanceAppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}

