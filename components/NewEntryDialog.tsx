import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseDetails, TransactionType } from '@/types';

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
}: NewEntryDialogProps) {
  const TYPES: TransactionType[] = ['Expense', 'Trades', 'Income'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Entry</DialogTitle>
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
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Add Entry
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 