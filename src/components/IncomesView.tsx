import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Repeat, 
  Edit3, 
  Filter, 
  Search, 
  X, 
  ChevronDown, 
  RotateCcw 
} from 'lucide-react';
import { Income } from '../types';
import { NewIncomeModal } from './NewIncomeModal';

interface IncomesViewProps {
  onOpenNewIncome: () => void;
}

export const IncomesView: React.FC<IncomesViewProps> = ({ onOpenNewIncome }) => {
  const { 
    monthIncomes, 
    categories, 
    totalIncome, 
    totalExpenses, 
    projectedBalance, 
    deleteIncome, 
    markIncomeStatus 
  } = useFinance();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [showFiltersBar, setShowFiltersBar] = useState(false);

  // Edit Income Modal State
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    return monthIncomes.filter(inc => {
      // 1. Search text
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = inc.description.toLowerCase().includes(query);
        const cat = categories.find(c => c.id === inc.categoryId);
        const matchCat = cat?.name.toLowerCase().includes(query);
        if (!matchDesc && !matchCat) return false;
      }

      // 2. Category
      if (categoryFilter !== 'todas' && inc.categoryId !== categoryFilter) {
        return false;
      }

      // 3. Status
      if (statusFilter !== 'todos' && inc.status !== statusFilter) {
        return false;
      }

      // 4. Type (Recorrente vs Única)
      if (typeFilter === 'recorrente' && !inc.isRecurring) {
        return false;
      }
      if (typeFilter === 'unica' && inc.isRecurring) {
        return false;
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthIncomes, searchTerm, categoryFilter, statusFilter, typeFilter, categories]);

  // Aggregate stats of filtered selection
  const filteredTotal = filteredIncomes.reduce((acc, inc) => acc + inc.amount, 0);
  const filteredReceived = filteredIncomes.filter(inc => inc.status === 'recebido').reduce((acc, inc) => acc + inc.amount, 0);
  const filteredPending = filteredIncomes.filter(inc => inc.status !== 'recebido').reduce((acc, inc) => acc + inc.amount, 0);

  const hasActiveFilters = searchTerm !== '' || categoryFilter !== 'todas' || statusFilter !== 'todos' || typeFilter !== 'todos';

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('todas');
    setStatusFilter('todos');
    setTypeFilter('todos');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Entradas e Recebimentos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestão de Receitas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre salários, rendimentos e rendas extras para projetar seu saldo real.
          </p>
        </div>

        <button
          onClick={onOpenNewIncome}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Nova Receita
        </button>
      </div>

      {/* Saldo do Mês Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total de Receitas</span>
          <p className="text-2xl font-bold text-green-600 mt-1 font-mono">{formatCurrency(totalIncome)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Previsto no mês selecionado</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total de Despesas</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{formatCurrency(totalExpenses)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Contas e parcelas previstas</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Saldo Previsto Final</span>
          <p className={`text-2xl font-bold mt-1 font-mono ${projectedBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatCurrency(projectedBalance)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Disponível previsto após contas</span>
        </div>
      </div>

      {/* Incomes Controls & Filters Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar receita por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filters Panel */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 border border-rose-200 cursor-pointer"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}

            <button
              onClick={() => setShowFiltersBar(!showFiltersBar)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
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
        </div>

        {/* Detailed Filters Panel */}
        {showFiltersBar && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
            {/* Categoria */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Categoria de Receita
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
              >
                <option value="todas">Todas as categorias</option>
                {categories.filter(c => c.type === 'income' || c.type === 'both').map(c => (
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
                <option value="recebido">Recebido na Conta</option>
                <option value="previsto">Previsto</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden"
              >
                <option value="todos">Todos os tipos</option>
                <option value="recorrente">Recorrente Mensal</option>
                <option value="unica">Única</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50 gap-2">
          <span>
            Mostrando <strong>{filteredIncomes.length}</strong> receita(s)
          </span>
          <div className="flex items-center gap-3">
            <span>Total: <strong className="text-slate-900 font-mono">{formatCurrency(filteredTotal)}</strong></span>
            <span>Recebido: <strong className="text-green-600 font-mono">{formatCurrency(filteredReceived)}</strong></span>
            <span>Previsto: <strong className="text-amber-600 font-mono">{formatCurrency(filteredPending)}</strong></span>
          </div>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              {hasActiveFilters ? 'Nenhuma receita encontrada com esses filtros' : 'Nenhuma receita neste mês'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters ? 'Tente limpar os filtros acima.' : 'Cadastre seu salário ou rendimentos.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={onOpenNewIncome}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
              >
                + Adicionar Receita
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredIncomes.map((inc) => {
                  const cat = categories.find(c => c.id === inc.categoryId);
                  const isReceived = inc.status === 'recebido';

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {formatDateBR(inc.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {inc.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat?.color || '#10B981'}20`, color: cat?.color || '#10B981' }}
                          >
                            <CategoryIcon name={cat?.icon || 'DollarSign'} className="w-3 h-3" />
                          </div>
                          <span className="text-slate-700 font-medium">{cat?.name || 'Receita'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-green-600 font-mono whitespace-nowrap">
                        {formatCurrency(inc.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inc.isRecurring ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            <Repeat className="w-2.5 h-2.5" />
                            Recorrente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                            Única
                          </span>
                        )}
                      </td>
                      
                      {/* Status + Caneta de edição inline ao lado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => markIncomeStatus(inc.id, isReceived ? 'previsto' : 'recebido')}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              isReceived
                                ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                            }`}
                            title="Clique para alternar entre Recebido e Previsto"
                          >
                            {isReceived ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {isReceived ? 'Recebido' : 'Previsto'}
                          </button>

                          {/* Caneta de Edição ao lado do status */}
                          <button
                            onClick={() => setEditingIncome(inc)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Editar esta receita"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingIncome(inc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Editar receita"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteIncome(inc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Excluir receita"
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

      {/* Modal de Edição de Receita */}
      {editingIncome && (
        <NewIncomeModal
          isOpen={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          incomeToEdit={editingIncome}
        />
      )}
    </div>
  );
};
