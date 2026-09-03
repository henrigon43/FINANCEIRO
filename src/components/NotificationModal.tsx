import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewExpenses?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ 
  isOpen, 
  onClose,
  onViewExpenses 
}) => {
  const { 
    alerts, 
    totalOverdue, 
    totalPending, 
    upcomingBills7Days, 
    markExpenseAsPaid 
  } = useFinance();

  if (!isOpen) return null;

  const overdueCount = alerts.filter(a => a.type === 'danger').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                <span>Notificações Financeiras</span>
                {alerts.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-400 text-slate-950">
                    {alerts.length} {alerts.length === 1 ? 'aviso' : 'avisos'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Resumo de contas vencidas e próximos vencimentos
              </p>
            </div>
          </div>

          {/* Botão Fechar (X) */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar Notificações"
            title="Fechar Notificações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${overdueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-slate-600 font-medium">Vencidas:</span>
            <span className={`font-bold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {overdueCount} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOverdue)})
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 font-medium">A Vencer (7d):</span>
            <span className="font-bold text-amber-600">
              {upcomingBills7Days.length}
            </span>
          </div>
        </div>

        {/* Body Alerts List */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-900 text-sm">Tudo em dia!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Você não possui nenhuma conta vencida ou pendência urgente no momento.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start justify-between gap-3 transition-all ${
                    isDanger
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isDanger && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      {isWarning && <Clock className="w-4 h-4 text-amber-600" />}
                      {!isDanger && !isWarning && <CalendarIcon className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{alert.title}</p>
                      <p className="text-slate-600 mt-0.5 text-[11px] leading-snug">{alert.message}</p>
                    </div>
                  </div>

                  {alert.date && (
                    <span className="text-[10px] font-semibold text-slate-500 shrink-0 self-start mt-0.5 px-2 py-0.5 bg-white rounded-md border border-slate-200/60 shadow-2xs">
                      {alert.date}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {onViewExpenses && alerts.length > 0 ? (
            <button
              onClick={() => {
                onClose();
                onViewExpenses();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>Ver lista completa de despesas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              Notificações ativas em tempo real
            </div>
          )}

          {/* Botão de Fechar Principal */}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
          >
            Fechar Notificações
          </button>
        </div>
      </div>
    </div>
  );
};
