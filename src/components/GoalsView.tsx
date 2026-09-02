import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Goal } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#10B981');

  // Quick Deposit modal
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositValue, setDepositValue] = useState('');

  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setColor('#10B981');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoalId(g.id);
    setTitle(g.title);
    setTargetAmount(g.targetAmount.toString());
    setCurrentAmount(g.currentAmount.toString());
    setDeadline(g.deadline || '');
    setColor(g.color || '#10B981');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount.replace(',', '.'));
    const numCurrent = parseFloat(currentAmount.replace(',', '.')) || 0;
    if (!title.trim() || isNaN(numTarget) || numTarget <= 0) return;

    if (editingGoalId) {
      updateGoal(editingGoalId, {
        title: title.trim(),
        targetAmount: numTarget,
        currentAmount: numCurrent,
        targetDate: deadline || new Date().toISOString().split('T')[0],
        deadline: deadline || undefined,
        color,
      });
    } else {
      addGoal({
        title: title.trim(),
        targetAmount: numTarget,
        currentAmount: numCurrent,
        targetDate: deadline || new Date().toISOString().split('T')[0],
        deadline: deadline || undefined,
        color,
      });
    }

    setIsModalOpen(false);
  };

  const handleApplyDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const value = parseFloat(depositValue.replace(',', '.'));
    if (isNaN(value) || value <= 0) return;

    updateGoal(depositGoal.id, {
      currentAmount: depositGoal.currentAmount + value,
    });

    setDepositGoal(null);
    setDepositValue('');
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Sonhos e Reservas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Metas Financeiras
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o progresso de economia para viagens, reservas de emergência ou grandes conquistas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          + Nova Meta
        </button>
      </div>

      {/* Global Progress Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Patrimônio Acumulado em Metas
            </span>
            <p className="text-3xl font-black tracking-tight font-mono text-slate-900">
              {formatCurrency(totalSaved)}
            </p>
            <span className="text-xs text-slate-400 mt-1 block">
              De um objetivo combinado de {formatCurrency(totalTarget)} ({overallProgress.toFixed(0)}% concluído)
            </span>
          </div>

          <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-700">
              <span>Progresso Geral</span>
              <span className="font-bold text-indigo-600">{overallProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all" 
                style={{ width: `${Math.min(100, overallProgress)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
          <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhuma meta cadastrada</p>
          <p className="text-xs text-slate-400 mt-1">Ex: Reserva de emergência, Viagem de férias, Troca de carro...</p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Cadastrar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div key={goal.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{goal.title}</h3>
                      {goal.deadline && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Prazo: {formatDateBR(goal.deadline)}
                        </span>
                      )}
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-bold font-mono"
                      style={{ backgroundColor: `${goal.color || '#4F46E5'}15`, color: goal.color || '#4F46E5' }}
                    >
                      {percent}%
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 font-mono text-base">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-slate-400 font-medium">de {formatCurrency(goal.targetAmount)}</span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: goal.color || '#4F46E5' }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2">
                      Falta guardar <strong>{formatCurrency(remaining)}</strong> para atingir a meta.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setDepositGoal(goal);
                      setDepositValue('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Adicionar Valor
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden z-10 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingGoalId ? 'Editar Meta' : 'Nova Meta Financeira'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título da Meta</label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Alvo (R$)</label>
                  <input
                    type="text"
                    placeholder="10.000,00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Já Guardado (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-green-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prazo Estimado (Opcional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cor</label>
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
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDepositGoal(null)} />
          <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-slate-900 text-base text-center">
              Adicionar valor à meta
            </h4>
            <p className="text-xs text-slate-500 text-center mt-0.5">{depositGoal.title}</p>

            <form onSubmit={handleApplyDeposit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quanto deseja guardar agora? (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 250,00"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-green-600 text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Confirmar Depósito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
