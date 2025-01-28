'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/DatePicker';
import { toast } from 'sonner';
import { PaginatedTable } from '@/components/PaginatedTable';
import { NewExpenseDialog } from '@/components/NewExpenseDialog';
import { CategoryDialog } from '@/components/CategoryDialog';
import { ArrowDownRight, ArrowUpRight, DollarSign, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface ExpenseEntry {
  id: number;
  type: 'Expense' | 'Income';
  amount: number;
  date: string;
  txn?: string;
  expenseDetails?: {
    category: string;
    description?: string;
  };
}

export default function ExpensesPage() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [entriesRes, categoriesRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/categories')
      ]);
      
      if (!entriesRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [entriesData, categoriesData] = await Promise.all([
        entriesRes.json(),
        categoriesRes.json()
      ]);

      console.log('Fetched categories:', categoriesData);
      console.log('Fetched entries:', entriesData);

      setEntries(entriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalIncome = entries
      .filter(entry => entry.type === 'Income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entries
      .filter(entry => entry.type === 'Expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const monthlyExpenses = entries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const now = new Date();
        return entry.type === 'Expense' && 
               entryDate.getMonth() === now.getMonth() &&
               entryDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    return { 
      totalIncome, 
      totalExpenses, 
      netAmount: totalIncome - totalExpenses,
      monthlyExpenses
    };
  }, [entries]);

  const handleEdit = async (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setShowNewEntry(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      // Validate the form data
      if (!formData.type || !formData.amount || !formData.date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const endpoint = editingEntry 
        ? `/api/expenses/${editingEntry.id}`
        : '/api/expenses';
      
      const method = editingEntry ? 'PUT' : 'POST';

      console.log('Submitting data:', formData); // Debug log

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save entry');
      }

      await fetchData();
      setShowNewEntry(false);
      setEditingEntry(null);
      toast.success(`Entry ${editingEntry ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save entry');
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
          <Button onClick={() => setShowNewEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Income</h3>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">${stats.totalIncome.toFixed(2)}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Expenses</h3>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">${stats.monthlyExpenses.toFixed(2)}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Net Amount</h3>
            {stats.netAmount >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(stats.netAmount).toFixed(2)}
          </p>
        </Card>
      </div>

      {showNewEntry && (
        <NewExpenseDialog
          open={showNewEntry}
          onClose={() => {
            setShowNewEntry(false);
            setEditingEntry(null);
          }}
          onSuccess={handleSubmit}
          categories={categories}
          editingEntry={editingEntry}
        />
      )}

      {showCategoryDialog && (
        <CategoryDialog
          open={showCategoryDialog}
          onClose={() => setShowCategoryDialog(false)}
          onSuccess={() => {
            fetchData();
          }}
          categories={categories}
        />
      )}

      <div className="mt-6">
        <PaginatedTable 
          entries={entries}
          onDelete={async (id) => {
            try {
              await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
              fetchData();
              toast.success('Entry deleted successfully');
            } catch (error) {
              toast.error('Failed to delete entry');
            }
          }}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}