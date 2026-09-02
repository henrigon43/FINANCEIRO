import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, getMonthYearLabel } from '../utils/formatters';
import { CategoryPieChart } from './CategoryPieChart';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { CategoryIcon } from './CategoryIcon';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  CreditCard as CardIcon,
  ShieldCheck,
  Check
} from 'lucide-react';

interface DashboardProps {
  onOpenNewExpense: () => void;
  onOpenNewIncome?: () => void;
  onViewExpenses?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewExpense,
  onOpenNewIncome,
  onViewExpenses,
  onNavigateTab,
}) => {
  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    totalExpenses,
    totalPaid,
    totalPending,
    totalOverdue,
    totalIncome,
    projectedBalance,
    monthBalance,
    upcomingBills7Days,
    categoryTotals,
    monthlyComparison,
    monthExpenses,
    markExpenseAsPaid,
    categories,
    creditCards,
  } = useFinance();

  const handleNavigateToExpenses = () => {
    if (onViewExpenses) onViewExpenses();
    else if (onNavigateTab) onNavigateTab('expenses');
  };

  const handleNavigateToCards = () => {
    if (onNavigateTab) onNavigateTab('cards');
  };

  const paidPercentage = totalExpenses > 0 ? Math.min(100, Math.round((totalPaid / totalExpenses) * 100)) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Metric Cards Grid (Clean Minimalism 4-column layout) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Card 1: Total de Despesas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total de Despesas
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(totalExpenses)}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
            <span>Previsto para o mês</span>
          </div>
        </div>

        {/* Card 2: Total Pago */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
            Total Pago
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(totalPaid)}
          </p>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-500 rounded-full" 
              style={{ width: `${paidPercentage}%` }} 
            />
          </div>
        </div>

        {/* Card 3: Total Pendente */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            Total Pendente
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(totalPending)}
          </p>
          <p className="mt-3 text-[10px] text-slate-400">
            {upcomingBills7Days.length} {upcomingBills7Days.length === 1 ? 'vencimento' : 'vencimentos'} nos próximos 7 dias
          </p>
        </div>

        {/* Card 4: Total Vencido */}
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-xs bg-rose-50/20">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            Total Vencido
          </p>
          <p className="text-2xl font-black text-rose-700">
            {formatCurrency(totalOverdue)}
          </p>
          <p className="mt-3 text-[10px] text-rose-500 font-bold">
            {totalOverdue > 0 ? 'Ação imediata necessária' : 'Tudo em dia'}
          </p>
        </div>
      </section>

      {/* 2. Main Analytics & Upcoming Bills (Clean Minimalism 12-column layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 4: Gastos por Categoria */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900">Gastos por Categoria</h3>
            <button 
              onClick={handleNavigateToExpenses}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <CategoryPieChart 
              categoryTotals={categoryTotals} 
              monthExpenses={monthExpenses}
              onMarkAsPaid={markExpenseAsPaid}
            />
          </div>
        </div>

        {/* Col 8: Próximas Despesas Table */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Próximas Despesas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Vencimentos programados para este período</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleNavigateToExpenses}
                className="text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-md font-medium text-slate-600 transition-colors"
              >
                Ver Lista
              </button>
              <button 
                onClick={onOpenNewExpense}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors"
              >
                + Despesa
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {upcomingBills7Days.length === 0 && monthExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                Nenhuma despesa pendente neste mês.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {(upcomingBills7Days.length > 0 ? upcomingBills7Days : monthExpenses.slice(0, 6)).map((expense) => {
                    const cat = categories.find(c => c.id === expense.categoryId);
                    const isPaid = expense.status === 'pago';
                    const isOverdue = expense.status === 'vencido' || (!isPaid && new Date(expense.dueDate) < new Date());

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Vencimento */}
                        <td className="px-6 py-3.5 font-medium text-slate-500 text-xs">
                          {formatDateBR(expense.dueDate)}
                        </td>

                        {/* Descrição + Badges */}
                        <td className="px-6 py-3.5 font-bold text-slate-900 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[160px] sm:max-w-xs">{expense.description}</span>
                            {expense.type === 'fixa' && (
                              <span className="text-[10px] font-normal bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                FIXA
                              </span>
                            )}
                            {expense.installmentNumber && expense.totalInstallments && (
                              <span className="text-[10px] font-normal bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                {expense.installmentNumber}/{expense.totalInstallments}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {cat?.name || 'Geral'}
                        </td>

                        {/* Valor */}
                        <td className="px-6 py-3.5 text-right font-bold text-slate-900 text-xs">
                          {formatCurrency(expense.amount)}
                        </td>

                        {/* Status (Clean colored dot & quick pay) */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span 
                              className={`w-2.5 h-2.5 rounded-full inline-block ${
                                isPaid 
                                  ? 'bg-green-500' 
                                  : isOverdue 
                                  ? 'bg-rose-500' 
                                  : 'bg-amber-400'
                              }`} 
                              title={isPaid ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                            />
                            {!isPaid && (
                              <button
                                onClick={() => markExpenseAsPaid(expense.id)}
                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-[10px] text-green-700 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded transition-all"
                                title="Marcar como pago"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* 3. Secondary Section: Evolução Mensal & Cartões de Crédito */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Evolução Mensal Chart */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <MonthlyComparisonChart 
            monthlyData={monthlyComparison}
            onSelectMonth={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
          />
        </div>

        {/* Resumo Cartões de Crédito */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CardIcon className="w-4 h-4 text-indigo-600" />
                Cartões de Crédito
              </h3>
              <button
                onClick={handleNavigateToCards}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Gerenciar
              </button>
            </div>

            {creditCards.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Nenhum cartão cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {creditCards.map(card => {
                  const cardExpenses = monthExpenses
                    .filter(e => e.cardId === card.id)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const usagePercent = Math.min(100, (cardExpenses / (card.limit || 1)) * 100);

                  return (
                    <div key={card.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">{card.name}</span>
                        <span className="font-mono text-slate-400">•••• {card.last4Digits || '0000'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Fatura atual:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(cardExpenses)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${usagePercent}%`,
                            backgroundColor: card.color || '#4F46E5'
                          }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Fecha dia {card.closingDay}</span>
                        <span>Vence dia {card.dueDay}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={onOpenNewExpense}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Lançar Despesa
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
