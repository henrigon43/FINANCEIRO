import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  Database,
  RefreshCw,
  Smartphone,
  Laptop
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { PWAInstallCard } from './PWAInstallCard';

export const SettingsView: React.FC = () => {
  const { 
    categories, 
    addCategory, 
    expenses, 
    incomes, 
    recurringExpenses, 
    creditCards, 
    goals,
    resetToSeedData,
    syncStatus,
    lastSyncedAt,
    forceSync,
    isFirebaseConnected
  } = useFinance();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [message, setMessage] = useState('');

  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      expenses,
      incomes,
      recurringExpenses,
      creditCards,
      goals,
      categories,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestor_financeiro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup JSON exportado com sucesso!');
    setTimeout(() => setMessage(''), 3500);
  };

  const handleExportCSV = () => {
    // Generate CSV for expenses
    const header = ['ID', 'Data Vencimento', 'Descricao', 'Valor', 'Categoria', 'Tipo', 'Forma Pagamento', 'Status'];
    const rows = expenses.map(e => {
      const cat = categories.find(c => c.id === e.categoryId)?.name || '';
      return [
        e.id,
        e.dueDate,
        `"${e.description.replace(/"/g, '""')}"`,
        e.amount.toFixed(2),
        `"${cat}"`,
        e.type,
        e.paymentMethod,
        e.status
      ].join(';');
    });

    const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despesas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Arquivo CSV (Excel) exportado com sucesso!');
    setTimeout(() => setMessage(''), 3500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
      type: newCatType,
    });

    setNewCatName('');
    setMessage('Categoria cadastrada com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Preferências e Segurança</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Configurações do Sistema
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie categorias personalizadas, backups de segurança e exportação de relatórios.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      {/* App Mobile & Icon Card */}
      <PWAInstallCard />

      {/* Firebase Cloud Firestore Multi-Device Sync Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Banco de Dados Firebase Firestore & Sincronização Multi-Dispositivo
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Nuvem Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Todas as receitas, despesas, parcelamentos e cartões são sincronizados em tempo real no Firebase Firestore. Qualquer mudança feita no celular, computador ou tablet é atualizada instantaneamente em todos os seus aparelhos.
            </p>
          </div>
          <button
            onClick={async () => {
              await forceSync();
              setMessage('Firebase Firestore sincronizado com sucesso!');
              setTimeout(() => setMessage(''), 3500);
            }}
            className="self-start sm:self-auto py-2 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              syncStatus === 'synced' ? 'bg-emerald-500 ring-4 ring-emerald-100' :
              syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse ring-4 ring-amber-100' : 'bg-rose-500'
            }`} />
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Status da Conexão</span>
              <span className="text-xs text-slate-600">
                {syncStatus === 'synced' 
                  ? (isFirebaseConnected ? 'Firebase Conectado (Nuvem)' : 'Conectado & Sincronizado') 
                  : syncStatus === 'syncing' ? 'Gravando alterações...' : 'Erro de conexão'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
              <Smartphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Acesso em Outros Aparelhos</span>
              <span className="text-xs text-slate-600">
                Celular, tablet e computador
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
              <Laptop className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Última Sincronização</span>
              <span className="text-xs text-slate-600">
                {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('pt-BR') : 'Em tempo real'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Export Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Backup e Exportação de Dados
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Seus dados ficam armazenados localmente com segurança. Você pode exportar backups a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Exportar Planilha CSV / Excel</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Compatível com Microsoft Excel, Google Planilhas e LibreOffice.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Baixar Despesas (.CSV)
            </button>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Backup Completo (JSON)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Salva todas as despesas, parcelas, contas fixas, cartões e metas em um arquivo seguro.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              Exportar Backup Completo
            </button>
          </div>
        </div>
      </div>

      {/* Category Manager Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Gerenciar Categorias</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize as categorias existentes ou adicione novas para adequar às suas necessidades.
          </p>
        </div>

        {/* Add new category inline */}
        <form onSubmit={handleAddCategory} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Nome da Categoria</label>
            <input
              type="text"
              placeholder="Ex: Investimentos, Cursos, Cerveja..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tipo</label>
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </form>

        {/* Existing categories list */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
          {categories.map(cat => (
            <div key={cat.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 truncate">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">{cat.name}</span>
              </div>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                cat.type === 'income' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {cat.type === 'income' ? 'Rec' : 'Desp'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-0.5">
            Restauração de Dados de Demonstração
          </span>
          <h4 className="text-sm font-bold text-slate-900">Restaurar dados padrão de exemplo</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Recarrega as despesas de teste (Aluguel, TV 12x, Internet fixa, etc) no mês de Agosto/Setembro 2026.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Deseja restaurar os dados de demonstração com contas e parcelas de teste?')) {
              resetToSeedData();
              setMessage('Dados restaurados para os exemplos iniciais com sucesso!');
              setTimeout(() => setMessage(''), 3000);
            }
          }}
          className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar Exemplos
        </button>
      </div>

    </div>
  );
};
