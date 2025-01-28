'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/DatePicker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";
import { CategoryBadge } from './CategoryBadge';
import { ScrollArea } from "@/components/ui/scroll-area";

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
  txn?: string | null;
  expenseDetails?: {
    category?: string;
    description?: string;
  } | null;
}

interface NewExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (formData: any) => Promise<void>;
  categories: Category[];
  editingEntry: ExpenseEntry | null;
}

export function NewExpenseDialog({ open, onClose, onSuccess, categories, editingEntry }: NewExpenseDialogProps) {
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [txn, setTxn] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setType(editingEntry.type);
      setAmount(editingEntry.amount.toString());
      setDate(editingEntry.date);
      setTxn(editingEntry.txn || '');
      
      if (editingEntry.expenseDetails) {
        setSelectedCategory(editingEntry.expenseDetails.category || '');
        setDescription(editingEntry.expenseDetails.description || '');
      }
    } else {
      resetForm();
    }
  }, [editingEntry]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (type === 'Expense' && !selectedCategory) {
      toast.error('Please select a category for expense');
      return;
    }

    const formData = {
      type,
      amount: Number(amount),
      date,
      txn: txn || null,
      details: {
        description,
        ...(type === 'Expense' ? {
          category: selectedCategory,
          vendor: '',
          taxDeductible: false,
          icon: '',
          color: '',
        } : {})
      }
    };

    setIsSubmitting(true);
    try {
      await onSuccess(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('Expense');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setTxn('');
    setSelectedCategory('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      resetForm();
      onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? `Edit ${type}` : `New ${type}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'Expense' | 'Income')}
                className="w-full p-2 mt-1 rounded-md border bg-background"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Preserve all decimal places from the input
                    setAmount(value);
                  }}
                  placeholder="0.000000"
                  step="0.00000001"  // Allow up to 6 decimal places
                  min="0"
                  required
                  className="pl-9"
                  // Allow any decimal input without rounding
                  onWheel={(e) => e.currentTarget.blur()} // Prevent mousewheel from changing value
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <div className="mt-1">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Transaction ID</label>
              <Input
                type="text"
                value={txn}
                onChange={(e) => setTxn(e.target.value)}
                placeholder="Optional"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>

            {type === 'Expense' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <ScrollArea className="h-32 w-full rounded-md">
                  <div className="flex flex-wrap gap-2 p-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className="focus:outline-none"
                      >
                        <CategoryBadge
                          name={cat.name}
                          icon={cat.icon}
                          color={cat.color}
                          className={`cursor-pointer transition-opacity hover:opacity-80 ${
                            selectedCategory === cat.name 
                              ? 'ring-2 ring-primary ring-offset-2' 
                              : 'opacity-60'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingEntry ? 'Update' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}