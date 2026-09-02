import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Expense, ExpenseType, PaymentMethod, ExpenseStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { 
  X, 
  Plus, 
  Calendar, 
  CreditCard, 
  Repeat, 
  Layers, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { toDateString, formatCurrency } from '../utils/formatters';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ 
  isOpen, 
  onClose,
  expenseToEdit
}) => {
  const { categories, creditCards, addExpense, updateExpense } = useFinance();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(toDateString(new Date()));
  const [dueDate, setDueDate] = useState(toDateString(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardId, setCardId] = useState('');
  const [type, setType] = useState<ExpenseType>('unica');
  const [status, setStatus] = useState<ExpenseStatus>('pendente');
  const [paymentDate, setPaymentDate] = useState(toDateString(new Date()));
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [dueDay, setDueDay] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Populate default category or edit data
  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setCategoryId(expenseToEdit.categoryId);
      setPurchaseDate(expenseToEdit.purchaseDate);
      setDueDate(expenseToEdit.dueDate);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setCardId(expenseToEdit.cardId || '');
      setType(expenseToEdit.type);
      setStatus(expenseToEdit.status);
      setPaymentDate(expenseToEdit.paymentDate || toDateString(new Date()));
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setAmount('');
      const defaultCat = categories.find(c => c.type === 'expense' || c.type === 'both');
      if (defaultCat) setCategoryId(defaultCat.id);
      const today = toDateString(new Date());
      setPurchaseDate(today);
      setDueDate(today);
      setPaymentMethod('pix');
      setCardId(creditCards[0]?.id || '');
      setType('unica');
      setStatus('pendente');
      setPaymentDate(today);
      setInstallmentsCount(12);
      setDueDay(10);
      setNotes('');
      setError('');
    }
  }, [expenseToEdit, isOpen, categories, creditCards]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (!description.trim()) {
      setError('Por favor, informe a descrição da despesa.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        description: description.trim(),
        amount: numAmount,
        categoryId,
        purchaseDate,
        dueDate,
        paymentMethod,
        cardId: paymentMethod === 'credito' ? cardId : undefined,
        type,
        status,
        paymentDate: status === 'pago' ? paymentDate : null,
        notes: notes.trim(),
      });
    } else {
      addExpense({
        description: description.trim(),
        amount: numAmount,
        categoryId,
        purchaseDate,
        dueDate,
        paymentMethod,
        cardId: paymentMethod === 'credito' ? cardId : undefined,
        type,
        status,
        notes: notes.trim(),
        installmentsCount: type === 'parcelada' ? installmentsCount : undefined,
        dueDay: type === 'fixa' ? dueDay : undefined,
      });
    }

    onClose();
  };

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const installmentCalculated = installmentsCount > 0 ? (parsedAmount / installmentsCount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">
              {expenseToEdit ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
            </h3>
            <p className="text-xs text-slate-400">
              {expenseToEdit ? 'Atualize as informações do lançamento' : 'Controle inteligente de despesas com automação'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 6. Tipo de Despesa Selector */}
          {!expenseToEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Despesa
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('unica')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    type === 'unica' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Única</span>
                  <span className={`text-[10px] ${type === 'unica' ? 'text-slate-300' : 'text-slate-400'}`}>1x só</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('parcelada')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    type === 'parcelada' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Parcelada</span>
                  <span className={`text-[10px] ${type === 'parcelada' ? 'text-indigo-200' : 'text-slate-400'}`}>Ex: TV 12x</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('fixa')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    type === 'fixa' 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Fixa / Recorrente</span>
                  <span className={`text-[10px] ${type === 'fixa' ? 'text-indigo-200' : 'text-slate-400'}`}>Todo mês</span>
                </button>
              </div>
            </div>
          )}

          {/* Descrição & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Mercado, Aluguel, TV..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'parcelada' ? 'Valor Total da Compra (R$)' : 'Valor (R$)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
                required
              />
            </div>
          </div>

          {/* Conditional: Parcelas Config if Parcelada */}
          {type === 'parcelada' && !expenseToEdit && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Divisão de Parcelas
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {installmentsCount}x de {formatCurrency(installmentCalculated)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="2"
                  max="48"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {installmentsCount} parcelas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                O sistema gerará automaticamente todas as {installmentsCount} parcelas distribuídas mês a mês a partir do primeiro vencimento.
              </p>
            </div>
          )}

          {/* Conditional: Dia de Vencimento if Fixa */}
          {type === 'fixa' && !expenseToEdit && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                Dia do Vencimento Todo Mês
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-bold text-slate-900 text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                />
                <span className="text-xs text-slate-600">
                  Todo dia {dueDay} de cada mês será lançado automaticamente.
                </span>
              </div>
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Categoria <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg">
              {categories
                .filter(c => c.type === 'expense' || c.type === 'both')
                .map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all text-left truncate ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-semibold' 
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

          {/* Datas: Data da Compra & Data de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'parcelada' ? 'Vencimento da 1ª Parcela' : 'Data de Vencimento'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                required
              />
            </div>
          </div>

          {/* 8. Forma de Pagamento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs">
              {(['pix', 'credito', 'debito', 'boleto', 'dinheiro', 'transferencia', 'outros'] as PaymentMethod[]).map(pm => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg border capitalize font-medium transition-all ${
                    paymentMethod === pm
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>

            {/* If Cartão de Crédito selected, show card selector */}
            {paymentMethod === 'credito' && creditCards.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  Selecione o Cartão:
                </span>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-hidden"
                >
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Fecha dia {c.closingDay})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 9. Status da Despesa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Status Inicial
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="pendente"
                  checked={status === 'pendente'}
                  onChange={() => setStatus('pendente')}
                  className="accent-amber-600"
                />
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pendente
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="pago"
                  checked={status === 'pago'}
                  onChange={() => setStatus('pago')}
                  className="accent-green-600"
                />
                <span className="flex items-center gap-1 text-green-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Pago
                </span>
              </label>

              {expenseToEdit && (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    value="vencido"
                    checked={status === 'vencido'}
                    onChange={() => setStatus('vencido')}
                    className="accent-rose-600"
                  />
                  <span className="flex items-center gap-1 text-rose-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Vencido
                  </span>
                </label>
              )}
            </div>

            {status === 'pago' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Pago em:</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pago com cupom, divisão com amigos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 outline-hidden"
            />
          </div>

          {/* Submit Buttons */}
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
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {expenseToEdit ? 'Salvar Alterações' : 'Cadastrar Despesa'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
