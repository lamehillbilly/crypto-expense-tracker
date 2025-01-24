// app/claims/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TokenSelect } from '@/components/TokenSelect';
import ClaimsChart from '@/components/ClaimsChart';
import { useTokens } from '@/hooks/useTokens';
import { Token, Entry, Claim } from '@/types';
import { ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ClaimsList } from '@/components/ClaimsList';
import { ClaimsStats } from '@/components/ClaimsStats';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClaimEntry {
  tokenId: string;
  tokenSymbol: string;
  amount: number;
  txn?: string;  // Adding optional transaction URL
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
  const [txn, setTxn] = useState<string>('');
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);

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
    
    // Show loading toast
    const loadingToast = toast.loading('Submitting claim...');
    
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          tokenDetails: claimEntries,
          totalAmount,
          heldForTaxes,
          taxAmount: heldForTaxes ? taxAmount : undefined,
          txn: txn || undefined
        }),
      });

      if (!response.ok) throw new Error('Failed to submit claim');
      
      // Refresh claims data after successful submission
      const refreshResponse = await fetch('/api/claims');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setClaims(data);
      }

      // Reset form
      setClaimEntries([]);
      setTotalAmount(0);
      setHeldForTaxes(false);
      setTaxAmount(0);
      setDate(getLocalDateString());
      setTxn('');
      setIsNewClaimOpen(false);

      // Show success toast
      toast.success('Claim submitted successfully!', {
        id: loadingToast,
        description: `Total amount: $${totalAmount.toFixed(2)}`,
      });
      
    } catch (error) {
      console.error('Error submitting claim:', error);
      // Show error toast
      toast.error('Failed to submit claim', {
        id: loadingToast,
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };
  return (
    <div className="min-h-screen bg-background p-6 ">
      <div className="max-w-7xl mx-auto space-y-6 ">
        <ClaimsStats claims={claims} />
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-card-foreground">Claims Overview</h2>
          <Button 
            onClick={() => setIsNewClaimOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex justify-end items-center mb-4 ">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
              className="p-2 border rounded bg-background text-foreground"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="h-96">
            <ClaimsChart 
              data={claims}
              timeframe={timeframe}
            />
          </div>
        </div>
        <Dialog open={isNewClaimOpen} onOpenChange={setIsNewClaimOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Claim Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
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
                          className="w-full p-2 pl-6 border rounded bg-background text-foreground"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <TokenSelect
                  tokens={tokens}
                  selectedTokens={selectedTokens.map(t => t.id)}
                  onTokensChange={(token: Token) => {
                    if (!selectedTokens.find(t => t.id === token.id)) {
                      setSelectedTokens([...selectedTokens, token]); 
                    }
                  }}
                />
              </div>
              {/* Transaction URL field */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Transaction URL (optional)
                </label>
                <div className="relative">
                  {txn && (
                    <a
                      href={txn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-2.5 text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <input
                    type="url"
                    value={txn}
                    onChange={(e) => setTxn(e.target.value)}
                    placeholder="Transaction URL"
                    className="w-full p-2 border rounded bg-background text-foreground pr-10"
                  />
                </div>
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
                  <label htmlFor="heldForTaxes" className="text-foreground">Hold amount for taxes</label>
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
                      className="w-full p-2 pl-6 border rounded bg-background text-foreground"
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

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsNewClaimOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Claim
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <ClaimsList 
          claims={claims.map(claim => ({
            ...claim,
            id: String(claim.id)
          })) as Claim[]}
          onClaimUpdate={() => {
            fetch('/api/claims')
              .then(response => response.json())
              .then(data => setClaims(data))
              .catch(error => console.error('Error fetching claims:', error));
          }} 
        />
      </div>
    </div>
  );
}