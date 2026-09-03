import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, UserRole } from '../types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  isLoading: boolean;
  isMasterAdmin: boolean;
  activeViewingUserId: string | null;
  activeViewingUser: AppUser | null;
  effectiveUserId: string;
  setActiveViewingUserId: (userId: string | null) => void;
  stopImpersonation: () => void;
  login: (username: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (userData: { username: string; name: string; password?: string; role: UserRole }) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetUserSpreadsheet: (userId: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'finanz_current_user';
const STORAGE_REMEMBER_KEY = 'finanz_remember_login';
const STORAGE_USERS_LIST_KEY = 'finanz_app_users_list';

const INITIAL_MASTER_USER: AppUser = {
  id: 'user_master',
  username: 'admin',
  name: 'Administrador Master',
  password: '123',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

// Safe JSON fetch wrapper that never throws raw SyntaxError on HTML/text responses
async function safeFetchJson(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data, error: data?.error };
    }
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      return { ok: res.ok, status: res.status, data: parsed, error: parsed?.error };
    } catch {
      // Non-JSON response (such as HTML proxy page)
      return {
        ok: false,
        status: res.status,
        error: res.ok ? 'Resposta inesperada do servidor' : `Servidor temporariamente indisponível (HTTP ${res.status})`,
      };
    }
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message || 'Erro de conexão com o servidor' };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_LIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_MASTER_USER];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeViewingUserId, setActiveViewingUserId] = useState<string | null>(null);

  // Sync users to local storage helper
  const persistUsersLocal = (userList: AppUser[]) => {
    try {
      localStorage.setItem(STORAGE_USERS_LIST_KEY, JSON.stringify(userList));
    } catch {}
  };

  // Fetch users from server or Firestore
  const refreshUsers = useCallback(async () => {
    // 1. Try server API safely
    const apiResult = await safeFetchJson('/api/finance/users');
    if (apiResult.ok && apiResult.data?.success && Array.isArray(apiResult.data.users) && apiResult.data.users.length > 0) {
      const serverUsers: AppUser[] = apiResult.data.users;
      setUsers(serverUsers);
      persistUsersLocal(serverUsers);

      // Keep current logged-in user updated
      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = serverUsers.find((u) => u.id === prev.id);
        if (updated) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
      return;
    }

    // 2. Direct Firestore fallback
    if (isFirebaseAvailable && db) {
      try {
        const userDocRef = doc(db, 'finance_system', 'users');
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
            persistUsersLocal(data.users);
            return;
          }
        }
      } catch (err) {
        console.warn('Firestore users fallback error:', err);
      }
    }
  }, []);

  // Initial load and Firestore realtime listener for users
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      setIsLoading(true);
      await refreshUsers();
      setIsLoading(false);

      if (isFirebaseAvailable && db) {
        try {
          const userDocRef = doc(db, 'finance_system', 'users');
          unsubscribe = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (Array.isArray(data.users) && data.users.length > 0) {
                setUsers(data.users);
              }
            }
          }, (err) => {
            console.warn('Users realtime snapshot error:', err);
          });
        } catch (e) {
          console.warn('Failed to listen to users Firestore doc:', e);
        }
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [refreshUsers]);

  // Login handler
  const login = async (usernameInput: string, passwordInput?: string, rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput ? passwordInput.trim() : '';

    // First ensure users are up to date
    await refreshUsers();

    // Check users list
    const foundUser = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      (cleanUsername === 'master' && u.id === 'user_master') ||
      (cleanUsername === 'admin' && u.id === 'user_master')
    );

    if (!foundUser) {
      // If no users at all, allow default master admin
      if (cleanUsername === 'admin' || cleanUsername === 'master') {
        const master = INITIAL_MASTER_USER;
        setCurrentUser(master);
        if (rememberMe) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(master));
          localStorage.setItem(STORAGE_REMEMBER_KEY, 'true');
        } else {
          sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(master));
          localStorage.removeItem(STORAGE_USER_KEY);
          localStorage.removeItem(STORAGE_REMEMBER_KEY);
        }
        return { success: true };
      }
      return { success: false, error: 'Usuário não encontrado. Verifique o login digitado.' };
    }

    if (!foundUser.isActive) {
      return { success: false, error: 'Este usuário está inativo. Contate o Administrador.' };
    }

    // Password verification
    const expectedPassword = foundUser.password || '123';
    if (expectedPassword && cleanPassword !== expectedPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    // Update last login
    const updatedUser: AppUser = {
      ...foundUser,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setActiveViewingUserId(null); // Reset any previous impersonation
    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
        localStorage.setItem(STORAGE_REMEMBER_KEY, 'true');
      } else {
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_REMEMBER_KEY);
      }
    } catch {}

    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setActiveViewingUserId(null);
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_REMEMBER_KEY);
      sessionStorage.removeItem(STORAGE_USER_KEY);
    } catch {}
  };

  // Create User (Admin only)
  const createUser = async (userData: { username: string; name: string; password?: string; role: UserRole }): Promise<{ success: boolean; error?: string; user?: AppUser }> => {
    const cleanUsername = userData.username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = userData.name.trim();
    const cleanPassword = userData.password ? userData.password.trim() : '123';
    const role: UserRole = userData.role === 'admin' ? 'admin' : 'user';

    if (!cleanUsername || !cleanName) {
      return { success: false, error: 'Nome e Nome de Usuário são obrigatórios.' };
    }

    // Check if username is already taken
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return { 
        success: false, 
        error: `O login "${cleanUsername}" já está em uso por ${existing.name}. Escolha outro nome de usuário.` 
      };
    }

    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: AppUser = {
      id: newUserId,
      username: cleanUsername,
      name: cleanName,
      password: cleanPassword,
      role,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedUsersList = [...users, newUser];

    // 1. Direct Firestore write (guarantees instant cloud persistence even if server is busy/restarting)
    if (isFirebaseAvailable && db) {
      try {
        const userSystemRef = doc(db, 'finance_system', 'users');
        await setDoc(userSystemRef, { 
          users: updatedUsersList, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });

        // Initialize user's blank spreadsheet document in Firestore
        const userDocRef = doc(db, 'finance_users', newUserId);
        await setDoc(userDocRef, {
          userId: newUserId,
          expenses: [],
          recurringExpenses: [],
          incomes: [],
          creditCards: [],
          goals: [],
          categories: DEFAULT_CATEGORIES,
          settings: {
            userName: cleanName,
            currency: 'BRL',
            pinEnabled: false,
            pinCode: '1234',
            notificationsEnabled: true,
            alertDaysAhead: 7,
          },
          updatedAt: new Date().toISOString(),
        });
      } catch (fbErr) {
        console.warn('Direct Firestore user creation notice:', fbErr);
      }
    }

    // 2. Notify server API safely to update local JSON file
    safeFetchJson('/api/finance/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(err => {
      console.warn('Server user sync warning:', err);
    });

    // 3. Immediately update UI state and local persistence
    setUsers(updatedUsersList);
    persistUsersLocal(updatedUsersList);

    return { success: true, user: newUser };
  };

  // Update User (Admin only)
  const updateUser = async (id: string, updates: Partial<AppUser>): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = updates.username ? updates.username.trim().toLowerCase().replace(/\s+/g, '') : undefined;
    
    // Check duplicate if changing username
    if (cleanUsername) {
      const duplicate = users.find(u => u.username.toLowerCase() === cleanUsername && u.id !== id);
      if (duplicate) {
        return { success: false, error: `O login "${cleanUsername}" já está em uso por ${duplicate.name}.` };
      }
    }

    const updatedUsersList = users.map(u => {
      if (u.id !== id) return u;
      return {
        ...u,
        ...updates,
        ...(cleanUsername ? { username: cleanUsername } : {}),
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.password ? { password: updates.password.trim() } : {}),
      };
    });

    // 1. Direct Firestore write
    if (isFirebaseAvailable && db) {
      try {
        const userSystemRef = doc(db, 'finance_system', 'users');
        await setDoc(userSystemRef, { 
          users: updatedUsersList, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore update user notice:', fbErr);
      }
    }

    // 2. Notify server API safely
    safeFetchJson('/api/finance/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates, ...(cleanUsername ? { username: cleanUsername } : {}) }),
    }).catch(err => {
      console.warn('Server update user sync warning:', err);
    });

    // 3. Update local state
    setUsers(updatedUsersList);
    persistUsersLocal(updatedUsersList);

    // If updating current logged in user
    if (currentUser?.id === id) {
      const self = updatedUsersList.find(u => u.id === id);
      if (self) {
        setCurrentUser(self);
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(self));
        } catch {}
      }
    }

    return { success: true };
  };

  // Delete User (Admin only)
  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (id === 'user_master') {
      return { success: false, error: 'Não é permitido excluir o Administrador Master principal.' };
    }

    const updatedUsersList = users.filter(u => u.id !== id);

    // 1. Direct Firestore update
    if (isFirebaseAvailable && db) {
      try {
        const userSystemRef = doc(db, 'finance_system', 'users');
        await setDoc(userSystemRef, { 
          users: updatedUsersList, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore delete user notice:', fbErr);
      }
    }

    // 2. Notify server API
    safeFetchJson(`/api/finance/users/${id}`, {
      method: 'DELETE',
    }).catch(err => {
      console.warn('Server delete user sync warning:', err);
    });

    if (activeViewingUserId === id) {
      setActiveViewingUserId(null);
    }

    setUsers(updatedUsersList);
    persistUsersLocal(updatedUsersList);

    return { success: true };
  };

  // Reset user's spreadsheet back to blank (zerada)
  const resetUserSpreadsheet = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const target = users.find(u => u.id === userId);
    const userName = target?.name || 'Usuário';

    // 1. Direct Firestore reset
    if (isFirebaseAvailable && db) {
      try {
        const userDocRef = doc(db, 'finance_users', userId);
        await setDoc(userDocRef, {
          userId,
          expenses: [],
          recurringExpenses: [],
          incomes: [],
          creditCards: [],
          goals: [],
          categories: DEFAULT_CATEGORIES,
          settings: {
            userName,
            currency: 'BRL',
            pinEnabled: false,
            pinCode: '1234',
            notificationsEnabled: true,
            alertDaysAhead: 7,
          },
          updatedAt: new Date().toISOString(),
        });
      } catch (fbErr) {
        console.warn('Firestore reset user sheet notice:', fbErr);
      }
    }

    // 2. Notify server API
    safeFetchJson(`/api/finance/users/${userId}/reset`, {
      method: 'POST',
    }).catch(err => {
      console.warn('Server reset user sync warning:', err);
    });

    return { success: true };
  };

  const activeViewingUser = activeViewingUserId 
    ? users.find(u => u.id === activeViewingUserId) || null
    : null;

  const effectiveUserId = activeViewingUserId || currentUser?.id || 'user_master';
  const isMasterAdmin = currentUser?.role === 'admin' || currentUser?.id === 'user_master';
  const stopImpersonation = () => setActiveViewingUserId(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        isMasterAdmin,
        activeViewingUserId,
        activeViewingUser,
        effectiveUserId,
        setActiveViewingUserId,
        stopImpersonation,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        resetUserSpreadsheet,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
