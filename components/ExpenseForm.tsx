'use client';
import React, { useState, useEffect } from 'react';
import { ExpenseDetails } from '@/types';
import { CategoryManager } from './CategoryManager';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseFormProps {
  details: ExpenseDetails;
  onChange: (details: ExpenseDetails) => void;
}

export function ExpenseForm({ details, onChange }: ExpenseFormProps) {
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryChange = async () => {
    await fetchCategories();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Description
          </label>
          <input
            type="text"
            value={details.description || ''}
            onChange={(e) =>
              onChange({ ...details, description: e.target.value })
            }
            className="w-full p-2 rounded-md border bg-background text-foreground"
            placeholder="Enter description"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-muted-foreground">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showCategoryManager ? 'Hide' : 'Manage'} Categories
              {showCategoryManager ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          {showCategoryManager && (
            <div className="mb-4 p-4 bg-muted/50 rounded-md">
              <CategoryManager 
                onCategoryChange={handleCategoryChange}
                existingCategories={categories}
                onAddCategory={async (newCategory) => {
                  try {
                    const response = await fetch('/api/categories', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ category: newCategory }),
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to add category');
                    }

                    await handleCategoryChange();
                    toast.success('Category added successfully');
                    return true;
                  } catch (error) {
                    console.error('Error adding category:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to add category');
                    return false;
                  }
                }}
                onDeleteCategory={async (category) => {
                  try {
                    const response = await fetch(`/api/categories/${encodeURIComponent(category)}`, {
                      method: 'DELETE',
                    });

                    if (!response.ok) throw new Error('Failed to delete category');

                    await handleCategoryChange();
                    toast.success('Category deleted successfully');
                    return true;
                  } catch (error) {
                    console.error('Error deleting category:', error);
                    toast.error('Failed to delete category');
                    return false;
                  }
                }}
              />
            </div>
          )}
          <select
            value={details.category || ''}
            onChange={(e) =>
              onChange({ ...details, category: e.target.value })
            }
            className="w-full p-2 rounded-md border bg-background text-foreground disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}