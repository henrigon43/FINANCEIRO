import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, MONTH_NAMES_BR } from '../utils/formatters';
import { Sparkles, TrendingUp, Layers, Repeat, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForecastView: React.FC = () => {
  const { 
    selectedYear, 
    selectedMonth, 
    recurringExpenses, 
    expenses, 
    incomes 
  } = useFinance();

  // Project next 6 months starting from selected month + 1
  const forecastMonths = React.useMemo(() => {
    const months = [];

    for (let i = 1; i <= 6; i++) {
      let m = selectedMonth + i;
      let y = selectedYear;
      if (m > 11) {
        m = m % 12;
        y += Math.floor((selectedMonth + i) / 12);
      }

      // 1. Fixed / Recurring active
      const fixedTotal = recurringExpenses
        .filter(r => r.status === 'active')
        .filter(r => {
          if (!r.endDate) return true;
          const [endY, endM] = r.endDate.split('-').map(Number);
          return endY > y || (endY === y && endM >= m + 1);
        })
        .reduce((sum, r) => sum + r.amount, 0);

      // 2. Future installments in this month
      const installmentsInMonth = expenses.filter(e => {
        if (e.type !== 'parcelada') return false;
        const [expY, expM] = e.dueDate.split('-').map(Number);
        return expY === y && expM === m + 1;
      });
      const installmentsTotal = installmentsInMonth.reduce((sum, e) => sum + e.amount, 0);

      // 3. Other discrete scheduled expenses
      const otherExpenses = expenses.filter(e => {
        if (e.type === 'parcelada') return false;
        if (e.type === 'fixa') return false; // covered by recurring or generated
        const [expY, expM] = e.dueDate.split('-').map(Number);
        return expY === y && expM === m + 1;
      }).reduce((sum, e) => sum + e.amount, 0);

      const totalProjectedExpenses = fixedTotal + installmentsTotal + otherExpenses;

      // 4. Projected recurring incomes
      const projectedIncomes = incomes.filter(inc => {
        if (inc.isRecurring) return true;
        const [incY, incM] = inc.date.split('-').map(Number);
        return incY === y && incM === m + 1;
      }).reduce((sum, inc) => sum + inc.amount, 0);

      const netProjected = projectedIncomes - totalProjectedExpenses;

      months.push({
        monthName: MONTH_NAMES_BR[m],
        year: y,
        month: m,
        fixedTotal,
        installmentsTotal,
        otherExpenses,
        totalProjectedExpenses,
        projectedIncomes,
        netProjected,
        installmentsCount: installmentsInMonth.length,
      });
    }

    return months;
  }, [selectedYear, selectedMonth, recurringExpenses, expenses, incomes]);

  const maxExpense = Math.max(...forecastMonths.map(f => f.totalProjectedExpenses), 1000);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Planejamento Prospectivo</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Previsão de Gastos Futuros
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Cálculo inteligente dos próximos meses considerando despesas fixas, parcelamentos de compras e recorrências.
        </p>
      </div>

      {/* Projection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecastMonths.map((item, idx) => {
          const barPercent = Math.min(100, Math.round((item.totalProjectedExpenses / maxExpense) * 100));

          return (
            <div key={`${item.year}-${item.month}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      +{idx + 1} mês à frente
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {item.monthName} {item.year}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Previsto Sair</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {formatCurrency(item.totalProjectedExpenses)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>

                {/* Sub-breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-slate-400" />
                      Despesas Fixas
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(item.fixedTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      Parcelas Futuras ({item.installmentsCount}x)
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(item.installmentsTotal)}</span>
                  </div>

                  {item.otherExpenses > 0 && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500">Outros Lançamentos</span>
                      <span className="font-bold text-slate-800">{formatCurrency(item.otherExpenses)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Net Cash flow */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">Receitas Previstas</span>
                  <span className="font-bold text-green-600">{formatCurrency(item.projectedIncomes)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saldo Projetado</span>
                  <span className={`font-bold ${item.netProjected >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {formatCurrency(item.netProjected)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Health Note */}
      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-950">
        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
        <span>
          <strong>Dica de Planejamento:</strong> Conforme novas parcelas forem quitadas, as despesas diminuem gradualmente nos meses subsequentes, permitindo maior sobra de caixa para metas e investimentos.
        </span>
      </div>
    </div>
  );
};
