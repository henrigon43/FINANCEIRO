import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthlyComparisonChartProps {
  monthlyData: {
    monthName: string;
    year: number;
    month: number;
    total: number;
    isCurrent: boolean;
  }[];
  onSelectMonth?: (year: number, month: number) => void;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ 
  monthlyData,
  onSelectMonth
}) => {
  const maxVal = Math.max(...monthlyData.map(m => m.total), 1000);

  // Find percentage change compared to previous month
  const getTrend = (index: number) => {
    if (index === 0) return null;
    const prev = monthlyData[index - 1].total;
    const curr = monthlyData[index].total;
    if (prev === 0) return null;
    const diff = ((curr - prev) / prev) * 100;
    return diff;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Comparação Mensal</h3>
          <p className="text-xs text-slate-400">Histórico e evolução dos gastos</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Mês Selecionado
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />
            Outros
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-4 pb-2">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 border-b border-slate-100">
          {monthlyData.map((item, idx) => {
            const heightPercent = Math.max(8, Math.round((item.total / maxVal) * 100));
            const trend = getTrend(idx);

            return (
              <div 
                key={`${item.year}-${item.month}`} 
                onClick={() => onSelectMonth && onSelectMonth(item.year, item.month)}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Value tooltip above bar */}
                <div className="text-[10px] font-semibold text-slate-600 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatCurrency(item.total)}
                </div>

                {/* Trend pill if any */}
                {trend !== null && (
                  <div className="mb-1 text-[9px] flex items-center font-bold">
                    {trend > 0 ? (
                      <span className="text-rose-500 flex items-center">
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />+{trend.toFixed(0)}%
                      </span>
                    ) : trend < 0 ? (
                      <span className="text-green-600 flex items-center">
                        <TrendingDown className="w-2.5 h-2.5 mr-0.5" />{trend.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center">
                        <Minus className="w-2.5 h-2.5" />0%
                      </span>
                    )}
                  </div>
                )}

                {/* Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md overflow-hidden flex flex-col justify-end p-0.5">
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      item.isCurrent
                        ? 'bg-indigo-600 shadow-xs'
                        : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                  />
                </div>

                {/* Month label */}
                <div className="mt-2 text-center">
                  <span className={`block text-xs ${item.isCurrent ? 'font-bold text-indigo-700' : 'text-slate-600 font-medium'}`}>
                    {item.monthName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.total > 0 ? `R$ ${(item.total / 1000).toFixed(1)}k` : 'R$ 0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {monthlyData.slice(-4).map((m) => (
          <div key={`${m.year}-${m.month}`} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{m.monthName} {m.year}</span>
            <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(m.total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
