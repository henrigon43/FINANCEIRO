import React from 'react';
import {
  Home,
  Utensils,
  Car,
  CreditCard,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  Tv,
  Coins,
  GraduationCap,
  PawPrint,
  Shirt,
  Plane,
  Lightbulb,
  Package,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Tag,
  Circle
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Utensils,
  Car,
  CreditCard,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  Tv,
  Coins,
  GraduationCap,
  PawPrint,
  Shirt,
  Plane,
  Lightbulb,
  Package,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Tag,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', color }) => {
  const IconComponent = ICON_MAP[name] || Circle;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
