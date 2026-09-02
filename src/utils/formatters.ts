export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  // Cleans everything except digits
  const clean = value.replace(/\D/g, '');
  if (!clean) return 0;
  return parseFloat(clean) / 100;
};

export const MONTH_NAMES_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_NAMES_SHORT_BR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatDateShortBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

export const getMonthYearLabel = (year: number, month: number): string => {
  return `${MONTH_NAMES_BR[month]} ${year}`;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const toDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseDateSafe = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const isSameMonthYear = (dateStr: string, year: number, month: number): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 2) return false;
  return Number(parts[0]) === year && Number(parts[1]) - 1 === month;
};

export const getDaysDifference = (targetDateStr: string, baseDate: Date = new Date()): number => {
  const target = parseDateSafe(targetDateStr);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffTime = target.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isDateOverdue = (dueDateStr: string, baseDate: Date = new Date()): boolean => {
  const diff = getDaysDifference(dueDateStr, baseDate);
  return diff < 0;
};
