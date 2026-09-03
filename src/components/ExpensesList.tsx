import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Expense, ExpenseStatus, ExpenseType, PaymentMethod } from '../types';
import { formatCurrency, formatDateBR, formatDateShortBR, getDaysDifference, toDateString, MONTH_NAMES_BR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { 
  Search, 
  Filter, 
  Check, 
  Edit3, 
  Trash2, 
  Layers, 
  Repeat, 
  Calendar, 
  CreditCard, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  X
} from 'lucide-react';

interface ExpensesListProps {
  onEditExpense: (expense: Expense) => void;
  onOpenNewExpense: () => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ onEditExpense, onOpenNewExpense }) => {
  const { 
    expenses, 
    categories, 
    selectedYear, 
    selectedMonth, 
    markExpenseAsPaid, 
    markExpenseAsPending, 
    deleteExpense 
  } = useFinance();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'este_mes' | 'hoje' | 'esta_semana' | 'proximo_mes' | 'todos'>('este_mes');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('todos');
  const [showFiltersBar, setShowFiltersBar] = useState(false);

  // Quick Action Dialog States
  const [confirmPayExpense, setConfirmPayExpense] = useState<Expense | null>(null);
  const [deleteExpenseDialog, setDeleteExpenseDialog] = useState<Expense | null>(null);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const todayStr = toDateString(today);

    return expenses.filter(expense => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = expense.description.toLowerCase().includes(term);
        const catName = categories.find(c => c.id === expense.categoryId)?.name.toLowerCase() || '';
        const catMatch = catName.includes(term);
        if (!descMatch && !catMatch) return false;
      }

      // 2. Period Filter
      if (periodFilter === 'este_mes') {
        const parts = expense.dueDate.split('-');
        if (Number(parts[0]) !== selectedYear || Number(parts[1]) - 1 !== selectedMonth) {
          return false;
        }
      } else if (periodFilter === 'hoje') {
        if (expense.dueDate !== todayStr) return false;
      } else if (periodFilter === 'esta_semana') {
        const diff = getDaysDifference(expense.dueDate, today);
        if (diff < 0 || diff > 7) return false;
      } else if (periodFilter === 'proximo_mes') {
        let nextM = selectedMonth + 1;
        let nextY = selectedYear;
        if (nextM > 11) {
          nextM = 0;
          nextY += 1;
        }
        const parts = expense.dueDate.split('-');
        if (Number(parts[0]) !== nextY || Number(parts[1]) - 1 !== nextM) {
          return false;
        }
      }

      // 3. Category Filter
      if (categoryFilter !== 'todas' && expense.categoryId !== categoryFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'todos') {
        if (statusFilter === 'pagos' && expense.status !== 'pago') return false;
        if (statusFilter === 'pendentes' && expense.status !== 'pendente') return false;
        if (statusFilter === 'vencidos' && expense.status !== 'vencido') return false;
      }

      // 5. Type Filter
      if (typeFilter !== 'todos' && expense.type !== typeFilter) {
        return false;
      }

      // 6. Payment Method Filter
      if (paymentMethodFilter !== 'todos' && expense.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [
    expenses, 
    searchTerm, 
    periodFilter, 
    categoryFilter, 
    statusFilter, 
    typeFilter, 
    paymentMethodFilter, 
    selectedYear, 
    selectedMonth, 
    categories
  ]);

  // Aggregate stats of current filtered selection
  const filteredTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const filteredPaid = filteredExpenses.filter(e => e.status === 'pago').reduce((acc, e) => acc + e.amount, 0);
  const filteredPending = filteredExpenses.filter(e => e.status !== 'pago').reduce((acc, e) => acc + e.amount, 0);

  const handleConfirmPayment = () => {
    if (confirmPayExpense) {
      markExpenseAsPaid(confirmPayExpense.id);
      setConfirmPayExpense(null);
    }
  };

  const handleDeleteChoice = (deleteAll: boolean) => {
    if (deleteExpenseDialog) {
      deleteExpense(deleteExpenseDialog.id, deleteAll);
      setDeleteExpenseDialog(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Period Segmented Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto text-xs shrink-0">
            {[
              { id: 'este_mes', label: `Este Mês (${MONTH_NAMES_BR[selectedMonth] || ''})` },
              { id: 'hoje', label: 'Hoje' },
              { id: 'esta_semana', label: 'Esta Semana' },
              { id: 'proximo_mes', label: 'Próximo Mês' },
              { id: 'todos', label: 'Ver Todas' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriodFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all ${
                  periodFilter === tab.id
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowFiltersBar(!showFiltersBar)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
              showFiltersBar 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFiltersBar ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Detailed Filters Panel */}
        {showFiltersBar && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
              >
                <option value="todas">Todas as categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
              >
                <option value="todos">Todos os status</option>
                <option value="pagos">Pagos</option>
                <option value="pendentes">Pendentes</option>
                <option value="vencidos">Vencidos</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Tipo de Despesa
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
              >
                <option value="todos">Todos os tipos</option>
                <option value="unica">Única</option>
                <option value="parcelada">Parcelada</option>
                <option value="fixa">Fixa / Recorrente</option>
              </select>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden capitalize"
              >
                <option value="todos">Todas as formas</option>
                {(['pix', 'credito', 'debito', 'boleto', 'dinheiro', 'transferencia', 'outros'] as PaymentMethod[]).map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Filter Summary Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Mostrando <strong>{filteredExpenses.length}</strong> lançamento(s)
          </span>
          <div className="flex items-center gap-3">
            <span>Total: <strong className="text-slate-900">{formatCurrency(filteredTotal)}</strong></span>
            <span>Pago: <strong className="text-green-600">{formatCurrency(filteredPaid)}</strong></span>
            <span>Pendente: <strong className="text-amber-600">{formatCurrency(filteredPending)}</strong></span>
          </div>
        </div>
      </div>

      {/* TABELA DE DESPESAS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma despesa para {MONTH_NAMES_BR[selectedMonth]} de {selectedYear}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Você tem {expenses.length} despesa(s) cadastradas no total no banco de dados sincronizado.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setPeriodFilter('todos')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                Ver Todas as Despesas ({expenses.length})
              </button>
              <button
                onClick={onOpenNewExpense}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                + Nova Despesa
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((expense) => {
                  const cat = categories.find(c => c.id === expense.categoryId);
                  const isPaid = expense.status === 'pago';
                  const isOverdue = expense.status === 'vencido' || (!isPaid && getDaysDifference(expense.dueDate) < 0);

                  return (
                    <tr 
                      key={expense.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPaid ? 'opacity-85' : isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formatDateBR(expense.dueDate)}</span>
                          {expense.paymentDate && (
                            <span className="text-[10px] text-green-600 font-sans">
                              Pago em {formatDateShortBR(expense.paymentDate)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{expense.description}</span>
                          {expense.installmentNumber && expense.totalInstallments && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold font-mono">
                              {expense.installmentNumber}/{expense.totalInstallments}
                            </span>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-[10px] text-slate-400 italic truncate max-w-[200px]">{expense.notes}</p>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat?.color || '#64748B'}20`, color: cat?.color || '#64748B' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Package'} className="w-3 h-3" />
                          </div>
                          <span className="text-slate-700 font-medium whitespace-nowrap">{cat?.name || 'Outros'}</span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {expense.type === 'fixa' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            <Repeat className="w-2.5 h-2.5" />
                            Fixa
                          </span>
                        ) : expense.type === 'parcelada' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[10px] border border-amber-100">
                            <Layers className="w-2.5 h-2.5" />
                            {expense.installmentNumber ? `${expense.installmentNumber}/${expense.totalInstallments}` : 'Parcelada'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                            Única
                          </span>
                        )}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                        {expense.paymentMethod}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Pago
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* AÇÕES RÁPIDAS: Marcar como pago, Editar, Excluir */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-click Pay Button */}
                          {!isPaid ? (
                            <button
                              onClick={() => setConfirmPayExpense(expense)}
                              className="p-1.5 rounded-md text-green-700 hover:bg-green-50 transition-colors"
                              title="Marcar como pago"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => markExpenseAsPending(expense.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Desmarcar pagamento (voltar a pendente)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditExpense(expense)}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Editar despesa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteExpenseDialog(expense)}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação Rápida de Pagamento */}
      {confirmPayExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setConfirmPayExpense(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-center text-base">
              Marcar esta despesa como paga?
            </h4>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-600 border border-slate-100">
              <p className="font-bold text-slate-900 text-sm">{confirmPayExpense.description}</p>
              <p className="font-extrabold text-green-700 text-base mt-1">{formatCurrency(confirmPayExpense.amount)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Vencimento: {formatDateBR(confirmPayExpense.dueDate)}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmPayExpense(null)}
                className="py-2 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Sim, Marcar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteExpenseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDeleteExpenseDialog(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-center text-base">
              Excluir Despesa
            </h4>
            <p className="text-xs text-slate-500 text-center mt-1">
              {deleteExpenseDialog.description} • {formatCurrency(deleteExpenseDialog.amount)}
            </p>

            {deleteExpenseDialog.installmentGroupId ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-700 font-semibold text-center mb-2">
                  Esta é uma despesa parcelada. Como deseja proceder?
                </p>
                <button
                  onClick={() => handleDeleteChoice(false)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  Excluir somente esta parcela
                </button>
                <button
                  onClick={() => handleDeleteChoice(true)}
                  className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Excluir todas as parcelas ({deleteExpenseDialog.totalInstallments}x)
                </button>
                <button
                  onClick={() => setDeleteExpenseDialog(null)}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium text-center"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteExpenseDialog(null)}
                  className="py-2 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteChoice(false)}
                  className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Confirmar Exclusão
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
