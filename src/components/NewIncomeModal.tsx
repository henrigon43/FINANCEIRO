import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { X, Check, TrendingUp, AlertCircle, Repeat } from 'lucide-react';
import { toDateString } from '../utils/formatters';

interface NewIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIncomeModal: React.FC<NewIncomeModalProps> = ({ isOpen, onClose }) => {
  const { categories, addIncome } = useFinance();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(toDateString(new Date()));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(5);
  const [status, setStatus] = useState<'recebido' | 'previsto'>('previsto');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      const defaultCat = categories.find(c => c.type === 'income' || c.type === 'both');
      if (defaultCat) setCategoryId(defaultCat.id);
      setDate(toDateString(new Date()));
      setIsRecurring(false);
      setRecurringDay(5);
      setStatus('previsto');
      setNotes('');
      setError('');
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!description.trim()) {
      setError('Informe a descrição da receita.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    addIncome({
      description: description.trim(),
      amount: numAmount,
      categoryId,
      date,
      isRecurring,
      recurringDay: isRecurring ? recurringDay : undefined,
      status,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Cadastrar Nova Receita
            </h3>
            <p className="text-xs text-slate-400">
              Adicione salários, freelances e rendimentos ao saldo
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição da Receita <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Salário, Freelance, Rendimentos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor (R$) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="3.500,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-200 rounded-lg">
              {categories
                .filter(c => c.type === 'income' || c.type === 'both')
                .map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all text-left truncate ${
                        isSelected 
                          ? 'bg-indigo-600 text-white font-semibold' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 shrink-0" color={isSelected ? '#FFF' : cat.color} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data do Recebimento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              >
                <option value="previsto">Previsto</option>
                <option value="recebido">Recebido na Conta</option>
              </select>
            </div>
          </div>

          {/* Recorrência (ex: Salário todo dia 5) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded-sm accent-indigo-600 w-4 h-4"
                />
                <span>Receita Recorrente Mensal</span>
              </label>
            </div>

            {isRecurring && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
                <span className="text-xs text-slate-600">Repete todo dia:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                />
                <span className="text-xs text-slate-600">de cada mês</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Cadastrar Receita
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
