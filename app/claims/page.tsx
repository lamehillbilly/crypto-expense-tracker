// app/claims/page.tsx
'use client';
import EnhancedClaimsStats from '@/components/StatsCards';
import React, { useState, useEffect, useCallback } from 'react';
import { TokenSelect } from '@/components/TokenSelect';
import ClaimsChart from '@/components/ClaimsChart';
import { useTokens } from '@/hooks/useTokens';
import { Token, Entry, Claim } from '@/types';
import { ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ClaimsList } from '@/components/ClaimsList';
import { ClaimsStats } from '@/components/ClaimsStats';
import { Button } from '@/components/ui/button';
import TabbedClaimsChart from '@/components/ClaimsChart';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  DollarSign, 
  LinkIcon, 
  X 
} from "lucide-react";
import { getAddress } from 'ethers'
import TokenLogo from '@/components/TokenLogo';
import { DatePicker } from '@/components/DatePicker';



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
interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
}


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
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});
  
  
  
  
  
  
  // Add this near the top of ClaimsPage component
  const refreshClaims = useCallback(async () => {
    try {
      const response = await fetch('/api/claims');
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      setClaims(data);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load claims');
    }
  }, []);

   // Empty dependency array means this runs once on mount
   useEffect(() => {
    refreshClaims();
  }, [refreshClaims]);
  // Load token metadata when tokens are selected
  useEffect(() => {
    const fetchTokenMetadata = async () => {
      if (selectedTokens.length === 0) return;
      
      try {
        const response = await fetch('https://pharaoh-api-production.up.railway.app/tokens');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tokens: TokenMetadata[] = await response.json();
        
        const tokenMap: Record<string, TokenMetadata> = {};
        tokens.forEach(token => {
          if (token.symbol && token.id) {
            tokenMap[token.symbol] = token;
          }
        });

        setTokenMetadata(tokenMap);
      } catch (error) {
        console.error('Error fetching token metadata:', error);
      }
    };

    fetchTokenMetadata();
  }, [selectedTokens]);

  const handleTokenAmountChange = (tokenId: string, amount: string) => {
    setClaimEntries(prev => {
      const newEntries = prev.filter(entry => entry.tokenId !== tokenId);
      // Convert to number but maintain precision
      const numericAmount = parseFloat(amount);
      
      if (!isNaN(numericAmount) && numericAmount >= 0) {
        const token = tokens.find(t => t.id === tokenId);
        if (token) {
          newEntries.push({
            tokenId,
            tokenSymbol: token.symbol,
            amount: numericAmount
          });
        }
      }
      return newEntries;
    });
  
    // Update total amount with full precision
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

  const normalizeAddress = (address: string) => {
    try {
      return getAddress(address)
    } catch (error) {
      console.warn('Invalid address:', address)
      return address
    }
  }


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <EnhancedClaimsStats claims={claims} />
        
        <div className="flex justify-between items-center">
  <h2 className="text-xl font-bold text-card-foreground">Claims Overview</h2>
  <div className="flex gap-2">
    
    <Button 
      onClick={() => setIsNewClaimOpen(true)}
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      New Claim
    </Button>
  </div>
</div>
        <div className="bg-card rounded-lg shadow h-[500px] ">
          <div className="p-6">
            <div className="flex justify-end items-center mb-4">
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
          </div>
          <TabbedClaimsChart
            data={claims}
            timeframe={timeframe}
          />
        </div>
        
        <div className="mt-8 space-y-8 pt-16">
        <ClaimsList 
            claims={claims.map(claim => ({
              ...claim,
              id: String(claim.id)
            })) as Claim[]}
            onClaimUpdate={refreshClaims} 
          />
        </div>
        
        {/* Dialog Component */}
        {/* New Claim Dialog */}
<Dialog open={isNewClaimOpen} onOpenChange={setIsNewClaimOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">New Claim Entry</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Enter the details for your new claim. All amounts are in USD.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Date
        </Label>
        <div className="relative">
          <DatePicker
              value={date}
              onChange={setDate}
              className="w-full p-2"
            />
        </div>
      </div>

      {/* Token Selection */}
      <div className="space-y-3">
    <Label className="text-sm font-medium">Selected Tokens</Label>
    <Card className="p-4 bg-muted/50">
      <div className="space-y-3">
        {selectedTokens.map(token => {
          const metadata = tokenMetadata[token.symbol];
          
          return (
            <div key={token.id} className="flex items-center gap-4">
              <div className="w-24 flex items-center gap-2">
                {metadata && (
                  <TokenLogo 
                    tokenId={metadata.id}
                    symbol={token.symbol}
                    size="md"
                  />
                )}
                <span className="font-medium">{token.symbol}</span>
              </div>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                type="number"
                onChange={(e) => handleTokenAmountChange(token.id, e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
                step="any"  // Allow any decimal precision
              />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTokens(tokens => tokens.filter(t => t.id !== token.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <TokenSelect
          tokens={tokens}
          selectedTokens={selectedTokens}
          onTokensChange={(token: Token) => {
            if (!selectedTokens.find(t => t.id === token.id)) {
              setSelectedTokens([...selectedTokens, token]); 
            }
          }}
        />
      </div>
    </Card>
  </div>

      {/* Transaction URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Transaction URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
              type="url"
              value={txn}
              onChange={(e) => {
                setTxn(e.target.value);
              }}
              className="w-full pl-8 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://"
            />
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
        </div>
      </div>

      <Separator />

      {/* Tax Withholding Section */}
        <div>
        <div className="flex items-center gap-2">
        <input
        type="checkbox"
        id="heldForTaxes"
        checked={heldForTaxes}
        onChange={(e) => {
          setHeldForTaxes(e.target.checked);
          if (!e.target.checked) {
            setTaxAmount(0);
          }
        }}
        className="h-4 w-4 rounded border-muted-foreground/25"
        />
        <Label htmlFor="heldForTaxes" className="text-foreground">
        Hold amount for taxes
        </Label>
        </div>
        {heldForTaxes && (
        <div className="mt-2 relative">
        <span className="absolute left-3 top-2.5">$</span>
        <input
        type="number"
        step="any"
        min="0"
        value={taxAmount || ''}
        onChange={(e) => {
          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
          setTaxAmount(isNaN(value) ? 0 : value);
        }}
        className="w-full pl-8 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Tax amount to hold"
        />
        </div>
        )}
        </div>

      {/* Summary Section */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-lg font-bold">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          {heldForTaxes && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Hold</span>
                <Badge variant="secondary">
                  ${taxAmount.toFixed(2)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Net After Tax</span>
                <Badge variant="outline">
                  ${(totalAmount - taxAmount).toFixed(2)}
                </Badge>
              </div>
            </>
          )}
        </div>
      </Card>

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
          
      </div>
    </div>
  );
}