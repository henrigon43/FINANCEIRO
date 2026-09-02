import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, getDaysInMonth, MONTH_NAMES_BR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Calendar, ChevronLeft, ChevronRight, Check, AlertCircle, Clock } from 'lucide-react';
import { Expense } from '../types';

export const FinancialCalendar: React.FC = () => {
  const { 
    selectedYear, 
    selectedMonth, 
    goToNextMonth, 
    goToPrevMonth, 
    expenses, 
    categories, 
    markExpenseAsPaid 
  } = useFinance();

  const [selectedDay, setSelectedDay] = useState<number | null>(10);

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  // Get first day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

  // Map expenses by day of month
  const expensesByDay = React.useMemo(() => {
    const map = new Map<number, Expense[]>();
    expenses.forEach(exp => {
      const parts = exp.dueDate.split('-');
      if (Number(parts[0]) === selectedYear && Number(parts[1]) - 1 === selectedMonth) {
        const day = Number(parts[2]);
        const current = map.get(day) || [];
        map.set(day, [...current, exp]);
      }
    });
    return map;
  }, [expenses, selectedYear, selectedMonth]);

  const selectedDayExpenses = selectedDay ? (expensesByDay.get(selectedDay) || []) : [];
  const selectedDayTotal = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Calendário Financeiro
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize os dias exatos de saída de dinheiro no mês
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button onClick={goToPrevMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 px-2 min-w-[120px] text-center">
            {MONTH_NAMES_BR[selectedMonth]} {selectedYear}
          </span>
          <button onClick={goToNextMonth} className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-3">
            {weekDays.map(wd => (
              <div key={wd} className="py-1">{wd}</div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty padding cells for start of month */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-slate-50/50 rounded-lg border border-dashed border-slate-200/50" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysCount }).map((_, idx) => {
              const day = idx + 1;
              const dayExpenses = expensesByDay.get(day) || [];
              const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
              const isSelected = selectedDay === day;
              const hasPending = dayExpenses.some(e => e.status === 'pendente');
              const hasOverdue = dayExpenses.some(e => e.status === 'vencido');
              const hasPaid = dayExpenses.some(e => e.status === 'pago');

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 sm:h-24 p-2 rounded-lg border text-left flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                      : dayExpenses.length > 0
                      ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      : 'bg-white border-slate-100 hover:bg-slate-50/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      isSelected ? 'text-indigo-700' : 'text-slate-800'
                    }`}>
                      {day}
                    </span>
                    {dayExpenses.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 font-bold rounded-full">
                        {dayExpenses.length}
                      </span>
                    )}
                  </div>

                  {dayExpenses.length > 0 ? (
                    <div className="mt-auto">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">
                        {formatCurrency(dayTotal)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Vencida" />}
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Pendente" />}
                        {hasPaid && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Paga" />}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-300">Livre</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Detalhamento do Dia</span>
            <div className="flex items-center justify-between mt-1">
              <h3 className="font-bold text-slate-900 text-base">
                Dia {selectedDay ? String(selectedDay).padStart(2, '0') : '--'} de {MONTH_NAMES_BR[selectedMonth]}
              </h3>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(selectedDayTotal)}
              </span>
            </div>
          </div>

          <div className="flex-1 py-4 overflow-y-auto space-y-2.5">
            {selectedDayExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhum lançamento previsto para este dia.
              </div>
            ) : (
              selectedDayExpenses.map(exp => {
                const cat = categories.find(c => c.id === exp.categoryId);
                const isPaid = exp.status === 'pago';
                const isOverdue = exp.status === 'vencido';

                return (
                  <div 
                    key={exp.id}
                    className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/70 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isPaid ? 'bg-green-500' : isOverdue ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span className="font-bold text-xs text-slate-900">{exp.description}</span>
                      </div>
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{cat?.name || 'Outros'} • {exp.paymentMethod.toUpperCase()}</span>
                      {isPaid ? (
                        <span className="text-green-700 font-bold">✓ Pago</span>
                      ) : (
                        <button
                          onClick={() => markExpenseAsPaid(exp.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold transition-colors shadow-xs"
                        >
                          Pagar Agora
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
