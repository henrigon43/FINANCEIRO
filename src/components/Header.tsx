import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Bell, 
  Lock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Database,
  RefreshCw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MONTH_NAMES_BR, getMonthYearLabel } from '../utils/formatters';

interface HeaderProps {
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenMobileMenu?: () => void;
  onOpenNotificationModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNewExpense, 
  onOpenNewIncome, 
  onOpenNotificationModal,
}) => {
  const { 
    selectedYear, 
    selectedMonth, 
    setSelectedYear, 
    setSelectedMonth, 
    goToNextMonth, 
    goToPrevMonth, 
    goToCurrentMonth,
    alerts,
    settings,
    lockApp,
    syncStatus,
    lastSyncedAt,
    forceSync,
    isFirebaseConnected
  } = useFinance();

  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const handleForceSync = async () => {
    await forceSync();
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2500);
  };

  const currentPeriodLabel = getMonthYearLabel(selectedYear, selectedMonth);

  const handleMonthSelect = (mIndex: number) => {
    setSelectedMonth(mIndex);
    setShowMonthPicker(false);
  };

  const hasUrgentAlerts = alerts.some(a => a.type === 'danger' || a.type === 'warning');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      {/* Month Navigator */}
      <div className="flex items-center gap-2 sm:gap-4 text-slate-600">
        <button
          onClick={goToPrevMonth}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          title="Mês anterior"
        >
          <span className="text-xl leading-none font-semibold">&lsaquo;</span>
        </button>
        
        <div className="relative">
          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="flex items-center gap-1.5 px-2 py-1 text-sm sm:text-base font-bold text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
          >
            <span>{currentPeriodLabel}</span>
          </button>

          {/* Month Picker Dropdown */}
          {showMonthPicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMonthPicker(false)} 
              />
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <button 
                    onClick={() => setSelectedYear(selectedYear - 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-900">{selectedYear}</span>
                  <button 
                    onClick={() => setSelectedYear(selectedYear + 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {MONTH_NAMES_BR.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => handleMonthSelect(idx)}
                      className={`py-2 px-1.5 rounded-md font-medium transition-all text-center ${
                        idx === selectedMonth 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={() => {
                      goToCurrentMonth();
                      setShowMonthPicker(false);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1 px-2"
                  >
                    Ir para este mês
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          title="Próximo mês"
        >
          <span className="text-xl leading-none font-semibold">&rsaquo;</span>
        </button>

        {/* Quick preset button: Hoje/Este mês */}
        <button
          onClick={goToCurrentMonth}
          className="hidden lg:inline-flex px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors ml-1"
        >
          Este mês
        </button>
      </div>

      {/* Right Side: Saldo, Alerts, and CTA buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase Cloud Database Sync Badge */}
        <button
          onClick={handleForceSync}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all shadow-2xs ${
            justUpdated 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
          }`}
          title={`Banco de dados Firebase Firestore conectado. Sincronizado em tempo real entre celular e computador. Clique para sincronizar agora. ${lastSyncedAt ? `Última sincronização: ${lastSyncedAt.toLocaleTimeString('pt-BR')}` : ''}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            justUpdated ? 'bg-emerald-600' :
            syncStatus === 'synced' ? 'bg-emerald-500' :
            syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
          }`} />
          <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="hidden sm:inline">
            {justUpdated 
              ? 'Atualizado Agora!'
              : syncStatus === 'synced' 
                ? (isFirebaseConnected ? 'Firebase Conectado' : 'Banco Sincronizado') 
                : syncStatus === 'syncing' ? 'Sincronizando...' : 'Offline'}
          </span>
          <span className="sm:hidden text-[11px] font-semibold">
            {justUpdated ? 'Atualizado!' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 shrink-0 ${syncStatus === 'syncing' ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Saldo Badge */}
        <div className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
          (useFinance().projectedBalance) >= 0
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(useFinance().projectedBalance)}
        </div>

        {/* Notifications / Alerts */}
        <div className="relative">
          <button
            onClick={() => {
              if (onOpenNotificationModal) {
                onOpenNotificationModal();
              } else {
                setShowAlertsMenu(!showAlertsMenu);
              }
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Ver notificações e alertas de vencimento"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                hasUrgentAlerts ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
              }`} />
            )}
          </button>

          {showAlertsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAlertsMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    Alertas e Vencimentos
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium">
                    {alerts.length}
                  </span>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                      Tudo em dia! Nenhuma pendência urgente.
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                          alert.type === 'danger'
                            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                            : alert.type === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {alert.type === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                          {alert.type === 'warning' && <Clock className="w-4 h-4 text-amber-600" />}
                          {alert.type === 'info' && <CalendarIcon className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{alert.title}</p>
                          <p className="mt-0.5 opacity-90">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* PIN Lock button if security enabled */}
        {settings.pinEnabled && (
          <button
            onClick={lockApp}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Bloquear aplicativo (PIN)"
          >
            <Lock className="w-5 h-5" />
          </button>
        )}

        {/* + Nova Receita Button */}
        <button
          onClick={onOpenNewIncome}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <span>Receita</span>
        </button>

        {/* + Nova Despesa Button (Primary Clean Minimalism) */}
        <button
          onClick={onOpenNewExpense}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova despesa</span>
        </button>
      </div>
    </header>
  );
};
