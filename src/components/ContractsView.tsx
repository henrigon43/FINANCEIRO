import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { FinancialContract, ContractType, PaymentMethod } from '../types';
import { formatCurrency, formatDateBR, toDateString, parseDateSafe } from '../utils/formatters';
import { 
  FileSignature, 
  Plus, 
  Building2, 
  Car, 
  Home, 
  Landmark, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Check, 
  ArrowRight,
  TrendingDown,
  Layers,
  Banknote,
  Search,
  X,
  FileText
} from 'lucide-react';

const CONTRACT_TYPE_LABELS: Record<ContractType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  veiculo_assinatura: { label: 'Assinatura de Veículo', icon: Car, color: '#3B82F6' },
  financiamento_imovel: { label: 'Financiamento de Imóvel', icon: Home, color: '#10B981' },
  financiamento_veiculo: { label: 'Financiamento Veicular', icon: Car, color: '#6366F1' },
  emprestimo: { label: 'Empréstimo', icon: Landmark, color: '#F59E0B' },
  consorcio: { label: 'Consórcio', icon: Layers, color: '#8B5CF6' },
  aluguel: { label: 'Aluguel / Locação', icon: Building2, color: '#EC4899' },
  outros: { label: 'Outro Contrato', icon: FileText, color: '#64748B' },
};

export const ContractsView: React.FC = () => {
  const { 
    contracts, 
    creditCards, 
    addContract, 
    updateContract, 
    deleteContract, 
    payContractInstallment 
  } = useFinance();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'quitado'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<FinancialContract | null>(null);

  // Pay Confirmation Dialog
  const [confirmPayContract, setConfirmPayContract] = useState<FinancialContract | null>(null);
  const [deleteDialogContract, setDeleteDialogContract] = useState<FinancialContract | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContractType>('financiamento_imovel');
  const [financialInstitution, setFinancialInstitution] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [totalMonths, setTotalMonths] = useState<string>('360');
  const [paidMonths, setPaidMonths] = useState<string>('0');
  const [monthlyPayment, setMonthlyPayment] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [outstandingBalance, setOutstandingBalance] = useState<string>('');
  const [dueDay, setDueDay] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>(toDateString(new Date()));
  const [nextDueDate, setNextDueDate] = useState<string>(toDateString(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [cardId, setCardId] = useState<string>('');
  const [status, setStatus] = useState<'ativo' | 'quitado' | 'cancelado'>('ativo');
  const [notes, setNotes] = useState('');
  const [autoSyncExpense, setAutoSyncExpense] = useState(true);
  const [formError, setFormError] = useState('');

  // Open Modal for New Contract
  const handleOpenNew = () => {
    setEditingContract(null);
    setTitle('');
    setType('financiamento_imovel');
    setFinancialInstitution('');
    setContractNumber('');
    setTotalMonths('360');
    setPaidMonths('0');
    setMonthlyPayment('');
    setTotalAmount('');
    setDownPayment('');
    setOutstandingBalance('');
    setDueDay(10);
    setStartDate(toDateString(new Date()));
    setNextDueDate(toDateString(new Date()));
    setPaymentMethod('boleto');
    setCardId(creditCards[0]?.id || '');
    setStatus('ativo');
    setNotes('');
    setAutoSyncExpense(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (contract: FinancialContract) => {
    setEditingContract(contract);
    setTitle(contract.title);
    setType(contract.type);
    setFinancialInstitution(contract.financialInstitution);
    setContractNumber(contract.contractNumber || '');
    setTotalMonths(contract.totalMonths.toString());
    setPaidMonths(contract.paidMonths.toString());
    setMonthlyPayment(contract.monthlyPayment.toString());
    setTotalAmount(contract.totalAmount ? contract.totalAmount.toString() : '');
    setDownPayment(contract.downPayment ? contract.downPayment.toString() : '');
    setOutstandingBalance(contract.outstandingBalance.toString());
    setDueDay(contract.dueDay || 10);
    setStartDate(contract.startDate);
    setNextDueDate(contract.nextDueDate);
    setPaymentMethod(contract.paymentMethod);
    setCardId(contract.cardId || (creditCards[0]?.id || ''));
    setStatus(contract.status);
    setNotes(contract.notes || '');
    setAutoSyncExpense(contract.autoSyncExpense !== false);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Informe o título do contrato (ex: Financiamento Apartamento, Assinatura Compass).');
      return;
    }
    if (!financialInstitution.trim()) {
      setFormError('Informe a instituição financeira ou banco financiador (ex: Caixa, Santander, Localiza).');
      return;
    }

    const tMonths = parseInt(totalMonths, 10);
    const pMonths = parseInt(paidMonths, 10);
    const mPayment = parseFloat(monthlyPayment.replace(',', '.'));
    const oBalance = parseFloat(outstandingBalance.replace(',', '.'));
    const tAmount = totalAmount ? parseFloat(totalAmount.replace(',', '.')) : mPayment * tMonths;
    const dPayment = downPayment ? parseFloat(downPayment.replace(',', '.')) : 0;

    if (isNaN(tMonths) || tMonths <= 0) {
      setFormError('Quantidade de meses total deve ser maior que 0.');
      return;
    }
    if (isNaN(pMonths) || pMonths < 0) {
      setFormError('Quantidade de meses pagos inválida.');
      return;
    }
    if (isNaN(mPayment) || mPayment <= 0) {
      setFormError('Valor da parcela mensal deve ser maior que zero.');
      return;
    }
    if (isNaN(oBalance) || oBalance < 0) {
      setFormError('Saldo devedor deve ser maior ou igual a zero.');
      return;
    }

    const contractData: Omit<FinancialContract, 'id' | 'createdAt'> = {
      title: title.trim(),
      type,
      financialInstitution: financialInstitution.trim(),
      contractNumber: contractNumber.trim() || undefined,
      totalMonths: tMonths,
      paidMonths: pMonths,
      monthlyPayment: mPayment,
      totalAmount: tAmount,
      downPayment: dPayment,
      outstandingBalance: oBalance,
      dueDay,
      startDate,
      nextDueDate,
      paymentMethod,
      cardId: paymentMethod === 'credito' ? cardId : undefined,
      status: pMonths >= tMonths ? 'quitado' : status,
      notes: notes.trim() || undefined,
      autoSyncExpense,
    };

    if (editingContract) {
      updateContract(editingContract.id, contractData);
    } else {
      addContract(contractData);
    }

    setIsModalOpen(false);
  };

  // Filtered list
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(term);
        const matchBank = c.financialInstitution.toLowerCase().includes(term);
        const matchNum = (c.contractNumber || '').toLowerCase().includes(term);
        if (!matchTitle && !matchBank && !matchNum) return false;
      }
      // Type
      if (typeFilter !== 'todos' && c.type !== typeFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'todos' && c.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [contracts, searchTerm, typeFilter, statusFilter]);

  // Aggregate Metrics
  const activeContracts = contracts.filter(c => c.status === 'ativo');
  const totalOutstanding = activeContracts.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const totalMonthlyCommitment = activeContracts.reduce((acc, c) => acc + c.monthlyPayment, 0);
  const totalPaidCount = contracts.reduce((acc, c) => acc + c.paidMonths, 0);
  const totalMonthsCount = contracts.reduce((acc, c) => acc + c.totalMonths, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSignature className="w-4 h-4" />
            <span>Gestão de Contratos e Financiamentos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Contratos, Assinaturas & Financiamentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe assinaturas de carros, financiamentos imobiliários, parcelas restantes, saldo devedor e integração direta com despesas.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Novo Contrato
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contratos Ativos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Contratos Ativos</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {activeContracts.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {contracts.length} cadastrado(s) no total
          </span>
        </div>

        {/* Saldo Devedor Consolidado */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Devedor Total</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-mono">
            {formatCurrency(totalOutstanding)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Consolidado de todos os financiamentos
          </span>
        </div>

        {/* Próximas Faturas do Mês */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faturas Mensais</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatCurrency(totalMonthlyCommitment)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Comprometimento mensal das parcelas
          </span>
        </div>

        {/* Progresso Geral de Quitação */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Progresso Geral</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
            {totalMonthsCount > 0 ? Math.round((totalPaidCount / totalMonthsCount) * 100) : 0}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalPaidCount} de {totalMonthsCount} parcelas pagas
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, banco financiado ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium outline-hidden"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="veiculo_assinatura">Assinatura de Veículo</option>
            <option value="financiamento_imovel">Financiamento de Imóvel</option>
            <option value="financiamento_veiculo">Financiamento Veicular</option>
            <option value="emprestimo">Empréstimos</option>
            <option value="consorcio">Consórcios</option>
            <option value="aluguel">Aluguel</option>
            <option value="outros">Outros</option>
          </select>

          {/* Filter by Status */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs shrink-0">
            {(['todos', 'ativo', 'quitado'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'todos' ? 'Todos' : st === 'ativo' ? 'Ativos' : 'Quitados'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contracts List / Cards */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-xs">
          <FileSignature className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Nenhum contrato encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cadastre suas assinaturas de carros, financiamentos de imóveis ou parcelamentos de longo prazo para acompanhar o saldo devedor e parcelas restantes.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Contrato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredContracts.map((contract) => {
            const typeInfo = CONTRACT_TYPE_LABELS[contract.type] || CONTRACT_TYPE_LABELS.outros;
            const TypeIcon = typeInfo.icon;
            const remainingMonths = Math.max(0, contract.totalMonths - contract.paidMonths);
            const progressPercent = Math.min(100, Math.round((contract.paidMonths / contract.totalMonths) * 100));
            const isFinished = contract.status === 'quitado' || contract.paidMonths >= contract.totalMonths;
            const cardLinked = creditCards.find(c => c.id === contract.cardId);

            return (
              <div 
                key={contract.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                          >
                            {typeInfo.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isFinished 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : contract.status === 'cancelado'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {isFinished ? 'Quitado' : contract.status === 'cancelado' ? 'Cancelado' : 'Ativo'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1 leading-snug">
                          {contract.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Banco / Empresa: <strong>{contract.financialInstitution}</strong></span>
                          {contract.contractNumber && (
                            <span className="text-slate-400 font-mono text-[11px]">• Nº {contract.contractNumber}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Quick Edit/Delete buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(contract)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Editar Contrato"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDialogContract(contract)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Excluir Contrato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body - Values & Installments */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Values Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Próxima Fatura</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        {isFinished ? 'Quitado' : formatDateBR(contract.nextDueDate)}
                      </p>
                      <span className="text-[10px] text-slate-500">Dia {contract.dueDay} de cada mês</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Valor da Parcela</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                        {formatCurrency(contract.monthlyPayment)}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase">{contract.paymentMethod}</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase text-rose-500 block">Saldo Devedor</span>
                      <p className="text-sm font-bold text-rose-600 mt-0.5 font-mono">
                        {formatCurrency(contract.outstandingBalance)}
                      </p>
                      <span className="text-[10px] text-slate-500">Atualizado</span>
                    </div>
                  </div>

                  {/* Payment Method Badge & Card Details */}
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2 py-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-[11px] font-medium text-slate-400">Pagamento:</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[11px] uppercase">
                        {contract.paymentMethod}
                      </span>
                      {contract.paymentMethod === 'credito' && cardLinked && (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                          <CreditCard className="w-3 h-3" />
                          {cardLinked.name}
                        </span>
                      )}
                    </div>

                    {contract.autoSyncExpense && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Integrado às Despesas
                      </span>
                    )}
                  </div>

                  {/* Progress Bar & Months Count */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {contract.paidMonths} de {contract.totalMonths} meses pagos
                      </span>
                      <span className="font-mono font-bold text-indigo-600">
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isFinished ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Início: {formatDateBR(contract.startDate)}</span>
                      <span className="font-semibold text-slate-700">
                        {isFinished ? 'Nenhuma parcela restante' : `Faltam ${remainingMonths} parcela(s)`}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Observações */}
                  {contract.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{contract.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {!isFinished ? (
                      <span>Próxima parcela: <strong>{formatDateBR(contract.nextDueDate)}</strong></span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Contrato 100% Quitado
                      </span>
                    )}
                  </div>

                  {!isFinished && (
                    <button
                      onClick={() => setConfirmPayContract(contract)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Dar Baixa / Pagar Parcela
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog: Pagar Parcela */}
      {confirmPayContract && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Confirmar Pagamento de Parcela
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Deseja registrar o pagamento da parcela nº <strong>{confirmPayContract.paidMonths + 1} de {confirmPayContract.totalMonths}</strong> do contrato:
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
                <p><strong>Contrato:</strong> {confirmPayContract.title}</p>
                <p><strong>Banco/Financiadora:</strong> {confirmPayContract.financialInstitution}</p>
                <p><strong>Valor:</strong> <span className="font-bold text-slate-900 font-mono">{formatCurrency(confirmPayContract.monthlyPayment)}</span></p>
                <p><strong>Vencimento:</strong> {formatDateBR(confirmPayContract.nextDueDate)}</p>
              </div>
              <p className="text-[11px] text-indigo-600 font-medium mt-2">
                ✓ O saldo devedor será reduzido e esta parcela será lançada como despesa paga na aba "Despesas".
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPayContract(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  payContractInstallment(confirmPayContract.id);
                  setConfirmPayContract(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Excluir Contrato */}
      {deleteDialogContract && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Excluir Contrato?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tem certeza que deseja remover o contrato "<strong>{deleteDialogContract.title}</strong>"?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialogContract(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteContract(deleteDialogContract.id);
                  setDeleteDialogContract(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileSignature className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingContract ? 'Editar Contrato / Financiamento' : 'Novo Contrato / Financiamento'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo de Contrato */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Contrato *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(t => {
                    const info = CONTRACT_TYPE_LABELS[t];
                    const Icon = info.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          type === t 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título & Banco Financiador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título do Contrato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Assinatura Compass, Financiamento Apto"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banco Financiador / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Caixa Econômica, Santander, Localiza Meoo"
                    value={financialInstitution}
                    onChange={(e) => setFinancialInstitution(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Nº do Contrato */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número do Contrato (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 8472.0194.5510 ou MEOO-2025-99"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Meses: Total vs Pagos */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade de Meses Fez (Total) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ex: 360 (imóvel), 36 (carro)"
                    value={totalMonths}
                    onChange={(e) => setTotalMonths(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold font-mono outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Meses totais contratados</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meses Já Pagos *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 48"
                    value={paidMonths}
                    onChange={(e) => setPaidMonths(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold font-mono outline-hidden"
                  />
                  <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
                    Faltam {Math.max(0, (parseInt(totalMonths, 10) || 0) - (parseInt(paidMonths, 10) || 0))} parcelas
                  </span>
                </div>
              </div>

              {/* Parcela Mensal & Saldo Devedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor da Parcela Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 2650.00"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-mono outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saldo Devedor Atual (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ex: 298400.00"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-rose-600 font-bold font-mono outline-hidden focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Valor Total & Entrada (Opcionais) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Total Contratado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 380000.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor de Entrada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 80000.00"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-hidden"
                  />
                </div>
              </div>

              {/* Datas: Vencimento e Próxima Fatura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia de Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 10)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Próxima Fatura *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono outline-hidden"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['boleto', 'debito', 'credito', 'pix'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm);
                        if (pm === 'credito' && !cardId && creditCards.length > 0) {
                          setCardId(creditCards[0].id);
                        }
                      }}
                      className={`py-2 px-2 rounded-lg border uppercase text-xs font-semibold transition-all ${
                        paymentMethod === pm
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>

                {/* Selecionar Cartão se for Crédito */}
                {paymentMethod === 'credito' && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Cartão Cadastrado:
                    </span>
                    {creditCards.length > 0 ? (
                      <select
                        value={cardId}
                        onChange={(e) => setCardId(e.target.value)}
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden"
                      >
                        {creditCards.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.bank})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">
                        Nenhum cartão cadastrado. Adicione um na aba Cartões.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status do Contrato */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ativo"
                      checked={status === 'ativo'}
                      onChange={() => setStatus('ativo')}
                      className="accent-indigo-600"
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="quitado"
                      checked={status === 'quitado'}
                      onChange={() => setStatus('quitado')}
                      className="accent-emerald-600"
                    />
                    <span>Quitado</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="cancelado"
                      checked={status === 'cancelado'}
                      onChange={() => setStatus('cancelado')}
                      className="accent-slate-600"
                    />
                    <span>Cancelado</span>
                  </label>
                </div>
              </div>

              {/* Auto Sync com Despesas */}
              <label className="flex items-center gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncExpense}
                  onChange={(e) => setAutoSyncExpense(e.target.checked)}
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-indigo-950">
                  Lançar automaticamente na lista de Despesas ao dar baixa na parcela
                </span>
              </label>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações e Detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Franquia de 1.500 km/mês, taxa de juros SAC, seguro embutido..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-hidden focus:bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {editingContract ? 'Salvar Alterações' : 'Cadastrar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
