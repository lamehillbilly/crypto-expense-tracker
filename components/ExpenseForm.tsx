'use client';
import React, { useState, useEffect } from 'react';
import { ExpenseDetails } from '@/types';

interface ExpenseFormProps {
  details: ExpenseDetails;
  onChange: (details: ExpenseDetails) => void;
}

export function ExpenseForm({ details, onChange }: ExpenseFormProps) {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
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

    loadCategories();
  }, []);

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={details.description}
        onChange={(e) => onChange({ ...details, description: e.target.value })}
        placeholder="Description"
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="text"
        value={details.vendor}
        onChange={(e) => onChange({ ...details, vendor: e.target.value })}
        placeholder="Vendor"
        className="w-full p-2 border rounded"
      />

      <select
        value={details.category || ''}
        onChange={(e) => onChange({ ...details, category: e.target.value })}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Category</option>
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}