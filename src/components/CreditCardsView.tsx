import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  Check, 
  X,
  AlertCircle 
} from 'lucide-react';

export const CreditCardsView: React.FC = () => {
  const { 
    creditCards, 
    addCreditCard, 
    updateCreditCard, 
    deleteCreditCard, 
    monthExpenses, 
    selectedYear, 
    selectedMonth 
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(20);
  const [dueDay, setDueDay] = useState(27);
  const [color, setColor] = useState('#820AD1');
  const [last4, setLast4] = useState('');

  const handleOpenAdd = () => {
    setEditingCardId(null);
    setName('');
    setBank('');
    setLimit('');
    setClosingDay(20);
    setDueDay(27);
    setColor('#820AD1');
    setLast4('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CreditCard) => {
    setEditingCardId(c.id);
    setName(c.name);
    setBank(c.bank);
    setLimit(c.limit.toString());
    setClosingDay(c.closingDay);
    setDueDay(c.dueDay);
    setColor(c.color);
    setLast4(c.last4Digits || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit.replace(',', '.'));
    if (!name.trim() || isNaN(numLimit) || numLimit <= 0) return;

    if (editingCardId) {
      updateCreditCard(editingCardId, {
        name: name.trim(),
        bank: bank.trim(),
        limit: numLimit,
        closingDay,
        dueDay,
        color,
        last4Digits: last4.trim(),
      });
    } else {
      addCreditCard({
        name: name.trim(),
        bank: bank.trim(),
        limit: numLimit,
        closingDay,
        dueDay,
        color,
        last4Digits: last4.trim(),
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CardIcon className="w-4 h-4" />
            <span>Faturas e Limites</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cartões de Crédito
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie limites, faturas por fechamento e vencimento de compras parceladas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          + Cadastrar Cartão
        </button>
      </div>

      {/* Credit Cards Visual Display */}
      {creditCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
          <CardIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhum cartão cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Cadastre seus cartões para controlar as faturas e compras parceladas.</p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Cadastrar primeiro cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creditCards.map(card => {
            // Find current month's expenses on this card
            const cardExpenses = monthExpenses.filter(e => e.cardId === card.id);
            const currentBillTotal = cardExpenses.reduce((sum, e) => sum + e.amount, 0);
            const availableLimit = Math.max(0, card.limit - currentBillTotal);
            const usagePercent = Math.min(100, (currentBillTotal / card.limit) * 100);

            return (
              <div key={card.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  {/* Virtual Card Graphic */}
                  <div 
                    className="w-full h-44 rounded-xl p-5 text-white flex flex-col justify-between shadow-xs relative overflow-hidden mb-5 transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: card.color || '#3730A3' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wider uppercase opacity-90">{card.bank || 'Banco'}</span>
                      <CardIcon className="w-6 h-6 opacity-80" />
                    </div>

                    <div className="my-auto">
                      <p className="font-mono text-base sm:text-lg tracking-widest font-semibold">
                        •••• •••• •••• {card.last4Digits || '0000'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block opacity-70">Titular / Nome</span>
                        <span className="font-bold tracking-wide">{card.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider block opacity-70">Vencimento</span>
                        <span className="font-bold font-mono">Dia {String(card.dueDay).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Metrics */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Fatura Atual (deste mês):</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {formatCurrency(currentBillTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Limite Total:</span>
                      <span className="font-bold text-slate-700 font-mono">{formatCurrency(card.limit)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Limite Disponível Estimado:</span>
                      <span className="font-bold text-green-600 font-mono">{formatCurrency(availableLimit)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${usagePercent}%`, 
                            backgroundColor: usagePercent > 85 ? '#EF4444' : (card.color || '#4F46E5') 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{usagePercent.toFixed(0)}% utilizado</span>
                        <span>Fecha dia {card.closingDay} • Vence dia {card.dueDay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchases in current bill */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                      Lançamentos nesta fatura ({cardExpenses.length})
                    </span>
                    {cardExpenses.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhum gasto neste mês neste cartão.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {cardExpenses.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                            <span className="text-slate-700 truncate max-w-[180px]">{item.description}</span>
                            <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(card)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCreditCard(card.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Card */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden z-10 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCardId ? 'Editar Cartão' : 'Cadastrar Novo Cartão'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Cartão (Apelido)</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Inter..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banco / Emissor</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú..."
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Limite Total (R$)</label>
                  <input
                    type="text"
                    placeholder="5.000,00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dia de Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={closingDay}
                    onChange={(e) => setClosingDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cor do Cartão</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                </div>
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
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
