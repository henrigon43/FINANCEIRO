import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Expense, 
  RecurringExpense, 
  Income, 
  CreditCard, 
  FinancialGoal, 
  Category, 
  UserSettings,
  ExpenseStatus,
  ExpenseType,
  PaymentMethod
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { 
  SEED_EXPENSES, 
  SEED_RECURRING, 
  SEED_INCOMES, 
  SEED_CREDIT_CARDS, 
  SEED_GOALS 
} from '../data/seedData';
import { 
  isSameMonthYear, 
  parseDateSafe, 
  toDateString, 
  getDaysDifference 
} from '../utils/formatters';

interface FinanceContextType {
  // Navigation / Active period
  selectedYear: number;
  selectedMonth: number; // 0-11
  setSelectedYear: (y: number) => void;
  setSelectedMonth: (m: number) => void;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToCurrentMonth: () => void;

  // Data
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  incomes: Income[];
  creditCards: CreditCard[];
  goals: FinancialGoal[];
  categories: Category[];
  settings: UserSettings;

  // App lock state
  isLocked: boolean;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;

  // Expense Actions
  addExpense: (expenseData: {
    description: string;
    amount: number;
    categoryId: string;
    purchaseDate: string;
    dueDate: string;
    paymentMethod: PaymentMethod;
    cardId?: string;
    type: ExpenseType;
    status?: ExpenseStatus;
    notes?: string;
    // Parcelas
    installmentsCount?: number;
    // Fixa
    dueDay?: number;
  }) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  markExpenseAsPaid: (id: string, paymentDate?: string) => void;
  markExpenseAsPending: (id: string) => void;
  deleteExpense: (id: string, deleteAllInstallments?: boolean) => void;

  // Recurring Actions
  addRecurringExpense: (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  updateRecurringExpense: (id: string, data: Partial<RecurringExpense>) => void;
  toggleRecurringStatus: (id: string) => void;
  deleteRecurringExpense: (id: string) => void;

  // Income Actions
  addIncome: (incomeData: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, data: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  markIncomeStatus: (id: string, status: 'recebido' | 'previsto') => void;

  // Credit Card Actions
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;

  // Goals Actions
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Summaries & Derived Stats
  monthExpenses: Expense[];
  monthIncomes: Income[];
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalIncome: number;
  monthBalance: number;
  projectedBalance: number;
  upcomingBills7Days: Expense[];
  categoryTotals: { category: Category; total: number; percentage: number; count: number }[];
  monthlyComparison: { monthName: string; year: number; month: number; total: number; isCurrent: boolean }[];
  alerts: { id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; date?: string }[];

  // Backup & Restore
  exportToJSON: () => void;
  exportToCSV: () => void;
  importFromJSON: (jsonData: string) => boolean;
  resetAllData: () => void;
  loadDemoData: () => void;
}

const STORAGE_KEY = 'finance_manager_state_v1';

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize to August 2026 (Month index 7) to showcase the rich prompt data immediately
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Agosto (0-indexed)

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_expenses`);
      return stored ? JSON.parse(stored) : SEED_EXPENSES;
    } catch {
      return SEED_EXPENSES;
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_recurring`);
      return stored ? JSON.parse(stored) : SEED_RECURRING;
    } catch {
      return SEED_RECURRING;
    }
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_incomes`);
      return stored ? JSON.parse(stored) : SEED_INCOMES;
    } catch {
      return SEED_INCOMES;
    }
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_cards`);
      return stored ? JSON.parse(stored) : SEED_CREDIT_CARDS;
    } catch {
      return SEED_CREDIT_CARDS;
    }
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_goals`);
      return stored ? JSON.parse(stored) : SEED_GOALS;
    } catch {
      return SEED_GOALS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_categories`);
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return stored ? JSON.parse(stored) : {
        userName: 'Usuário',
        currency: 'BRL',
        pinEnabled: false,
        pinCode: '1234',
        notificationsEnabled: true,
        alertDaysAhead: 7,
      };
    } catch {
      return {
        userName: 'Usuário',
        currency: 'BRL',
        pinEnabled: false,
        pinCode: '1234',
        notificationsEnabled: true,
        alertDaysAhead: 7,
      };
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return settings.pinEnabled;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_recurring`, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_incomes`, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cards`, JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  // Navigation handlers
  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  // Add Expense with intelligent auto-expansion for installments and recurring
  const addExpense = (data: {
    description: string;
    amount: number;
    categoryId: string;
    purchaseDate: string;
    dueDate: string;
    paymentMethod: PaymentMethod;
    cardId?: string;
    type: ExpenseType;
    status?: ExpenseStatus;
    notes?: string;
    installmentsCount?: number;
    dueDay?: number;
  }) => {
    const nowIso = new Date().toISOString();
    const baseStatus = data.status || 'pendente';

    if (data.type === 'parcelada') {
      const count = Math.max(2, data.installmentsCount || 2);
      const installmentAmount = Math.round((data.amount / count) * 100) / 100;
      const groupId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const newExpenses: Expense[] = [];
      const baseDueDate = parseDateSafe(data.dueDate);

      for (let i = 1; i <= count; i++) {
        // Increment month for each subsequent installment
        const d = new Date(baseDueDate.getFullYear(), baseDueDate.getMonth() + (i - 1), baseDueDate.getDate());
        const dueDateStr = toDateString(d);

        // Calculate status: if past due, mark overdue
        const isOverdue = getDaysDifference(dueDateStr) < 0 && (i === 1 && baseStatus === 'pago' ? false : true);
        const itemStatus: ExpenseStatus = (i === 1 && baseStatus === 'pago') ? 'pago' : (isOverdue ? 'vencido' : 'pendente');

        newExpenses.push({
          id: `exp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          description: `${data.description} (${i}/${count})`,
          amount: installmentAmount,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
          dueDate: dueDateStr,
          paymentMethod: data.paymentMethod,
          cardId: data.cardId,
          type: 'parcelada',
          status: itemStatus,
          paymentDate: itemStatus === 'pago' ? data.purchaseDate : null,
          installmentGroupId: groupId,
          installmentNumber: i,
          totalInstallments: count,
          notes: data.notes,
          createdAt: nowIso,
        });
      }

      setExpenses(prev => [...prev, ...newExpenses]);
    } else if (data.type === 'fixa') {
      // Create recurring definition
      const dueDay = data.dueDay || parseDateSafe(data.dueDate).getDate();
      const recId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const newRecurring: RecurringExpense = {
        id: recId,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        dueDay,
        paymentMethod: data.paymentMethod,
        cardId: data.cardId,
        status: 'active',
        startDate: data.purchaseDate,
        notes: data.notes,
        createdAt: nowIso,
      };

      // Also create immediate expense for the current / chosen month and subsequent 11 months
      const createdExpenses: Expense[] = [];
      const baseDate = parseDateSafe(data.dueDate);

      for (let m = 0; m < 12; m++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, Math.min(dueDay, 28));
        const dueDateStr = toDateString(d);
        const isCurrentFirst = m === 0 && baseStatus === 'pago';
        const isOverdue = getDaysDifference(dueDateStr) < 0 && !isCurrentFirst;

        createdExpenses.push({
          id: `exp-rec-${Date.now()}-${m}-${Math.random().toString(36).substring(2, 5)}`,
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId,
          purchaseDate: data.purchaseDate,
          dueDate: dueDateStr,
          paymentMethod: data.paymentMethod,
          cardId: data.cardId,
          type: 'fixa',
          status: isCurrentFirst ? 'pago' : (isOverdue ? 'vencido' : 'pendente'),
          paymentDate: isCurrentFirst ? data.purchaseDate : null,
          recurringId: recId,
          notes: data.notes,
          createdAt: nowIso,
        });
      }

      setRecurringExpenses(prev => [...prev, newRecurring]);
      setExpenses(prev => [...prev, ...createdExpenses]);
    } else {
      // Única
      const isOverdue = getDaysDifference(data.dueDate) < 0 && baseStatus !== 'pago';
      const finalStatus: ExpenseStatus = baseStatus === 'pago' ? 'pago' : (isOverdue ? 'vencido' : 'pendente');

      const newExpense: Expense = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        purchaseDate: data.purchaseDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        cardId: data.cardId,
        type: 'unica',
        status: finalStatus,
        paymentDate: finalStatus === 'pago' ? (data.purchaseDate || toDateString(new Date())) : null,
        notes: data.notes,
        createdAt: nowIso,
      };

      setExpenses(prev => [...prev, newExpense]);
    }
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updated };
      }
      return item;
    }));
  };

  const markExpenseAsPaid = (id: string, paymentDate?: string) => {
    const todayStr = paymentDate || toDateString(new Date());
    setExpenses(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'pago',
          paymentDate: todayStr,
        };
      }
      return item;
    }));
  };

  const markExpenseAsPending = (id: string) => {
    setExpenses(prev => prev.map(item => {
      if (item.id === id) {
        const isOverdue = getDaysDifference(item.dueDate) < 0;
        return {
          ...item,
          status: isOverdue ? 'vencido' : 'pendente',
          paymentDate: null,
        };
      }
      return item;
    }));
  };

  const deleteExpense = (id: string, deleteAllInstallments: boolean = false) => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    if (deleteAllInstallments && target.installmentGroupId) {
      setExpenses(prev => prev.filter(e => e.installmentGroupId !== target.installmentGroupId));
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Recurring Management
  const addRecurringExpense = (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const id = `rec-${Date.now()}`;
    const newRec: RecurringExpense = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    setRecurringExpenses(prev => [...prev, newRec]);

    // Create expenses for the next 12 months
    const today = new Date();
    const created: Expense[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(today.getFullYear(), today.getMonth() + m, Math.min(data.dueDay, 28));
      created.push({
        id: `exp-${id}-${m}`,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        purchaseDate: toDateString(today),
        dueDate: toDateString(d),
        paymentMethod: data.paymentMethod,
        cardId: data.cardId,
        type: 'fixa',
        status: 'pendente',
        recurringId: id,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      });
    }
    setExpenses(prev => [...prev, ...created]);
  };

  const updateRecurringExpense = (id: string, data: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    // Also update future pending expenses
    if (data.amount !== undefined || data.description !== undefined || data.categoryId !== undefined) {
      setExpenses(prev => prev.map(item => {
        if (item.recurringId === id && item.status !== 'pago') {
          return {
            ...item,
            ...(data.description ? { description: data.description } : {}),
            ...(data.amount !== undefined ? { amount: data.amount } : {}),
            ...(data.categoryId ? { categoryId: data.categoryId } : {}),
          };
        }
        return item;
      }));
    }
  };

  const toggleRecurringStatus = (id: string) => {
    setRecurringExpenses(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'active' ? 'paused' : 'active';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
    // Remove future pending expenses linked to this recurring
    setExpenses(prev => prev.filter(e => !(e.recurringId === id && e.status !== 'pago')));
  };

  // Income Handlers
  const addIncome = (incomeData: Omit<Income, 'id' | 'createdAt'>) => {
    const id = `inc-${Date.now()}`;
    const newInc: Income = {
      ...incomeData,
      id,
      createdAt: new Date().toISOString(),
    };
    setIncomes(prev => [...prev, newInc]);

    // If recurring income, also generate for next months
    if (incomeData.isRecurring && incomeData.recurringDay) {
      const baseDate = parseDateSafe(incomeData.date);
      const generated: Income[] = [];
      for (let m = 1; m < 12; m++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + m, Math.min(incomeData.recurringDay, 28));
        generated.push({
          ...incomeData,
          id: `inc-${id}-${m}`,
          date: toDateString(d),
          status: 'previsto',
          createdAt: new Date().toISOString(),
        });
      }
      setIncomes(prev => [...prev, ...generated]);
    }
  };

  const updateIncome = (id: string, data: Partial<Income>) => {
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, ...data } : inc));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== id));
  };

  const markIncomeStatus = (id: string, status: 'recebido' | 'previsto') => {
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
  };

  // Credit Card Handlers
  const addCreditCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: `card-${Date.now()}`,
    };
    setCreditCards(prev => [...prev, newCard]);
  };

  const updateCreditCard = (id: string, data: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  // Goals
  const addGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, data: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Categories
  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // PIN / Security
  const unlockApp = (pin: string): boolean => {
    if (!settings.pinEnabled || pin === settings.pinCode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (settings.pinEnabled) {
      setIsLocked(true);
    }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // -------------------------------------------------------------
  // Derived Statistics for Selected Month
  // -------------------------------------------------------------
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => isSameMonthYear(e.dueDate, selectedYear, selectedMonth));
  }, [expenses, selectedYear, selectedMonth]);

  const monthIncomes = useMemo(() => {
    return incomes.filter(i => isSameMonthYear(i.date, selectedYear, selectedMonth));
  }, [incomes, selectedYear, selectedMonth]);

  const totalExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalPaid = useMemo(() => {
    return monthExpenses
      .filter(e => e.status === 'pago')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalPending = useMemo(() => {
    return monthExpenses
      .filter(e => e.status === 'pendente')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalOverdue = useMemo(() => {
    return monthExpenses
      .filter(e => e.status === 'vencido' || (e.status !== 'pago' && getDaysDifference(e.dueDate) < 0))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const totalIncome = useMemo(() => {
    return monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  }, [monthIncomes]);

  const monthBalance = useMemo(() => {
    return totalIncome - totalPaid;
  }, [totalIncome, totalPaid]);

  const projectedBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  // Upcoming bills in next 7 days
  const upcomingBills7Days = useMemo(() => {
    return expenses
      .filter(e => e.status !== 'pago')
      .filter(e => {
        const diff = getDaysDifference(e.dueDate);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [expenses]);

  // Category totals & percentages for current month
  const categoryTotals = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    monthExpenses.forEach(e => {
      const current = map.get(e.categoryId) || { total: 0, count: 0 };
      map.set(e.categoryId, {
        total: current.total + e.amount,
        count: current.count + 1,
      });
    });

    const list = Array.from(map.entries()).map(([catId, data]) => {
      const category = categories.find(c => c.id === catId) || {
        id: catId,
        name: 'Outros',
        icon: 'Package',
        color: '#94A3B8',
        type: 'expense' as const,
      };
      const percentage = totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0;
      return {
        category,
        total: data.total,
        percentage,
        count: data.count,
      };
    });

    return list.sort((a, b) => b.total - a.total);
  }, [monthExpenses, categories, totalExpenses]);

  // Monthly Comparison (6 months window around selected)
  const monthlyComparison = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // 3 months prior to 2 months ahead
    for (let offset = -2; offset <= 3; offset++) {
      let m = selectedMonth + offset;
      let y = selectedYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      } else if (m > 11) {
        m -= 12;
        y += 1;
      }

      const total = expenses
        .filter(e => isSameMonthYear(e.dueDate, y, m))
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({
        monthName: monthNames[m],
        year: y,
        month: m,
        total,
        isCurrent: m === selectedMonth && y === selectedYear,
      });
    }
    return months;
  }, [expenses, selectedMonth, selectedYear]);

  // Dynamic alerts
  const alerts = useMemo(() => {
    const list: { id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; date?: string }[] = [];

    // Overdue bills
    const overdueList = expenses.filter(e => e.status === 'vencido' || (e.status !== 'pago' && getDaysDifference(e.dueDate) < 0));
    if (overdueList.length > 0) {
      const overdueSum = overdueList.reduce((acc, cur) => acc + cur.amount, 0);
      list.push({
        id: 'alert-overdue',
        type: 'danger',
        title: 'Contas vencidas',
        message: `Você possui ${overdueList.length} conta(s) vencida(s) totalizando ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overdueSum)}.`,
      });
    }

    // Bills due tomorrow
    const dueTomorrow = expenses.filter(e => e.status !== 'pago' && getDaysDifference(e.dueDate) === 1);
    dueTomorrow.forEach(b => {
      list.push({
        id: `alert-tomorrow-${b.id}`,
        type: 'warning',
        title: 'Vencimento amanhã',
        message: `${b.description} — ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.amount)}`,
        date: b.dueDate,
      });
    });

    // Bills due in 7 days
    if (upcomingBills7Days.length > 0) {
      const sum7 = upcomingBills7Days.reduce((acc, cur) => acc + cur.amount, 0);
      list.push({
        id: 'alert-week',
        type: 'info',
        title: 'Vencimentos da semana',
        message: `Você possui ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sum7)} em ${upcomingBills7Days.length} conta(s) nos próximos 7 dias.`,
      });
    }

    return list;
  }, [expenses, upcomingBills7Days]);

  // Export / Backup functions
  const exportToJSON = () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      expenses,
      recurringExpenses,
      incomes,
      creditCards,
      goals,
      categories,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-financas-${toDateString(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    // Export expenses in clean UTF-8 CSV with semicolon delimiter for Excel BR compatibility
    const headers = ['ID', 'Descrição', 'Categoria', 'Valor', 'Vencimento', 'Data Compra', 'Forma Pagamento', 'Tipo', 'Status', 'Data Pagamento', 'Observações'];
    const rows = expenses.map(e => {
      const cat = categories.find(c => c.id === e.categoryId)?.name || 'Outros';
      return [
        e.id,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${cat}"`,
        e.amount.toFixed(2).replace('.', ','),
        e.dueDate,
        e.purchaseDate,
        e.paymentMethod,
        e.type,
        e.status,
        e.paymentDate || '',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despesas-${toDateString(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.expenses && Array.isArray(parsed.expenses)) {
        setExpenses(parsed.expenses);
        if (parsed.recurringExpenses) setRecurringExpenses(parsed.recurringExpenses);
        if (parsed.incomes) setIncomes(parsed.incomes);
        if (parsed.creditCards) setCreditCards(parsed.creditCards);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetAllData = () => {
    setExpenses([]);
    setRecurringExpenses([]);
    setIncomes([]);
    setGoals([]);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_recurring`);
    localStorage.removeItem(`${STORAGE_KEY}_incomes`);
    localStorage.removeItem(`${STORAGE_KEY}_goals`);
  };

  const loadDemoData = () => {
    setExpenses(SEED_EXPENSES);
    setRecurringExpenses(SEED_RECURRING);
    setIncomes(SEED_INCOMES);
    setCreditCards(SEED_CREDIT_CARDS);
    setGoals(SEED_GOALS);
    setCategories(DEFAULT_CATEGORIES);
    setSelectedYear(2026);
    setSelectedMonth(7); // Agosto 2026
  };

  return (
    <FinanceContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        goToNextMonth,
        goToPrevMonth,
        goToCurrentMonth,
        expenses,
        recurringExpenses,
        incomes,
        creditCards,
        goals,
        categories,
        settings,
        isLocked,
        unlockApp,
        lockApp,
        updateSettings,
        addExpense,
        updateExpense,
        markExpenseAsPaid,
        markExpenseAsPending,
        deleteExpense,
        addRecurringExpense,
        updateRecurringExpense,
        toggleRecurringStatus,
        deleteRecurringExpense,
        addIncome,
        updateIncome,
        deleteIncome,
        markIncomeStatus,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addGoal,
        updateGoal,
        deleteGoal,
        addCategory,
        updateCategory,
        deleteCategory,
        monthExpenses,
        monthIncomes,
        totalExpenses,
        totalPaid,
        totalPending,
        totalOverdue,
        totalIncome,
        monthBalance,
        projectedBalance,
        upcomingBills7Days,
        categoryTotals,
        monthlyComparison,
        alerts,
        exportToJSON,
        exportToCSV,
        importFromJSON,
        resetAllData,
        loadDemoData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
