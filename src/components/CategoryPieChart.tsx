import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Check, X, ArrowUpRight } from 'lucide-react';

interface CategoryPieChartProps {
  categoryTotals: {
    category: Category;
    total: number;
    percentage: number;
    count: number;
  }[];
  monthExpenses: Expense[];
  onMarkAsPaid?: (id: string) => void;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ 
  categoryTotals, 
  monthExpenses,
  onMarkAsPaid
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categoryTotals.length > 0 ? categoryTotals[0].category.id : null
  );

  const totalSum = categoryTotals.reduce((acc, c) => acc + c.total, 0);

  // Find currently selected category
  const activeItem = categoryTotals.find(c => c.category.id === selectedCategoryId) || categoryTotals[0];
  const activeCategoryExpenses = activeItem 
    ? monthExpenses.filter(e => e.categoryId === activeItem.category.id)
    : [];

  // SVG Donut calculation
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  return (
    <div className="flex-1 flex flex-col justify-center">
      {categoryTotals.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Nenhuma despesa registrada neste mês.
        </div>
      ) : (
        <>
          {/* Donut Chart with Center Percentage and Active Category */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg 
              viewBox={`0 0 ${size} ${size}`} 
              className="w-full h-full transform -rotate-90"
            >
              {/* Background track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />
              
              {/* Slices */}
              {categoryTotals.map((item) => {
                const sliceFraction = item.total / (totalSum || 1);
                const strokeDasharray = `${sliceFraction * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeAngle * circumference;
                cumulativeAngle += sliceFraction;
                const isSelected = item.category.id === (activeItem?.category.id || '');

                return (
                  <circle
                    key={item.category.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.category.color || '#4F46E5'}
                    strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer hover:opacity-85"
                    onClick={() => setSelectedCategoryId(item.category.id)}
                  />
                );
              })}
            </svg>

            {/* Center Content: % and Category Name */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-2xl font-black text-slate-900 leading-tight">
                {activeItem ? `${activeItem.percentage.toFixed(0)}%` : '0%'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[110px]">
                {activeItem ? activeItem.category.name : 'Geral'}
              </span>
            </div>
          </div>

          {/* Clean Minimalism Category List */}
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {categoryTotals.map((item) => {
              const isSelected = item.category.id === (activeItem?.category.id || '');
              return (
                <button
                  key={item.category.id}
                  onClick={() => setSelectedCategoryId(item.category.id)}
                  className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-md transition-colors ${
                    isSelected ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: item.category.color || '#4F46E5' }} 
                    />
                    <span className={`truncate ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-600'}`}>
                      {item.category.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0 ml-2">
                    {formatCurrency(item.total)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Drill-Down Detail Box for Selected Category */}
          {activeItem && activeCategoryExpenses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Despesas em {activeItem.category.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeCategoryExpenses.length} item(ns)
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {activeCategoryExpenses.map(exp => (
                  <div key={exp.id} className="py-2 flex items-center justify-between text-xs hover:bg-slate-50/50">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{exp.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateBR(exp.dueDate)} • {exp.type.toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900">{formatCurrency(exp.amount)}</span>
                      {exp.status !== 'pago' && onMarkAsPaid && (
                        <button
                          onClick={() => onMarkAsPaid(exp.id)}
                          className="px-2 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-[10px] font-bold transition-colors"
                          title="Marcar como pago"
                        >
                          Pagar
                        </button>
                      )}
                      {exp.status === 'pago' && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          Pago
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
