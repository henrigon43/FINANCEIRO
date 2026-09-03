export type PaymentMethod = 
  | 'pix' 
  | 'dinheiro' 
  | 'debito' 
  | 'credito' 
  | 'boleto' 
  | 'transferencia' 
  | 'outros';

export type ExpenseType = 'unica' | 'parcelada' | 'fixa';

export type ExpenseStatus = 'pago' | 'pendente' | 'vencido';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  purchaseDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  cardId?: string;
  type: ExpenseType;
  status: ExpenseStatus;
  paymentDate?: string | null; // YYYY-MM-DD
  // Parcelas
  installmentGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  // Recorrência
  recurringId?: string;
  // Contratos
  contractId?: string;
  notes?: string;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  dueDay: number; // 1-31
  paymentMethod: PaymentMethod;
  cardId?: string;
  status: 'active' | 'paused';
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  recurringDay?: number;
  status: 'recebido' | 'previsto';
  notes?: string;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number; // Dia de fechamento
  dueDay: number; // Dia de vencimento
  color: string;
  last4Digits?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  deadline?: string;
  category?: string;
  color: string;
}

export type Goal = FinancialGoal;

export interface UserSettings {
  userName: string;
  currency: string;
  pinEnabled: boolean;
  pinCode?: string;
  notificationsEnabled: boolean;
  alertDaysAhead: number;
}

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string; // login em minúsculas
  name: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  lastLogin?: string;
}

export type ContractType = 
  | 'veiculo_assinatura' 
  | 'financiamento_imovel' 
  | 'financiamento_veiculo' 
  | 'emprestimo' 
  | 'consorcio' 
  | 'aluguel' 
  | 'outros';

export interface FinancialContract {
  id: string;
  title: string; // Ex: Assinatura Carro Localiza, Financiamento Apartamento Caixa
  type: ContractType;
  financialInstitution: string; // Banco ou empresa (ex: Caixa, Santander, Localiza Meoo, Itaú)
  contractNumber?: string;
  totalMonths: number; // Quantidade de meses totais
  paidMonths: number; // Quantidade de meses já pagos
  monthlyPayment: number; // Valor da parcela mensal
  totalAmount: number; // Valor total contratado
  downPayment?: number; // Valor de entrada
  outstandingBalance: number; // Saldo devedor atual
  dueDay: number; // Dia de vencimento no mês (1-31)
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  cardId?: string;
  status: 'ativo' | 'quitado' | 'cancelado';
  notes?: string;
  autoSyncExpense?: boolean; // Se lança automaticamente nas despesas do mês
  createdAt: string;
}

