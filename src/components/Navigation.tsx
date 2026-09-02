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
  Wallet
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

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
  | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { totalOverdue, settings } = useFinance();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
  ];

  // Primary items for mobile bottom bar
  const mobilePrimaryTabs: NavTab[] = ['dashboard', 'expenses', 'calendar', 'cards'];

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 justify-between py-6 h-screen sticky top-0 shrink-0 select-none">
        {/* Brand Header */}
        <div className="px-6">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-lg leading-none">$</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">Finanz</h1>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile & Settings Footer */}
        <div className="px-6 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
              {(settings?.userName ? settings.userName.slice(0, 2).toUpperCase() : 'AM')}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{settings?.userName || 'Alex Mendes'}</p>
              <p className="text-xs text-slate-500">Plano Pessoal</p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-left ${
              currentTab === 'settings'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Configurações</span>
          </button>
        </div>
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

        {/* More button to open drawer */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
            !mobilePrimaryTabs.includes(currentTab) ? 'text-indigo-600 font-bold' : 'text-slate-500'
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
                  <span className="font-bold text-slate-900 text-sm">Finanz</span>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1 overflow-y-auto max-h-[65vh]">
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

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
              Finanz • Clean Minimalism
            </div>
          </div>
        </div>
      )}
    </>
  );
};
