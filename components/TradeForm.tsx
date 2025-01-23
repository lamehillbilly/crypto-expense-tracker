// components/TradeForm.tsx
import React, { useState } from 'react';
import { Trade } from '@/types';

interface TradeFormProps {
  openTrades: Trade[];
  onNewTrade: (tokenName: string, amount: number, openDate: string) => void;
  onCloseTrade: (trade: Trade, closeAmount: number, closeDate: string) => void;
}

export const TradeForm: React.FC<TradeFormProps> = ({
  openTrades,
  onNewTrade,
  onCloseTrade,
}) => {
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [tokenName, setTokenName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [openDate, setOpenDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [closeDate, setCloseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isClosingTrade, setIsClosingTrade] = useState<boolean>(false);

  const handleTradeSelection = (value: string) => {
    setSelectedTrade(value);
    if (value !== 'New Entry') {
      setIsClosingTrade(true);
      const trade = openTrades.find(t => t.tokenName === value);
      if (trade) {
        setOpenDate(trade.purchaseDate);
      }
    } else {
      setIsClosingTrade(false);
      setTokenName('');
      setAmount('');
      setOpenDate(new Date().toISOString().split('T')[0]);
    }
  };

  const calculateDaysHeld = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = () => {
    if (selectedTrade === 'New Entry') {
      onNewTrade(tokenName, parseFloat(amount), openDate);
    } else {
      const trade = openTrades.find(t => t.tokenName === selectedTrade);
      if (trade) {
        onCloseTrade(trade, parseFloat(amount), closeDate);
      }
    }

    // Reset form
    setSelectedTrade('');
    setTokenName('');
    setAmount('');
    setIsClosingTrade(false);
    setOpenDate(new Date().toISOString().split('T')[0]);
    setCloseDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="relative">
        <select
          value={selectedTrade}
          onChange={(e) => handleTradeSelection(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Trade</option>
          <option value="New Entry">New Entry</option>
          {openTrades.map(trade => (
            <option key={trade.id} value={trade.tokenName}>
              {trade.tokenName} (Opened: {new Date(trade.purchaseDate).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedTrade === 'New Entry' ? (
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Purchase Amount"
              className="w-full p-2 pl-6 border rounded"
              required
              step="0.01"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Open Position Date
            </label>
            <input
              type="date"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </>
      ) : isClosingTrade && selectedTrade ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="font-medium">Closing Trade: {selectedTrade}</p>
            <p className="text-sm text-gray-600">
              Initial Purchase: ${openTrades.find(t => t.tokenName === selectedTrade)?.purchaseAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Open Date: {new Date(openDate).toLocaleDateString()}
            </p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Selling Amount"
              className="w-full p-2 pl-6 border rounded"
              required
              step="0.01"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Position Date
            </label>
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {amount && (
            <div className="p-4 rounded bg-gray-50">
              <p className={`font-medium ${
                parseFloat(amount) > (openTrades.find(t => t.tokenName === selectedTrade)?.purchaseAmount || 0)
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                Projected P/L: $
                {(parseFloat(amount) - (openTrades.find(t => t.tokenName === selectedTrade)?.purchaseAmount || 0)).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Days Held: {calculateDaysHeld(openDate, closeDate)}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {(selectedTrade === 'New Entry' || isClosingTrade) && amount && (
        <button
          type="button"
          onClick={handleSubmit}
          className={`px-4 py-2 rounded text-white ${
            isClosingTrade ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isClosingTrade ? 'Close Trade' : 'Open New Trade'}
        </button>
      )}
    </div>
  );
};