import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, MONTH_NAMES_BR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { PAYMENT_METHOD_LABELS } from '../data/defaultCategories';
import { 
  BarChart3, 
  PieChart, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Printer
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    selectedYear, 
    selectedMonth, 
    monthExpenses, 
    categories, 
    totalExpenses, 
    totalPaid, 
    totalPending, 
    totalOverdue,
    monthlyComparison 
  } = useFinance();

  const [activeReportTab, setActiveReportTab] = useState<'categoria' | 'forma' | 'status' | 'mensal'>('categoria');

  // Distribution by Payment Method
  const paymentMethodStats = React.useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach(e => {
      const current = map.get(e.paymentMethod) || 0;
      map.set(e.paymentMethod, current + e.amount);
    });

    return Array.from(map.entries()).map(([method, amount]) => {
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return {
        method,
        label: PAYMENT_METHOD_LABELS[method] || method,
        amount,
        percentage,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, totalExpenses]);

  // Distribution by Category
  const categoryStats = React.useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach(e => {
      const current = map.get(e.categoryId) || 0;
      map.set(e.categoryId, current + e.amount);
    });

    return Array.from(map.entries()).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return {
        catId,
        name: cat?.name || 'Outros',
        icon: cat?.icon || 'Package',
        color: cat?.color || '#3B82F6',
        amount,
        percentage,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, categories, totalExpenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Demonstrativos Analíticos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Relatórios Financeiros
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análises aprofundadas por categoria, meios de pagamento e comparação.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'categoria', label: 'Gastos por Categoria', icon: PieChart },
          { id: 'forma', label: 'Por Forma de Pagamento', icon: CreditCard },
          { id: 'status', label: 'Pagos vs Pendentes', icon: CheckCircle2 },
          { id: 'mensal', label: 'Evolução Mensal', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report 1: Categorias */}
      {activeReportTab === 'categoria' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Distribuição por Categoria</h3>
          <p className="text-xs text-slate-500">Quanto cada categoria representa do total de despesas ({formatCurrency(totalExpenses)}).</p>

          <div className="space-y-3.5 pt-2">
            {categoryStats.map(item => (
              <div key={item.catId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <div 
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
                    <span className="text-[11px] font-semibold text-slate-400 w-12 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report 2: Forma de Pagamento */}
      {activeReportTab === 'forma' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Gastos por Forma de Pagamento</h3>
          <p className="text-xs text-slate-500">Como você distribui o pagamento das suas contas.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {paymentMethodStats.map(pm => (
              <div key={pm.method} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 capitalize">{pm.label}</span>
                    <span className="text-xs font-mono font-bold text-slate-500">{pm.percentage.toFixed(0)}%</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-2">
                    {formatCurrency(pm.amount)}
                  </p>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${pm.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report 3: Pagos x Pendentes */}
      {activeReportTab === 'status' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Comparativo de Liquidação</h3>
            <p className="text-xs text-slate-500">Visão proporcional entre o que já foi pago e o que resta pagar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-green-50/40">
              <span className="text-xs font-bold text-green-700">Total Pago</span>
              <p className="text-2xl font-bold text-green-700 font-mono mt-1">{formatCurrency(totalPaid)}</p>
              <span className="text-[11px] text-green-600 font-medium">
                {totalExpenses > 0 ? ((totalPaid / totalExpenses) * 100).toFixed(1) : 0}% liquidado
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/40">
              <span className="text-xs font-bold text-amber-700">Total Pendente</span>
              <p className="text-2xl font-bold text-amber-700 font-mono mt-1">{formatCurrency(totalPending)}</p>
              <span className="text-[11px] text-amber-600 font-medium">
                {totalExpenses > 0 ? ((totalPending / totalExpenses) * 100).toFixed(1) : 0}% em aberto
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-rose-50/40">
              <span className="text-xs font-bold text-rose-700">Total Vencido</span>
              <p className="text-2xl font-bold text-rose-700 font-mono mt-1">{formatCurrency(totalOverdue)}</p>
              <span className="text-[11px] text-rose-600 font-medium">
                {totalExpenses > 0 ? ((totalOverdue / totalExpenses) * 100).toFixed(1) : 0}% em atraso
              </span>
            </div>
          </div>

          {/* Unified ratio bar */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">Composição Percentual</span>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
              <div 
                style={{ width: `${totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0}%` }}
                className="bg-green-600 h-full" 
                title="Pago"
              />
              <div 
                style={{ width: `${totalExpenses > 0 ? (totalPending / totalExpenses) * 100 : 0}%` }}
                className="bg-amber-500 h-full" 
                title="Pendente"
              />
              <div 
                style={{ width: `${totalExpenses > 0 ? (totalOverdue / totalExpenses) * 100 : 0}%` }}
                className="bg-rose-500 h-full" 
                title="Vencido"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Evolução Mensal */}
      {activeReportTab === 'mensal' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Evolução Mensal</h3>
          <p className="text-xs text-slate-500">Histórico e comparação entre os últimos meses.</p>

          <div className="divide-y divide-slate-100 pt-2">
            {monthlyComparison.map(m => (
              <div key={`${m.year}-${m.month}`} className="py-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{m.monthName} {m.year}</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
