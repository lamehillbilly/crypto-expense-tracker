'use client'
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trade, Entry, TransactionType, ExpenseDetails, ClaimDetails } from '../types';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ClaimForm } from '@/components/ClaimForm';
import { TradeForm } from '@/components/TradeForm';
import { PaginatedTable } from '@/components/PaginatedTable';
import { TaxSummary } from '@/components/TaxSummary';

const TYPES: TransactionType[] = ['Expense', 'Held for Taxes', 'Trades', 'Income', 'Claims'];
const COLORS: string[] = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

// If using API routes for data persistence
const saveToJSON = async (entries: Entry[], trades: Trade[]) => {
  try {
    await fetch('/api/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries, trades }),
    });
  } catch (error) {
    console.error('Error saving data:', error);
  }
};


const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [txn, setTxn] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [tokenName, setTokenName] = useState<string>('');
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetails>({ description: '' });
  const [claimDetails, setClaimDetails] = useState<ClaimDetails>({
    totalAmount: 0,
    tokenTags: [],  // This will be Token[]
    heldForTaxes: false,
    taxPercentage: undefined,
    taxAmount: undefined
  });

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const response = await fetch('/api/load-data');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        const data = await response.json();
        setEntries(data.entries || []);
        setOpenTrades(data.trades || []);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage
        const savedEntries = localStorage.getItem('entries');
        const savedTrades = localStorage.getItem('openTrades');
        if (savedEntries) setEntries(JSON.parse(savedEntries));
        if (savedTrades) setOpenTrades(JSON.parse(savedTrades));
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let newEntry: Entry = {
      id: Date.now(),
      type: selectedType as TransactionType,
      amount: parseFloat(amount),
      date,
      txn: selectedType !== 'Income' && selectedType !== 'Trades' ? txn : undefined,
      purchaseAmount: 0,
      purchaseDate: '',
      status: 'open'
    };

    if (selectedType === 'Expense') {
      newEntry.expenseDetails = expenseDetails;
    } else if (selectedType === 'Claims') {
      newEntry.claimDetails = claimDetails;
    } else if (selectedType === 'Trades') {
      if (selectedTrade === 'New Entry') {
        const newTrade: Trade = {
          tokenName,
          purchaseAmount: parseFloat(amount),
          purchaseDate: date,
          status: 'open',
          id: Date.now()
        };
        setOpenTrades(prev => [...prev, newTrade]);
        await saveToJSON(entries, [...openTrades, newTrade]);
      } else {
        const trade = openTrades.find(t => t.tokenName === selectedTrade);
        if (trade) {
          const updatedTrades = openTrades.filter(t => t.tokenName !== selectedTrade);
          const closedTrade: Trade = {
            ...trade,
            status: 'closed',
            closeAmount: parseFloat(amount),
            closeDate: date,
            pnl: parseFloat(amount) - trade.purchaseAmount
          };
          newEntry = {
            ...newEntry,
            tokenName: trade.tokenName,
            pnl: closedTrade.pnl
          };
          setOpenTrades(updatedTrades);
          await saveToJSON([...entries, newEntry], updatedTrades);
        }
      }
    }

    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    await saveToJSON(newEntries, openTrades);

    // Reset form
    setSelectedType('');
    setAmount('');
    setTxn('');
    setTokenName('');
    setSelectedTrade('');
    setExpenseDetails({ description: '' });
    setClaimDetails({
      totalAmount: 0,
      tokenTags: [],  // This will be Token[]
      heldForTaxes: false,
      taxPercentage: undefined,
      taxAmount: undefined
    });
  };

  const getPieData = () => {
    const data = TYPES.map(type => ({
      name: type,
      value: entries
        .filter(entry => entry.type === type)
        .reduce((sum, entry) => {
          // For trades, use PnL value if it exists
          if (entry.type === 'Trades' && entry.pnl !== undefined) {
            return sum + entry.pnl;
          }
          return sum + entry.amount;
        }, 0)
    }));
    return data.filter(item => item.value !== 0);
  };
  const handleNewTrade = (tokenName: string, amount: number) => {
    const newTrade: Trade = {
      id: Date.now(),
      tokenName,
      purchaseAmount: amount,
      purchaseDate: date,
      status: 'open'
    };

    setOpenTrades(prev => [...prev, newTrade]);
    saveToJSON(entries, [...openTrades, newTrade]);
    
    // Reset form
    setSelectedType('');
    setAmount('');
  };

  const handleCloseTrade = (trade: Trade, closeAmount: number) => {
    const updatedTrades = openTrades.filter(t => t.id !== trade.id);
    
    const closedTrade: Entry = {
      id: Date.now(),
      type: 'Trades',
      amount: closeAmount,
      date,
      tokenName: trade.tokenName,
      pnl: closeAmount - trade.purchaseAmount,
      purchaseAmount: 0,
      purchaseDate: '',
      status: 'open'
    };

    setOpenTrades(updatedTrades);
    setEntries(prev => [...prev, closedTrade]);
    saveToJSON([...entries, closedTrade], updatedTrades);
    
    // Reset form
    setSelectedType('');
    setAmount('');
  };

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

          {/* Tax Summary */}
          <TaxSummary entries={entries} />

          {/* Charts Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Distribution Overview</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Math.abs(Number(value)).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Entry Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Add New Entry</h2>
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

              {selectedType === 'Claims' && (
                <ClaimForm
                  details={claimDetails}
                  onChange={setClaimDetails}
                  onAmountChange={(totalValue) => setAmount(totalValue.toString())}
                />
              )}

              {/* Common Fields */}
              {selectedType && selectedType !== 'Trades' && selectedType !== 'Claims' && (
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
                </>
              )}

              {selectedType && selectedType !== 'Trades' && (
                <div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              )}

              {selectedType && (
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Entry
                </button>
              )}
            </form>
          </div>

          {/* Entries Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Recent Entries</h2>
            <PaginatedTable entries={entries.slice().reverse()} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;