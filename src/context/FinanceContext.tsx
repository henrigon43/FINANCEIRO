import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Expense, 
  RecurringExpense, 
  Income, 
  CreditCard, 
  FinancialGoal, 
  FinancialContract,
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
  SEED_GOALS,
  SEED_CONTRACTS
} from '../data/seedData';
import { 
  isSameMonthYear, 
  parseDateSafe, 
  toDateString, 
  getDaysDifference 
} from '../utils/formatters';
import { db, doc, setDoc, getDoc, onSnapshot } from '../firebase';
import { useAuth } from './AuthContext';

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

  // Contracts Actions
  contracts: FinancialContract[];
  addContract: (contractData: Omit<FinancialContract, 'id' | 'createdAt'>) => void;
  updateContract: (id: string, updated: Partial<FinancialContract>) => void;
  deleteContract: (id: string) => void;
  payContractInstallment: (id: string) => void;

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

  // Cloud Database Sync
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncedAt: Date | null;
  forceSync: () => Promise<void>;
  isFirebaseConnected: boolean;
}

const STORAGE_KEY = 'finance_manager_state_v1';

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, effectiveUserId, activeViewingUser } = useAuth();

  // Initialize to August 2026 (Month index 7) to showcase the rich prompt data immediately
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('finance_selected_year');
      if (stored) return parseInt(stored, 10);
      return new Date().getFullYear();
    } catch {
      return 2026;
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('finance_selected_month');
      if (stored !== null) return parseInt(stored, 10);
      return new Date().getMonth(); // Defaults to current active month (Setembro)
    } catch {
      return 8;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('finance_selected_year', String(selectedYear));
    } catch {}
  }, [selectedYear]);

  useEffect(() => {
    try {
      localStorage.setItem('finance_selected_month', String(selectedMonth));
    } catch {}
  }, [selectedMonth]);

  // Storage key helper per active user
  const getUserKey = (suffix: string) => `finanz_user_${effectiveUserId}_${suffix}`;

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('expenses'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_EXPENSES : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_EXPENSES : [];
    }
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('recurring'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_RECURRING : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_RECURRING : [];
    }
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('incomes'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_INCOMES : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_INCOMES : [];
    }
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('cards'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_CREDIT_CARDS : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_CREDIT_CARDS : [];
    }
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('goals'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_GOALS : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_GOALS : [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('categories'));
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [contracts, setContracts] = useState<FinancialContract[]>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('contracts'));
      if (stored) return JSON.parse(stored);
      return effectiveUserId === 'user_master' ? SEED_CONTRACTS : [];
    } catch {
      return effectiveUserId === 'user_master' ? SEED_CONTRACTS : [];
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(getUserKey('settings'));
      return stored ? JSON.parse(stored) : {
        userName: activeViewingUser?.name || currentUser?.name || 'Usuário',
        currency: 'BRL',
        pinEnabled: false,
        pinCode: '1234',
        notificationsEnabled: true,
        alertDaysAhead: 7,
      };
    } catch {
      return {
        userName: activeViewingUser?.name || currentUser?.name || 'Usuário',
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

  // Cloud Database Sync State (Firebase Firestore + Server Backup)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  
  // Deterministic Fingerprint & State Tracking Refs
  const isInitialLoadDoneRef = React.useRef<boolean>(false);
  const lastAppliedFingerprintRef = React.useRef<string>('');
  const syncDebounceTimerRef = React.useRef<any>(null);

  // Helper to calculate a deterministic fingerprint of finance state
  const getFingerprint = (data: {
    expenses?: any[];
    recurringExpenses?: any[];
    incomes?: any[];
    creditCards?: any[];
    goals?: any[];
    categories?: any[];
    contracts?: any[];
    settings?: any;
  }) => {
    try {
      return JSON.stringify({
        e: data.expenses || [],
        r: data.recurringExpenses || [],
        i: data.incomes || [],
        c: data.creditCards || [],
        g: data.goals || [],
        cat: data.categories || [],
        con: data.contracts || [],
        s: data.settings || {},
      });
    } catch {
      return String(Date.now());
    }
  };

  // Helper to ensure clean JSON object for Firestore
  const sanitizeForFirestore = (obj: any) => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  };

  // Helper to apply incoming database data to React state
  const applyRemoteData = React.useCallback((data: any, force: boolean = false) => {
    if (!data) return;

    const fingerprint = getFingerprint({
      expenses: data.expenses,
      recurringExpenses: data.recurringExpenses,
      incomes: data.incomes,
      creditCards: data.creditCards,
      goals: data.goals,
      categories: data.categories,
      contracts: data.contracts,
      settings: data.settings,
    });

    // If identical to what this client already has or just saved, avoid re-render loops (unless forced)
    if (!force && fingerprint === lastAppliedFingerprintRef.current) {
      return;
    }

    // Set ref BEFORE triggering React state updates so outgoing effect knows this is from remote
    lastAppliedFingerprintRef.current = fingerprint;

    if (Array.isArray(data.expenses)) setExpenses(data.expenses);
    if (Array.isArray(data.recurringExpenses)) setRecurringExpenses(data.recurringExpenses);
    if (Array.isArray(data.incomes)) setIncomes(data.incomes);
    if (Array.isArray(data.creditCards)) setCreditCards(data.creditCards);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.contracts)) setContracts(data.contracts);
    if (data.settings && typeof data.settings === 'object') setSettings(data.settings);

    setSyncStatus('synced');
    setLastSyncedAt(new Date());
    setIsFirebaseConnected(true);
  }, []);

  // Sync state changes to localStorage (offline cache per user)
  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('expenses'), JSON.stringify(expenses));
    } catch {}
  }, [expenses, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('recurring'), JSON.stringify(recurringExpenses));
    } catch {}
  }, [recurringExpenses, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('incomes'), JSON.stringify(incomes));
    } catch {}
  }, [incomes, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('cards'), JSON.stringify(creditCards));
    } catch {}
  }, [creditCards, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('goals'), JSON.stringify(goals));
    } catch {}
  }, [goals, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('categories'), JSON.stringify(categories));
    } catch {}
  }, [categories, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('contracts'), JSON.stringify(contracts));
    } catch {}
  }, [contracts, effectiveUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(getUserKey('settings'), JSON.stringify(settings));
    } catch {}
  }, [settings, effectiveUserId]);

  // 1. Initial Load & Real-Time Sync via Firebase Firestore onSnapshot + Server Fetch for effectiveUserId
  useEffect(() => {
    let isMounted = true;
    isInitialLoadDoneRef.current = false;

    // Fast load from user's local cache if exists, or reset to empty if new regular user
    try {
      const cachedExpenses = localStorage.getItem(getUserKey('expenses'));
      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
      } else if (effectiveUserId !== 'user_master') {
        setExpenses([]);
      }

      const cachedRecurring = localStorage.getItem(getUserKey('recurring'));
      if (cachedRecurring) {
        setRecurringExpenses(JSON.parse(cachedRecurring));
      } else if (effectiveUserId !== 'user_master') {
        setRecurringExpenses([]);
      }

      const cachedIncomes = localStorage.getItem(getUserKey('incomes'));
      if (cachedIncomes) {
        setIncomes(JSON.parse(cachedIncomes));
      } else if (effectiveUserId !== 'user_master') {
        setIncomes([]);
      }

      const cachedCards = localStorage.getItem(getUserKey('cards'));
      if (cachedCards) {
        setCreditCards(JSON.parse(cachedCards));
      } else if (effectiveUserId !== 'user_master') {
        setCreditCards([]);
      }

      const cachedGoals = localStorage.getItem(getUserKey('goals'));
      if (cachedGoals) {
        setGoals(JSON.parse(cachedGoals));
      } else if (effectiveUserId !== 'user_master') {
        setGoals([]);
      }

      const cachedContracts = localStorage.getItem(getUserKey('contracts'));
      if (cachedContracts) {
        setContracts(JSON.parse(cachedContracts));
      } else if (effectiveUserId !== 'user_master') {
        setContracts([]);
      }
    } catch {}

    const userDocRef = doc(db, 'finance_users', effectiveUserId);

    // Immediate fast fetch from server API
    fetch(`/api/finance/data?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && isMounted) {
          applyRemoteData(data, true);
          isInitialLoadDoneRef.current = true;
        }
      })
      .catch((e) => console.warn('Initial server fetch note:', e));

    // Subscribe to real-time changes from Firestore client SDK for this user
    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          applyRemoteData(data);
        } else if (effectiveUserId === 'user_master') {
          // Check legacy primary document for backwards compatibility
          try {
            const legacyDoc = await getDoc(doc(db, 'finance_data', 'primary'));
            if (legacyDoc.exists()) {
              applyRemoteData(legacyDoc.data());
              // Clone to new user doc
              setDoc(userDocRef, { ...legacyDoc.data(), userId: 'user_master' }).catch(() => {});
            }
          } catch {}
        }

        isInitialLoadDoneRef.current = true;
        setIsFirebaseConnected(true);
        setSyncStatus('synced');
      },
      (error) => {
        console.warn('Firestore listener fallback to server API:', error);
        setIsFirebaseConnected(false);
        // Fallback to server fetch
        fetch(`/api/finance/data?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && isMounted) {
              applyRemoteData(data);
            }
          })
          .catch(() => setSyncStatus('error'))
          .finally(() => {
            if (isMounted) isInitialLoadDoneRef.current = true;
          });
      }
    );

    // Cross-device synchronization handler (for Mobile <-> PC instant sync)
    const handleRemoteRefresh = () => {
      if (!isMounted) return;
      fetch(`/api/finance/data?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && isMounted) {
            applyRemoteData(data);
          }
        })
        .catch(() => {});
    };

    // Trigger sync when tab becomes visible or focused
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        handleRemoteRefresh();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    // Periodic heartbeat sync every 8 seconds to catch external changes from PC/Mobile
    const syncInterval = setInterval(handleRemoteRefresh, 8000);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      clearInterval(syncInterval);
    };
  }, [effectiveUserId, applyRemoteData]);

  // 2. Outgoing Auto-Save to Firebase Firestore & Server Backup whenever local state changes
  useEffect(() => {
    // Do not sync until initial database load has resolved
    if (!isInitialLoadDoneRef.current) return;

    const currentFingerprint = getFingerprint({
      expenses,
      recurringExpenses,
      incomes,
      creditCards,
      goals,
      categories,
      contracts,
      settings,
    });

    // If current state matches what was applied from remote or already saved, skip write
    if (currentFingerprint === lastAppliedFingerprintRef.current) {
      return;
    }

    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }

    setSyncStatus('syncing');

    syncDebounceTimerRef.current = setTimeout(async () => {
      // Mark as applied to prevent echo loops
      lastAppliedFingerprintRef.current = currentFingerprint;

      const payload = sanitizeForFirestore({
        userId: effectiveUserId,
        expenses,
        recurringExpenses,
        incomes,
        creditCards,
        goals,
        categories,
        contracts,
        settings,
        updatedAt: new Date().toISOString(),
      });

      let serverOk = false;
      // 1. Post to Server API (saves to Firestore on server + local user file)
      try {
        const res = await fetch('/api/finance/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) serverOk = true;
      } catch (err) {
        console.warn('Server sync warning:', err);
      }

      // 2. Also save directly to Firebase Firestore client SDK for instant cross-device mobile/PC sync
      try {
        const userDocRef = doc(db, 'finance_users', effectiveUserId);
        await setDoc(userDocRef, payload, { merge: true });

        // If master user, also keep legacy primary document updated
        if (effectiveUserId === 'user_master') {
          setDoc(doc(db, 'finance_data', 'primary'), payload, { merge: true }).catch(() => {});
        }

        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setIsFirebaseConnected(true);
      } catch (fbErr) {
        console.warn('Firestore direct write warning:', fbErr);
        if (serverOk) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          setIsFirebaseConnected(true);
        } else {
          setSyncStatus('error');
        }
      }
    }, 150);

    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
    };
  }, [effectiveUserId, expenses, recurringExpenses, incomes, creditCards, goals, categories, settings]);

  // 3. Mobile Wake-Up & Tab Visibility Safety Net (Crucial for smartphones!)
  useEffect(() => {
    let lastCheckedTimestamp = '';

    const checkAndSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetch(`/api/finance/version?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`)
          .then((res) => res.json())
          .then((ver) => {
            if (ver.success && ver.lastModified && ver.lastModified !== lastCheckedTimestamp) {
              lastCheckedTimestamp = ver.lastModified;
              fetch(`/api/finance/data?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`)
                .then((r) => r.json())
                .then((data) => {
                  if (data.success) {
                    applyRemoteData(data);
                  }
                })
                .catch(() => {});
            }
          })
          .catch(() => {
            // Fallback direct getDoc
            const userDocRef = doc(db, 'finance_users', effectiveUserId);
            getDoc(userDocRef)
              .then((snap) => {
                if (snap.exists()) {
                  applyRemoteData(snap.data());
                }
              })
              .catch(() => {});
          });
      }
    };

    window.addEventListener('visibilitychange', checkAndSync);
    window.addEventListener('focus', checkAndSync);

    // Regular poll every 3 seconds when app is active on screen
    const pollInterval = setInterval(checkAndSync, 3000);

    return () => {
      window.removeEventListener('visibilitychange', checkAndSync);
      window.removeEventListener('focus', checkAndSync);
      clearInterval(pollInterval);
    };
  }, [effectiveUserId, applyRemoteData]);

  // 4. Manual forceSync handler
  const forceSync = async () => {
    try {
      setSyncStatus('syncing');
      // Fetch fresh data from server API with cache busting
      const res = await fetch(`/api/finance/data?userId=${encodeURIComponent(effectiveUserId)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          applyRemoteData(data, true);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          setIsFirebaseConnected(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Force sync server fetch note:', err);
    }

    try {
      const userDocRef = doc(db, 'finance_users', effectiveUserId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        applyRemoteData(snap.data(), true);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setIsFirebaseConnected(true);
      }
    } catch (err) {
      console.error('Force sync failed:', err);
      setSyncStatus('error');
    }
  };

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

  // Contracts Handlers
  const addContract = (contractData: Omit<FinancialContract, 'id' | 'createdAt'>) => {
    const id = `contract-${Date.now()}`;
    const newContract: FinancialContract = {
      ...contractData,
      id,
      createdAt: new Date().toISOString(),
    };
    setContracts(prev => [...prev, newContract]);
  };

  const updateContract = (id: string, data: Partial<FinancialContract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  const payContractInstallment = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    const nextPaidMonths = Math.min(contract.totalMonths, contract.paidMonths + 1);
    const newBalance = Math.max(0, contract.outstandingBalance - contract.monthlyPayment);
    const isNowFinished = nextPaidMonths >= contract.totalMonths;

    // Calculate next due date (1 month ahead)
    const baseDate = parseDateSafe(contract.nextDueDate);
    const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, Math.min(contract.dueDay || 10, 28));
    const nextDueDateStr = toDateString(nextDate);

    // Update contract state
    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          paidMonths: nextPaidMonths,
          outstandingBalance: newBalance,
          nextDueDate: nextDueDateStr,
          status: isNowFinished ? 'quitado' : c.status,
        };
      }
      return c;
    }));

    // Auto-create linked expense in expenses list so it appears in "Este Mês" and reports!
    const targetCat = contract.type === 'financiamento_imovel'
      ? (categories.find(c => c.name.toLowerCase().includes('moradia')) || categories[0])
      : (categories.find(c => c.name.toLowerCase().includes('transporte')) || categories[0]);

    const newExpense: Expense = {
      id: `exp-contract-${id}-${nextPaidMonths}-${Date.now()}`,
      description: `${contract.title} (${nextPaidMonths}/${contract.totalMonths})`,
      amount: contract.monthlyPayment,
      categoryId: targetCat?.id || categories[0]?.id || 'cat-moradia',
      purchaseDate: toDateString(new Date()),
      dueDate: contract.nextDueDate,
      paymentMethod: contract.paymentMethod,
      cardId: contract.cardId,
      type: 'parcelada',
      status: 'pago',
      paymentDate: toDateString(new Date()),
      installmentNumber: nextPaidMonths,
      totalInstallments: contract.totalMonths,
      contractId: contract.id,
      notes: `Baixa de parcela referente a ${contract.financialInstitution}`,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [...prev, newExpense]);
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
      contracts,
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
        if (parsed.contracts) setContracts(parsed.contracts);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetAllData = async () => {
    setExpenses([]);
    setRecurringExpenses([]);
    setIncomes([]);
    setGoals([]);
    setCreditCards([]);
    setContracts([]);
    try {
      localStorage.removeItem(getUserKey('expenses'));
      localStorage.removeItem(getUserKey('recurring'));
      localStorage.removeItem(getUserKey('incomes'));
      localStorage.removeItem(getUserKey('goals'));
      localStorage.removeItem(getUserKey('cards'));
      localStorage.removeItem(getUserKey('contracts'));

      const userDocRef = doc(db, 'finance_users', effectiveUserId);
      await setDoc(userDocRef, sanitizeForFirestore({
        userId: effectiveUserId,
        expenses: [],
        recurringExpenses: [],
        incomes: [],
        creditCards: [],
        goals: [],
        categories,
        contracts: [],
        settings,
        updatedAt: new Date().toISOString(),
      }));

      await fetch(`/api/finance/reset-user-sheet/${encodeURIComponent(effectiveUserId)}`, {
        method: 'POST',
      });
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch {
      // Offline fallback handled
    }
  };

  const loadDemoData = async () => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/finance/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          applyRemoteData(data);
          setSelectedYear(2026);
          setSelectedMonth(7);
          return;
        }
      }
    } catch (e) {
      console.warn('Reset request failed, falling back to local seed data:', e);
    }

    setExpenses(SEED_EXPENSES);
    setRecurringExpenses(SEED_RECURRING);
    setIncomes(SEED_INCOMES);
    setCreditCards(SEED_CREDIT_CARDS);
    setGoals(SEED_GOALS);
    setCategories(DEFAULT_CATEGORIES);
    setContracts(SEED_CONTRACTS);
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
        contracts,
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
        addContract,
        updateContract,
        deleteContract,
        payContractInstallment,
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
        syncStatus,
        lastSyncedAt,
        forceSync,
        isFirebaseConnected,
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
