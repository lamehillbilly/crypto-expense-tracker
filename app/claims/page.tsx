// app/claims/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TokenSelect } from '@/components/TokenSelect';
import ClaimsChart from '@/components/ClaimsChart';
import { useTokens } from '@/hooks/useTokens';
import { Token, Entry } from '@/types';

interface ClaimEntry {
  tokenId: string;
  tokenSymbol: string;
  amount: number;
}


const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export default function ClaimsPage() {
  const { tokens } = useTokens();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [claimEntries, setClaimEntries] = useState<ClaimEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(getLocalDateString());
  const [heldForTaxes, setHeldForTaxes] = useState<boolean>(false);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [claims, setClaims] = useState<Entry[]>([]);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const response = await fetch('/api/claims');
        if (!response.ok) throw new Error('Failed to fetch claims');
        const data = await response.json();
        console.log('Fetched claims data:', data); // Debug log
        setClaims(data);
      } catch (error) {
        console.error('Error fetching claims:', error);
      }
    };
    fetchClaims();
  }, []);

  const handleTokenAmountChange = (tokenId: string, amount: number) => {
    setClaimEntries(prev => {
      const newEntries = prev.filter(entry => entry.tokenId !== tokenId);
      if (amount > 0) {
        const token = tokens.find(t => t.id === tokenId);
        if (token) {
          newEntries.push({
            tokenId,
            tokenSymbol: token.symbol,
            amount
          });
        }
      }
      return newEntries;
    });

    // Update total amount
    const newTotal = claimEntries.reduce((sum, entry) => sum + entry.amount, 0);
    setTotalAmount(newTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date,
          tokenDetails: claimEntries,
          totalAmount,
          heldForTaxes,
          taxAmount: heldForTaxes ? taxAmount : undefined
        }),
      });
      if (!response.ok) throw new Error('Failed to submit claim');
      // Handle successful response
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Claims Overview</h2>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
              className="p-2 border rounded"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="h-96">
            <ClaimsChart 
              data={claims.map(entry => ({
                total: entry.amount,
                claims: entry.claimDetails?.tokenClaims || [],
                date: entry.date,
                tokens: (entry.claimDetails?.tokenClaims || []).reduce((acc, claim) => ({
                  ...acc,
                  [claim.tokenSymbol]: claim.amount
                }), {} as Record<string, number>)
              }))}
              timeframe={timeframe}
            />
          </div>
        </div>

        {/* New Claim Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold mb-4">New Claim Entry</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
            </label>
            <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
            />
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tokens
            </label>
            <div className="space-y-2">
              {selectedTokens.map(token => (
                <div key={token.id} className="flex items-center space-x-2">
                  <span className="w-24">{token.symbol}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      onChange={(e) => handleTokenAmountChange(token.id, parseFloat(e.target.value))}
                      className="w-full p-2 pl-6 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            <TokenSelect
              tokens={tokens}
              selectedTokens={selectedTokens}
              onTokensChange={setSelectedTokens}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="heldForTaxes"
                checked={heldForTaxes}
                onChange={(e) => setHeldForTaxes(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="heldForTaxes">Hold amount for taxes</label>
            </div>
            
            {heldForTaxes && (
              <div className="mt-2 relative">
                <span className="absolute left-3 top-2">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value))}
                  className="w-full p-2 pl-6 border rounded"
                  placeholder="Tax amount to hold"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="text-right text-lg font-bold">
              Total: ${totalAmount.toFixed(2)}
            </div>
            {heldForTaxes && (
              <div className="text-right text-sm text-gray-600">
                Net after tax hold: ${(totalAmount - taxAmount).toFixed(2)}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit Claim
          </button>
        </form>
      </div>
    </div>
  );
}