import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, UserRole } from '../types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';

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

const INITIAL_MASTER_USER: AppUser = {
  id: 'user_master',
  username: 'admin',
  name: 'Administrador Master',
  password: '123',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

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

  const [users, setUsers] = useState<AppUser[]>([INITIAL_MASTER_USER]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeViewingUserId, setActiveViewingUserId] = useState<string | null>(null);

  // Fetch users from server or Firestore
  const refreshUsers = useCallback(async () => {
    try {
      // 1. Try server API
      const res = await fetch('/api/finance/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
          // If current logged-in user is updated, keep local session synced
          setCurrentUser(prev => {
            if (!prev) return null;
            const updated = data.users.find((u: AppUser) => u.id === prev.id);
            if (updated) {
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
          return;
        }
      }
    } catch (err) {
      console.warn('API users fetch error, checking Firestore:', err);
    }

    // 2. Direct Firestore check
    if (isFirebaseAvailable && db) {
      try {
        const userDocRef = doc(db, 'finance_system', 'users');
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
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
  const createUser = async (userData: { username: string; name: string; password?: string; role: UserRole }) => {
    try {
      const res = await fetch('/api/finance/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao criar usuário' };
      }

      await refreshUsers();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao criar usuário' };
    }
  };

  // Update User (Admin only)
  const updateUser = async (id: string, updates: Partial<AppUser>) => {
    try {
      const res = await fetch('/api/finance/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao atualizar usuário' };
      }

      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao atualizar usuário' };
    }
  };

  // Delete User (Admin only)
  const deleteUser = async (id: string) => {
    if (id === 'user_master') {
      return { success: false, error: 'Não é permitido excluir o Administrador Master principal.' };
    }

    try {
      const res = await fetch(`/api/finance/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao excluir usuário' };
      }

      if (activeViewingUserId === id) {
        setActiveViewingUserId(null);
      }

      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao excluir usuário' };
    }
  };

  // Reset user's spreadsheet back to blank (zerada)
  const resetUserSpreadsheet = async (userId: string) => {
    try {
      const res = await fetch(`/api/finance/users/${userId}/reset`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao zerar planilha' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao zerar planilha' };
    }
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
