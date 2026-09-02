import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringExpense, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { 
  Repeat, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Calendar, 
  Clock 
} from 'lucide-react';

export const RecurringExpenses: React.FC = () => {
  const { 
    recurringExpenses, 
    categories, 
    addRecurringExpense, 
    updateRecurringExpense, 
    toggleRecurringStatus, 
    deleteRecurringExpense 
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDay, setDueDay] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debito');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    const defaultCat = categories.find(c => c.type === 'expense' || c.type === 'both');
    setCategoryId(defaultCat?.id || '');
    setDueDay(10);
    setPaymentMethod('debito');
    setEndDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringExpense) => {
    setEditingId(rec.id);
    setDescription(rec.description);
    setAmount(rec.amount.toString());
    setCategoryId(rec.categoryId);
    setDueDay(rec.dueDay);
    setPaymentMethod(rec.paymentMethod);
    setEndDate(rec.endDate || '');
    setNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return;

    if (editingId) {
      updateRecurringExpense(editingId, {
        description: description.trim(),
        amount: numAmount,
        categoryId,
        dueDay,
        paymentMethod,
        endDate: endDate ? endDate : null,
        notes: notes.trim(),
      });
    } else {
      addRecurringExpense({
        description: description.trim(),
        amount: numAmount,
        categoryId,
        dueDay,
        paymentMethod,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate : null,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const totalMonthlyRecurring = recurringExpenses
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Repeat className="w-4 h-4" />
            <span>Assinaturas e Contas Fixas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Despesas Recorrentes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre uma vez e o sistema projeta e lança automaticamente todos os meses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-medium">Impacto Fixo Mensal</span>
            <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(totalMonthlyRecurring)}</span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Nova Despesa Fixa
          </button>
        </div>
      </div>

      {/* Recorrentes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {recurringExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Repeat className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma despesa fixa cadastrada</p>
            <p className="text-xs text-slate-400 mt-1">Ex: Aluguel, Internet, Netflix, Academia...</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Adicionar primeira fixa
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Valor Mensal</th>
                  <th className="py-3 px-4">Dia do Vencimento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recurringExpenses.map(rec => {
                  const cat = categories.find(c => c.id === rec.categoryId);
                  const isActive = rec.status === 'active';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span>{rec.description}</span>
                        {rec.notes && (
                          <p className="text-[10px] text-slate-400 font-normal italic mt-0.5">{rec.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {formatCurrency(rec.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        Dia {String(rec.dueDay).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cat?.color || '#3B82F6'}20`, color: cat?.color || '#3B82F6' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Package'} className="w-3 h-3" />
                          </div>
                          <span className="text-slate-700 font-medium">{cat?.name || 'Geral'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-500">
                        {rec.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Ativa' : 'Pausada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Pause / Resume */}
                          <button
                            onClick={() => toggleRecurringStatus(rec.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title={isActive ? 'Pausar recorrência' : 'Reativar recorrência'}
                          >
                            {isActive ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-green-600" />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteRecurringExpense(rec.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Excluir despesa fixa"
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

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden z-10 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingId ? 'Editar Despesa Recorrente' : 'Cadastrar Despesa Fixa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel, Internet..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Mensal (R$)</label>
                  <input
                    type="text"
                    placeholder="120,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                >
                  {categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white capitalize focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  >
                    {(['debito', 'pix', 'boleto', 'credito', 'dinheiro', 'transferencia'] as PaymentMethod[]).map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Final (Opcional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Contrato de 12 meses..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Fixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
