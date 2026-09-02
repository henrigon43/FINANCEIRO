import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-moradia', name: 'Moradia', icon: 'Home', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'cat-alimentacao', name: 'Alimentação', icon: 'Utensils', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte', icon: 'Car', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'cat-cartao', name: 'Cartão', icon: 'CreditCard', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-compras', name: 'Compras', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'cat-saude', name: 'Saúde', icon: 'HeartPulse', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'cat-lazer', name: 'Lazer', icon: 'Gamepad2', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'cat-assinaturas', name: 'Assinaturas', icon: 'Tv', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'cat-financiamentos', name: 'Financiamento', icon: 'Coins', color: '#EAB308', type: 'expense', isDefault: true },
  { id: 'cat-educacao', name: 'Educação', icon: 'GraduationCap', color: '#14B8A6', type: 'expense', isDefault: true },
  { id: 'cat-pets', name: 'Pets', icon: 'PawPrint', color: '#F59E0B', type: 'expense', isDefault: true },
  { id: 'cat-roupas', name: 'Roupas', icon: 'Shirt', color: '#A855F7', type: 'expense', isDefault: true },
  { id: 'cat-viagens', name: 'Viagens', icon: 'Plane', color: '#0EA5E9', type: 'expense', isDefault: true },
  { id: 'cat-contas', name: 'Contas', icon: 'Lightbulb', color: '#F43F5E', type: 'expense', isDefault: true },
  { id: 'cat-outros', name: 'Outros', icon: 'Package', color: '#64748B', type: 'expense', isDefault: true },

  // Income categories
  { id: 'cat-salario', name: 'Salário', icon: 'Briefcase', color: '#10B981', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', icon: 'Laptop', color: '#3B82F6', type: 'income', isDefault: true },
  { id: 'cat-investimentos', name: 'Investimentos', icon: 'TrendingUp', color: '#8B5CF6', type: 'income', isDefault: true },
  { id: 'cat-receita-outros', name: 'Outras Receitas', icon: 'DollarSign', color: '#14B8A6', type: 'income', isDefault: true },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  outros: 'Outros',
};
