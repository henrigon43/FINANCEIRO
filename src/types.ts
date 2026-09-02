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
