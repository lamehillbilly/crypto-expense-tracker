'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CategoryManagerProps {
  categories: { id: string; name: string; }[];
  onCategoriesChange: () => Promise<void>;
  onAddCategory: (category: string) => Promise<boolean>;
  onDeleteCategory: (category: string) => Promise<void>;
  onCategoryAdded: () => void;
}

export function CategoryManager({ 
  categories,
  onCategoriesChange,
  onAddCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const success = await onAddCategory(newCategory);
      if (success) {
        setNewCategory('');
        onCategoriesChange();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded-md bg-background"
          placeholder="New category"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCategory();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isLoading || !newCategory.trim()}
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors"
          >
            <span>{category.name}</span>
            <button
              onClick={() => onDeleteCategory(category.name)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
              aria-label={`Delete ${category.name} category`}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 