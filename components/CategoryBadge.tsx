// components/CategoryBadge.tsx
import React from 'react';
import { 
  ShoppingCart, Home, Car, Utensils, Plane, 
  Heart, Book, Coffee, Gamepad, Music,
  Shirt, Wrench, Dumbbell, Bus, Gift
} from 'lucide-react';

export const categoryIcons: Record<string, any> = {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Plane,
  Heart,
  Book,
  Coffee,
  Gamepad,
  Music,
  Shirt,
  Wrench,
  Dumbbell,
  Bus,
  Gift,
};

interface CategoryBadgeProps {
  name: string;
  icon?: string;
  color?: string;
  onDelete?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ 
  name, 
  icon, 
  color, 
  onDelete,
  className = '',
  size = 'md'
}: CategoryBadgeProps) {
  const IconComponent = icon ? categoryIcons[icon] : ShoppingCart;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full border
        ${color || 'bg-gray-100 text-gray-700 border-gray-200'}
        ${sizeClasses} ${className}
      `}
    >
      {IconComponent && <IconComponent className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />}
      {name}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <svg className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}