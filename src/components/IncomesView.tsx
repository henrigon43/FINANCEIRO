import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { TrendingUp, Plus, CheckCircle, Clock, Trash2, Repeat } from 'lucide-react';

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
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
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

      {/* Incomes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {monthIncomes.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma receita neste mês</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre seu salário ou rendimentos.</p>
            <button
              onClick={onOpenNewIncome}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
            >
              + Adicionar Receita
            </button>
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
                {monthIncomes.map((inc) => {
                  const cat = categories.find(c => c.id === inc.categoryId);
                  const isReceived = inc.status === 'recebido';

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
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
                      <td className="py-3.5 px-4 font-bold text-green-600 font-mono">
                        {formatCurrency(inc.amount)}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => markIncomeStatus(inc.id, isReceived ? 'previsto' : 'recebido')}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            isReceived
                              ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                          }`}
                        >
                          {isReceived ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          {isReceived ? 'Recebido' : 'Previsto'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteIncome(inc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Excluir receita"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
