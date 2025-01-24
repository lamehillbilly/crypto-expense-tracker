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
    
    if (!selectedType || !amount) return;

    const entryData = {
      type: selectedType,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      txn: txn || null,
      expenseDetails: selectedType === 'Expense' ? expenseDetails : null,
      purchaseAmount: 0,
      purchaseDate: new Date().toISOString(),
      status: 'open'
    };

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [entryData] }),
      });

      if (!response.ok) throw new Error('Failed to save entry');

      // Refresh entries after successful save
      const entriesResponse = await fetch('/api/entries');
      if (entriesResponse.ok) {
        const data = await entriesResponse.json();
        setEntries(data);
      }

      // Reset form
      setSelectedType('');
      setAmount('');
      setTxn('');
      setExpenseDetails({ description: '', vendor: '' });
    } catch (error) {
      console.error('Error saving entry:', error);
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

  const calculateNetIncome = useMemo(() => {
    const totalIncome = entries
      .filter(entry => entry.type === 'Income' || entry.type === 'Claims')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entries
      .filter(entry => entry.type === 'Expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return totalIncome - totalExpenses;
  }, [entries]);

  const getPieData = useMemo(() => {
    return TYPES.map(type => ({
      name: type,
      value: entries
        .filter(entry => entry.type === type)
        .reduce((sum, entry) => sum + entry.amount, 0)
    })).filter(item => item.value !== 0);
  }, [entries]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Crypto Expense Tracker
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Claims</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                ${entries.reduce((sum, entry) => 
                  entry.type === 'Claims' ? sum + entry.amount : sum, 0
                ).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">
                ${entries.reduce((sum, entry) => 
                  entry.type === 'Expense' ? sum + entry.amount : sum, 0
                ).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Net Trading P/L</h3>
              <p className="mt-2 text-3xl font-bold" 
                 style={{ color: entries.reduce((sum, entry) => 
                   entry.type === 'Trades' && entry.pnl ? sum + entry.pnl : sum, 0) >= 0 
                   ? '#16a34a' : '#dc2626' }}>
                ${entries.reduce((sum, entry) => 
                  entry.type === 'Trades' && entry.pnl ? sum + entry.pnl : sum, 0
                ).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Net Income Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* Icon for net income - you can use any icon you prefer */}
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Net Income
                    </dt>
                    <dd className={`text-lg font-medium ${calculateNetIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${calculateNetIncome.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Summary */}
          <TaxSummary entries={entries} />

          {/* Charts Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Distribution Overview</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name}: $${Math.abs(Number(entry.value)).toFixed(2)}`}
                  >
                    {getPieData.map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Math.abs(Number(value)).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Categories Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Expense Categories</h2>
            <div className="h-96">
              <ExpenseCategoryChart entries={entries} />
            </div>
          </div>

          {/* Category Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <CategoryManager />
          </div>

          {/* New Entry Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as TransactionType)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Type</option>
                  {TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Conditional Forms */}
              {selectedType === 'Trades' && (
                <TradeForm
                  openTrades={openTrades}
                  onNewTrade={handleNewTrade}
                  onCloseTrade={handleCloseTrade}
                />
              )}

              {selectedType === 'Expense' && (
                <ExpenseForm
                  details={expenseDetails}
                  onChange={setExpenseDetails}
                />
              )}

              {/* Common Fields */}
              {selectedType && selectedType !== 'Trades' && (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-2">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full p-2 pl-6 border rounded"
                      required
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="url"
                      value={txn}
                      onChange={(e) => setTxn(e.target.value)}
                      placeholder="Transaction URL (optional)"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}

              {selectedType && (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </button>
                  {editingEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(null);
                        setSelectedType('');
                        setAmount('');
                        setTxn('');
                        setExpenseDetails({ description: '', vendor: '' });
                      }}
                      className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Entries Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Recent Entries</h2>
            <PaginatedTable 
              entries={entries.slice().reverse()} 
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;