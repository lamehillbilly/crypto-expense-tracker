'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Entry, TransactionType, ExpenseDetails } from '@/types';
import { PaginatedTable } from '@/components/PaginatedTable';
import { ExpenseCategoryChart } from '@/components/ExpenseCategoryChart';
import { DistributionOverview } from '@/components/DistributionOverview';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, PiggyBank, Receipt, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { NewEntryDialog } from '@/components/NewEntryDialog';

interface Trade {
  id?: number;
  tokenId: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImage?: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  currentPrice?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  status: 'open' | 'closed';
}

const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [txn, setTxn] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetails>({ 
    description: '', 
    vendor: '', 
    taxDeductible: false,
    color: '',
    icon: ''
  });
  const [showCharts, setShowCharts] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showTaxDeductible, setShowTaxDeductible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch entries
        const entriesResponse = await fetch('/api/entries');
        if (!entriesResponse.ok) throw new Error('Failed to load entries');
        const entriesData = await entriesResponse.json();

        // Fetch trades
        const tradesResponse = await fetch('/api/trades');
        if (!tradesResponse.ok) throw new Error('Failed to load trades');
        const tradesData = await tradesResponse.json();
        setTrades(tradesData.trades);

        // When combining entries, ensure regular entries have unique IDs
        const regularEntries = entriesData.map((entry: any) => ({
          ...entry,
          id: `entry-${entry.id}`
        }));

        setEntries(regularEntries);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load some data');
      }
    };

    loadData();
  }, []);
  
  

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setShowNewEntry(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedType || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entryData = {
      ...(editingEntry?.id ? { id: editingEntry.id } : {}),
      type: selectedType,
      amount: parseFloat(amount),
      date,
      txn: txn || null,
      details: {
        description: expenseDetails.description,
        ...(selectedType === 'Expense' ? {
          category: expenseDetails.category,
          vendor: expenseDetails.vendor,
          taxDeductible: expenseDetails.taxDeductible,
          icon: expenseDetails.icon,
          color: expenseDetails.color,
        } : {})
      }
    };

    try {
      const response = await fetch('/api/entries', {
        method: editingEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [entryData] }),
      });

      if (!response.ok) throw new Error('Failed to save entry');

      const updatedEntries = await fetch('/api/entries').then(res => res.json());
      setEntries(updatedEntries);
      
      // Reset form
      setEditingEntry(null);
      setSelectedType('');
      setAmount('');
      setTxn('');
      setExpenseDetails({ description: '', vendor: '', taxDeductible: false, color: '', icon: '' });
      setShowNewEntry(false);
      toast.success(`Entry ${editingEntry ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(`Failed to ${editingEntry ? 'update' : 'save'} entry`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Extract the numeric ID from the prefixed string
      const numericId = parseInt(id.split('-')[1]);
      const response = await fetch(`/api/entries/${numericId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete entry');
      
      // Remove entry from state using the full ID string
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

    // Calculate total realized P/L from trades
    const totalTrades = trades
      .reduce((sum, trade) => sum + (trade.realizedPnl || 0), 0);

    return { totalIncome, totalExpenses, totalClaims, totalTrades };
  }, [entries, trades]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (showTaxDeductible && entry.type === 'Expense') {
        return entry.expenseDetails?.taxDeductible;
      }
      return true;
    });
  }, [entries, showTaxDeductible]);

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your expenses and trades</p>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      <NewEntryDialog
        open={showNewEntry}
        onClose={() => {
          setShowNewEntry(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        amount={amount}
        setAmount={setAmount}
        txn={txn}
        setTxn={setTxn}
        date={date}
        setDate={setDate}
        expenseDetails={expenseDetails}
        setExpenseDetails={setExpenseDetails}
        editingEntry={editingEntry}
      />

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
          <p className={`text-2xl font-bold ${stats.totalTrades >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(stats.totalTrades).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {stats.totalTrades >= 0 ? (
              <ArrowUpRight className="inline h-4 w-4 ml-1" />
            ) : (
              <ArrowDownRight className="inline h-4 w-4 ml-1" />
            )}
          </p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-card rounded-lg pt-10">
        
          <h2 className="text-lg font-semibold pb-4">Analytics Overview</h2>
          

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
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTaxDeductible}
            onChange={(e) => setShowTaxDeductible(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">
            Show Tax Deductible Only
          </span>
        </label>
      </div>

      <PaginatedTable 
        entries={filteredEntries} 
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default Dashboard;