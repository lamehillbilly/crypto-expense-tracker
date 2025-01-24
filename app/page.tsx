'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trade, Entry, TransactionType, ExpenseDetails } from '@/types';
import { ExpenseForm } from '@/components/ExpenseForm';
import { TradeForm } from '@/components/TradeForm';
import { PaginatedTable } from '@/components/PaginatedTable';
import { TaxSummary } from '@/components/TaxSummary';
import { ExpenseCategoryChart } from '@/components/ExpenseCategoryChart';
import { CategoryManager } from '@/components/CategoryManager';
import { DistributionOverview } from '@/components/DistributionOverview';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, PiggyBank, Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';

const TYPES: TransactionType[] = ['Expense', 'Trades', 'Income'];
const COLORS: string[] = ['#FF8042', '#00C49F', '#0088FE'];

const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [txn, setTxn] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetails>({ description: '', vendor: '' });
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showCharts, setShowCharts] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/entries');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        setEntries(data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedType || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entryData = {
      type: selectedType,
      amount: parseFloat(amount),
      date,
      txn: txn || null,
      expenseDetails: selectedType === 'Expense' ? expenseDetails : null,
    };

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [entryData] }),
      });

      if (!response.ok) throw new Error('Failed to save entry');

      const updatedEntries = await fetch('/api/entries').then(res => res.json());
      setEntries(updatedEntries);
      
      // Reset form
      setSelectedType('');
      setAmount('');
      setTxn('');
      setExpenseDetails({ description: '', vendor: '' });
      setShowNewEntry(false);
      toast.success('Entry added successfully');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setSelectedType(entry.type);
    setAmount(entry.amount.toString());
    setDate(entry.date);
    if (entry.txn) setTxn(entry.txn);
    if (entry.expenseDetails) setExpenseDetails(entry.expenseDetails);
  };

  const handleNewTrade = async (tokenName: string, amount: number) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName,
          amount,
          purchaseDate: new Date().toISOString(),
          status: 'open'
        }),
      });

      if (!response.ok) throw new Error('Failed to create trade');
      const newTrade = await response.json();
      setOpenTrades(prev => [...prev, newTrade]);
    } catch (error) {
      console.error('Error creating trade:', error);
    }
  };

  const handleCloseTrade = async (tradeId: number, closeAmount: number, originalAmount: number) => {
    const profit = closeAmount - originalAmount;
    
    if (profit > 0) {
      const taxAmount = profit * 0.30;
      alert(`Remember to set aside $${taxAmount.toFixed(2)} (30% of $${profit.toFixed(2)} profit) for taxes.`);
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closeAmount,
          closeDate: new Date().toISOString(),
          status: 'closed'
        }),
      });

      if (!response.ok) throw new Error('Failed to close trade');
      
      setOpenTrades(prev => prev.filter(t => t.id !== tradeId));
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete entry');
      
      // Remove entry from state
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const stats = useMemo(() => {
    const totalIncome = entries
      .filter(entry => entry.type === 'Income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entries
      .filter(entry => entry.type === 'Expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalClaims = entries
      .filter(entry => entry.type === 'Claims')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalTrades = entries
      .filter(entry => entry.type === 'Trades')
      .reduce((sum, entry) => sum + (entry.pnl || 0), 0);

    return { totalIncome, totalExpenses, totalClaims, totalTrades };
  }, [entries]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* New Entry Section */}
      <div className="bg-card rounded-lg">
        <button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">New Entry</h2>
          </div>
          {showNewEntry ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showNewEntry && (
          <div className="p-4 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Income</h3>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">${stats.totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-card rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <Receipt className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</p>
        </div>
        
        <div className="bg-card rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Claims</h3>
            <PiggyBank className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">${stats.totalClaims.toFixed(2)}</p>
        </div>
        
        <div className="bg-card rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Trading P/L</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">${stats.totalTrades.toFixed(2)}</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-card rounded-lg">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <h2 className="text-lg font-semibold">Analytics Overview</h2>
          {showCharts ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showCharts && (
          <div className="p-4 pt-0 grid gap-6 md:grid-cols-2">
            <ExpenseCategoryChart entries={entries} />
            <DistributionOverview
              data={[
                { name: 'Income', value: stats.totalIncome, color: '--chart-2' },
                { name: 'Expenses', value: stats.totalExpenses, color: '--chart-1' },
                { name: 'Claims', value: stats.totalClaims, color: '--chart-3' },
                { name: 'Trades', value: stats.totalTrades, color: '--chart-4' }
              ]}
            />
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-lg p-4">
        <PaginatedTable 
          entries={entries} 
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}

export default Dashboard;