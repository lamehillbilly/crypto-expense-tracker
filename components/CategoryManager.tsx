'use client';
import React, { useState, useEffect } from 'react';

export function CategoryManager() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });

      if (response.ok) {
        await loadCategories();
        setNewCategory('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleRemoveCategory = async (category: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category })
      });

      if (response.ok) {
        await loadCategories();
      }
    } catch (error) {
      console.error('Error removing category:', error);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddCategory} className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category"
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.map(category => (
          <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>{category}</span>
            <button
              onClick={() => handleRemoveCategory(category)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 