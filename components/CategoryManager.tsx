'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerProps {
  onCategoryChange?: () => void;
  existingCategories: string[];
  onAddCategory: (category: string) => Promise<boolean>;
  onDeleteCategory: (category: string) => Promise<boolean>;
}

export function CategoryManager({ 
  existingCategories, 
  onAddCategory,
  onDeleteCategory 
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log('Submitting new category:', newCategory);
    
    if (!newCategory.trim() || isLoading) {
      console.log('Invalid submission:', { newCategory, isLoading });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling onAddCategory with:', newCategory.trim());
      const success = await onAddCategory(newCategory.trim());
      console.log('Add category result:', success);
      
      if (success) {
        setNewCategory('');
        toast.success('Category added successfully');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-3 py-1 text-sm border rounded-md bg-background text-foreground"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSubmit()}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isLoading || !newCategory.trim()}
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {existingCategories.map((category) => (
          <div
            key={category}
            className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 transition-colors"
          >
            <span>{category}</span>
            <button
              type="button"
              onClick={() => onDeleteCategory(category)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
              aria-label={`Delete ${category} category`}
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