import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Key, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const AdminUsersView: React.FC<{ onNavigateToExpenses?: () => void }> = ({ onNavigateToExpenses }) => {
  const { 
    currentUser, 
    users, 
    createUser, 
    updateUser, 
    deleteUser, 
    resetUserSpreadsheet,
    activeViewingUserId,
    setActiveViewingUserId 
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation modals
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('123'); // Senha padrão inicial fácil
    setRole('user');
    setIsActive(true);
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password || '');
    setRole(u.role);
    setIsActive(u.isActive);
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setFormError('Nome e Nome de Usuário são obrigatórios.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Edit existing
        const res = await updateUser(editingUser.id, {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          role,
          isActive,
        });
        if (!res.success) {
          setFormError(res.error || 'Erro ao atualizar usuário');
          setIsSubmitting(false);
          return;
        }
        showSuccess(`Usuário ${name} atualizado com sucesso!`);
      } else {
        // Create new
        const res = await createUser({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim() || '123',
          role,
        });
        if (!res.success) {
          setFormError(res.error || 'Erro ao criar usuário');
          setIsSubmitting(false);
          return;
        }
        showSuccess(`Novo usuário ${name} cadastrado com planilha zerada!`);
      }

      setIsModalOpen(false);
    } catch {
      setFormError('Falha ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUser(deleteTarget.id);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir usuário');
      } else {
        showSuccess(`Usuário ${deleteTarget.name} removido com sucesso.`);
      }
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const handleResetConfirm = async () => {
    if (!resetTarget) return;
    setIsSubmitting(true);
    try {
      const res = await resetUserSpreadsheet(resetTarget.id);
      if (!res.success) {
        alert(res.error || 'Erro ao zerar planilha');
      } else {
        showSuccess(`A planilha de ${resetTarget.name} foi zerada completamente.`);
      }
    } finally {
      setIsSubmitting(false);
      setResetTarget(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardUsers = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Top Banner if Impersonating a user */}
      {activeViewingUserId && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-4 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Modo de Inspeção Ativo: </span>
              <span>Você está visualizando e editando a planilha do usuário <strong>{users.find(u => u.id === activeViewingUserId)?.name}</strong>.</span>
            </div>
          </div>
          <button
            onClick={() => setActiveViewingUserId(null)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            Voltar para Minha Planilha Master
          </button>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 text-sm shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Painel do Administrador Master</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Crie e gerencie usuários, senhas e permissões. Cada novo usuário recebe uma planilha individual e zerada.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Novo Usuário</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Usuários</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cadastrados no sistema</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Planilhas Pessoais</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{standardUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Usuários com dados zerados/isolados</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Administradores</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{adminCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Com acesso master</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Seu Login</span>
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate">
            {currentUser?.username || 'admin'}
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            {currentUser?.role === 'admin' ? 'Master Admin' : 'Usuário'}
          </p>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou login..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 w-full sm:w-auto text-right">
            Mostrando <strong>{filteredUsers.length}</strong> de {users.length} usuários
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Login / Senha</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Planilha</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum usuário encontrado com o termo pesquisado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentLogged = currentUser?.id === u.id;
                  const isBeingViewed = activeViewingUserId === u.id;

                  return (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBeingViewed ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentLogged && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              ID: {u.id.slice(0, 16)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Login / Password */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">@{u.username}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Key className="w-3 h-3 text-slate-300" />
                          <span>{u.password || '••••••'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Master Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Usuário Comum</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Planilha Individual View/Switch */}
                      <td className="py-3.5 px-4">
                        {isBeingViewed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Visualizando Agora
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveViewingUserId(u.id);
                              if (onNavigateToExpenses) {
                                onNavigateToExpenses();
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                            title={`Acessar e inspecionar a planilha de ${u.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Acessar Planilha</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit User */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar usuário e senha"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Spreadsheet (Zerar Planilha) */}
                          <button
                            onClick={() => setResetTarget(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Zerar dados da planilha deste usuário"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          {u.id !== 'user_master' && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR OU EDITAR USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser 
                      ? 'Atualize nome, login ou redefina a senha' 
                      : 'O usuário terá sua própria planilha zerada'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              {/* Nome Completo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Login / Usuário */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome de Usuário (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: carloseduardo"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    setFormError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                {!editingUser && username.trim() && users.some(u => u.username.toLowerCase() === username.trim().toLowerCase()) && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-2">
                    <span>
                      O login <strong>@{username.trim().toLowerCase()}</strong> já está cadastrado para <strong>{users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())?.name}</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
                        if (target) openEditModal(target);
                      }}
                      className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Editar Dados
                    </button>
                  </div>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Padrão sugerido: <strong>123</strong> ou crie uma senha personalizada.
                </p>
              </div>

              {/* Perfil */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'user'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Usuário Comum</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">
                      Planilha individual e isolada
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Administrador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">
                      Acesso ao painel master
                    </p>
                  </button>
                </div>
              </div>

              {/* Ativo / Inativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="userActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Usuário ativo (Permitir acesso ao sistema)
                </label>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO: EXCLUIR USUÁRIO */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Usuário</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir o usuário <strong>{deleteTarget.name}</strong> (@{deleteTarget.username})?
              Essa ação é irreversível.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isSubmitting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO: ZERAR PLANILHA */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zerar Planilha do Usuário</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja zerar todas as despesas, receitas, metas e cartões cadastrados pelo usuário <strong>{resetTarget.name}</strong>? A planilha voltará ao estado em branco (zerada).
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isSubmitting ? 'Zerando...' : 'Zerar Planilha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
