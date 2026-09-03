import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  TrendingUp, 
  CalendarDays, 
  CreditCard, 
  Repeat, 
  Sparkles, 
  BarChart3, 
  Target, 
  Settings, 
  Menu, 
  X,
  Wallet,
  Users,
  LogOut,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

export type NavTab = 
  | 'dashboard' 
  | 'expenses' 
  | 'incomes' 
  | 'calendar' 
  | 'cards' 
  | 'recurring' 
  | 'forecast' 
  | 'reports' 
  | 'goals' 
  | 'settings'
  | 'users';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { totalOverdue, settings } = useFinance();
  const { currentUser, isMasterAdmin, activeViewingUser, stopImpersonation, logout } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('finance_sidebar_collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('finance_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Despesas', icon: ReceiptText, badge: totalOverdue > 0 },
    { id: 'incomes', label: 'Receitas', icon: TrendingUp },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'cards', label: 'Cartões', icon: CreditCard },
    { id: 'recurring', label: 'Recorrentes', icon: Repeat },
    { id: 'forecast', label: 'Previsão', icon: Sparkles },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'users', label: isMasterAdmin ? 'Usuários' : 'Meu Usuário', icon: Users },
  ];

  // Primary items for mobile bottom bar
  const mobilePrimaryTabs: NavTab[] = ['dashboard', 'expenses', 'calendar', 'cards'];

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <aside 
        className={`hidden md:flex flex-col ${
          isCollapsed ? 'w-20 px-3' : 'w-64 px-6'
        } bg-white border-r border-slate-200 justify-between py-6 h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ease-in-out`}
      >
        {/* Top Header & Brand */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs shrink-0">
                  <span className="text-white font-bold text-lg leading-none">$</span>
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">Finanz</h1>
                  <span className="text-[10px] text-slate-600 font-medium tracking-wide uppercase">Multi-Usuário</span>
                </div>
              </div>

              {/* 3 Tracinhos para diminuir/recolher menu */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Diminuir menu da esquerda (Recolher)"
                aria-label="Diminuir menu lateral"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 mb-6">
              {/* 3 Tracinhos para expandir menu quando diminuído */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shadow-2xs border border-slate-100 hover:border-indigo-200"
                title="Expandir menu da esquerda"
                aria-label="Expandir menu lateral"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div 
                className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                onClick={toggleCollapsed}
                title="Finanz - Clique para expandir"
              >
                <span className="text-white font-bold text-lg leading-none">$</span>
              </div>
            </div>
          )}

          {/* Active Impersonation Alert Banner in Sidebar */}
          {activeViewingUser && (
            <div className={`mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg ${isCollapsed ? 'text-center' : ''}`}>
              {!isCollapsed ? (
                <>
                  <p className="text-[11px] font-semibold text-amber-900 leading-tight">
                    Vendo: {activeViewingUser.name}
                  </p>
                  <p className="text-[10px] text-amber-700 mb-2">Planilha isolada deste usuário</p>
                  <button
                    onClick={stopImpersonation}
                    className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-semibold text-amber-800 bg-amber-200/70 hover:bg-amber-200 rounded-md transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar p/ Master
                  </button>
                </>
              ) : (
                <button
                  onClick={stopImpersonation}
                  title={`Voltar da planilha de ${activeViewingUser.name} para Master`}
                  className="p-1 text-amber-800 hover:text-amber-950"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-lg font-medium text-sm transition-colors text-left relative group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {item.badge && (
                    <span className={
                      isCollapsed
                        ? 'absolute top-1.5 right-2 w-2 h-2 rounded-full bg-rose-500'
                        : 'w-2 h-2 rounded-full bg-rose-500'
                    } />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile & Settings Footer */}
        {!isCollapsed ? (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5 truncate">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentUser?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    {currentUser?.role === 'admin' ? (
                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Master
                      </span>
                    ) : (
                      <span>@{currentUser?.username}</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sair da conta"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onSelectTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-left ${
                currentTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configurações</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-4 flex flex-col items-center gap-2">
            <div 
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                currentUser?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}
              title={`${currentUser?.name} (${currentUser?.role === 'admin' ? 'Master' : 'Usuário'})`}
            >
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
            </div>

            <button
              onClick={() => onSelectTab('settings')}
              title="Configurações"
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                currentTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-5 h-5 text-slate-400 hover:text-slate-600" />
            </button>

            <button
              onClick={logout}
              title="Sair"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-xs">
        {mobilePrimaryTabs.map(tabId => {
          const item = navItems.find(i => i.id === tabId)!;
          const Icon = item.icon;
          const isActive = currentTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => onSelectTab(tabId)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}

        {/* Users quick access on mobile */}
        <button
          onClick={() => onSelectTab('users')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            currentTab === 'users' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${currentTab === 'users' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span>Usuários</span>
        </button>

        {/* More button to open drawer */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            !mobilePrimaryTabs.includes(currentTab) && currentTab !== 'users' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
          <span>Mais</span>
        </button>
      </nav>

      {/* Mobile Drawer (Menu Completo) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileDrawerOpen(false)} 
          />
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-xl p-5 flex flex-col z-50 justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    $
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block leading-tight">Finanz</span>
                    <span className="text-[10px] text-slate-500">Logado: {currentUser?.name}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeViewingUser && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-900">Vendo: {activeViewingUser.name}</p>
                  <button
                    onClick={() => {
                      stopImpersonation();
                      setIsMobileDrawerOpen(false);
                    }}
                    className="mt-2 w-full py-1 text-xs font-semibold text-amber-900 bg-amber-200 rounded-md"
                  >
                    Voltar p/ Master
                  </button>
                </div>
              )}

              <div className="py-4 space-y-1 overflow-y-auto max-h-[60vh]">
                {[...navItems, { id: 'settings' as NavTab, label: 'Configurações', icon: Settings }].map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                onClick={() => {
                  logout();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
              <div className="text-[11px] text-slate-400 text-center">
                Finanz • Clean Minimalism
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
