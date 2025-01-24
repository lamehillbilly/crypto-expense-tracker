// components/TradeForm.tsx
import React, { useState } from 'react';
import { Trade } from '@/types';

interface TradeFormProps {
  openTrades: Trade[];
  onNewTrade: (tokenName: string, amount: number) => void;
  onCloseTrade: (tradeId: number, closeAmount: number, originalAmount: number) => void;
}

export function TradeForm({ openTrades, onNewTrade, onCloseTrade }: TradeFormProps) {
  const [tradeAmount, setTradeAmount] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<number | ''>('');
  const [closeAmount, setCloseAmount] = useState('');

  const handleTradeSelection = (value: string) => {
    setSelectedTradeId(value === 'New Entry' ? '' : Number(value));
  };

  const calculateDaysHeld = (start: string): number => {
    const startDate = new Date(start);
    const endDate = new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTradeId === '') {
      if (tokenName && tradeAmount) {
        onNewTrade(tokenName, parseFloat(tradeAmount));
      }
    } else {
      const trade = openTrades.find(t => t.id === selectedTradeId);
      if (trade && closeAmount) {
        onCloseTrade(selectedTradeId, parseFloat(closeAmount), trade.amount);
      }
    }

    // Reset form
    setSelectedTradeId('');
    setTradeAmount('');
    setCloseAmount('');
    setTokenName('');
  };

  const selectedTrade = selectedTradeId ? openTrades.find(t => t.id === selectedTradeId) : null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="relative">
        <select
          value={selectedTradeId === '' ? 'new' : selectedTradeId.toString()}
          onChange={(e) => handleTradeSelection(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="new">New Entry</option>
          {openTrades.map(trade => (
            <option key={trade.id} value={trade.id.toString()}>
              {trade.tokenName} (Opened: {new Date(trade.purchaseDate).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedTradeId === '' ? (
        <>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Token Name"
            className="w-full p-2 border rounded"
            required
          />
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Purchase Amount"
              className="w-full p-2 pl-6 border rounded"
              required
              step="0.01"
            />
          </div>
        </>
      ) : selectedTrade ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="font-medium">Closing Trade: {selectedTrade.tokenName}</p>
            <p className="text-sm text-gray-600">
              Initial Purchase: ${selectedTrade.amount.toFixed(2)}
            </p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
            <input
              type="number"
              value={closeAmount}
              onChange={(e) => setCloseAmount(e.target.value)}
              placeholder="Selling Amount"
              className="w-full p-2 pl-6 border rounded"
              required
              step="0.01"
            />
          </div>
          {closeAmount && (
            <div className="p-4 rounded bg-gray-50">
              <p className={`font-medium ${
                Number(closeAmount) > selectedTrade.amount
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                Projected P/L: $
                {(parseFloat(closeAmount) - selectedTrade.amount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Days Held: {calculateDaysHeld(selectedTrade.purchaseDate)}
              </p>
            </div>
          )}
        </div>
      ) : null}

      <button
        type="submit"
        className={`px-4 py-2 rounded text-white ${
          selectedTradeId === '' 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-red-500 hover:bg-red-600'
        }`}
        disabled={
          (selectedTradeId === '' && (!tokenName || !tradeAmount)) ||
          (selectedTradeId !== '' && !closeAmount)
        }
      >
        {selectedTradeId === '' ? 'Open New Trade' : 'Close Trade'}
      </button>
    </form>
  );
}