import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseDetails, TransactionType, Entry } from '@/types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface NewEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  selectedType: TransactionType | '';
  setSelectedType: (type: TransactionType | '') => void;
  amount: string;
  setAmount: (amount: string) => void;
  txn: string;
  setTxn: (txn: string) => void;
  date: string;
  setDate: (date: string) => void;
  expenseDetails: ExpenseDetails;
  setExpenseDetails: (details: ExpenseDetails) => void;
  editingEntry: Entry | null;
}

export function NewEntryDialog({
  open,
  onClose,
  onSubmit,
  selectedType,
  setSelectedType,
  amount,
  setAmount,
  txn,
  setTxn,
  date,
  setDate,
  expenseDetails,
  setExpenseDetails,
  editingEntry
}: NewEntryDialogProps) {
  const TYPES: TransactionType[] = ['Expense', 'Trades', 'Income'];

  useEffect(() => {
    if (editingEntry) {
      setSelectedType(editingEntry.type);
      setAmount(editingEntry.amount.toString());
      setDate(editingEntry.date);
      setTxn(editingEntry.txn || '');
      if (editingEntry.details) {
        setExpenseDetails({
          description: editingEntry.details.description || '',
          category: editingEntry.details.category || '',
          vendor: editingEntry.details.vendor || '',
          taxDeductible: editingEntry.details.taxDeductible || false,
          icon: editingEntry.details.icon || '',
          color: editingEntry.details.color || '',
        });
      }
    }
  }, [editingEntry]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? 'Edit Entry' : 'New Entry'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType)}
                className="w-full p-2 rounded-md border bg-background text-foreground"
                required
              >
                <option value="">Select type</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-foreground"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                value={txn}
                onChange={(e) => setTxn(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-foreground"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={expenseDetails.description}
              onChange={(e) => setExpenseDetails(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="Enter description"
            />
          </div>

          {selectedType === 'Expense' && (
            <ExpenseForm
              details={expenseDetails}
              onChange={setExpenseDetails}
            />
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <Button type="submit">
              {editingEntry ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 