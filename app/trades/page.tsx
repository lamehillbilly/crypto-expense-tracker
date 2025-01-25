'use client';

import { useState, useEffect } from 'react';
import { TradesList } from '@/components/TradesList';
import { Button } from '@/components/ui/button';
import { TokenSearch } from '@/components/TokenSearch';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Hash, 
  CalendarIcon 
} from "lucide-react";
import Image from "next/image";

// Add the formatPnL function
const formatPnL = (pnl: number | undefined) => {
  if (pnl === undefined) return '-';
  return (
    <span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
      ${Math.abs(pnl).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {pnl >= 0 ? (
        <ArrowUpRight className="inline h-4 w-4 ml-1" />
      ) : (
        <ArrowDownRight className="inline h-4 w-4 ml-1" />
      )}
    </span>
  );
};

interface Trade {
  id?: number;
  tokenSymbol: string;
  tokenName: string;
  purchasePrice: number;
  quantity: number;
  currentPrice?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  status: 'open' | 'closed';
}

interface TokenSearchResult {
  id: string;
  symbol: string;
  name: string;
  large: string;
}

export default function TradesPage() {
  const [isNewTradeOpen, setIsNewTradeOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalRealizedPnL, setTotalRealizedPnL] = useState(0);
  const [totalTaxEstimate, setTotalTaxEstimate] = useState(0);

  const stats = {
    totalValue: trades.reduce((sum, trade) => {
      if (trade.status === 'open') {
        return sum + (trade.currentPrice || trade.purchasePrice) * trade.quantity;
      }
      return sum;
    }, 0),
    unrealizedPnL: trades.reduce((sum, trade) => {
      return sum + (trade.unrealizedPnl || 0);
    }, 0),
    realizedPnL: trades.reduce((sum, trade) => {
      return sum + (trade.realizedPnl || 0);
    }, 0),
    taxableAmount: trades.reduce((sum, trade) => {
      const realizedGain = trade.realizedPnl || 0;
      return sum + (realizedGain > 0 ? realizedGain * 0.35 : 0);
    }, 0),
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      if (!response.ok) throw new Error('Failed to fetch trades');
      const data = await response.json();
      setTrades(data.trades);
      setTotalRealizedPnL(data.totalRealizedPnL);
      setTotalTaxEstimate(data.totalTaxEstimate);
    } catch (error) {
      toast.error('Failed to load trades');
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!selectedToken || !purchasePrice || !quantity) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedToken.id,
          tokenSymbol: selectedToken.symbol.toUpperCase(),
          tokenName: selectedToken.name,
          tokenImage: selectedToken.large,
          purchaseDate,
          purchasePrice: parseFloat(purchasePrice),
          quantity: parseFloat(quantity),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create trade');
      }

      toast.success('Trade added successfully');
      setIsNewTradeOpen(false);
      fetchTrades();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add trade');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trades</h1>
        <Button onClick={() => setIsNewTradeOpen(true)}>Add New Trade</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Trading Value</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${stats.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Unrealized P/L</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatPnL(stats.unrealizedPnL)}
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Realized P/L</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {formatPnL(stats.realizedPnL)}
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Est. Tax (35%)</h3>
          </div>
          <p className="text-2xl font-bold mt-2 text-yellow-600">
            ${stats.taxableAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on realized gains
          </p>
        </div>

        

        
      </div>

      <TradesList trades={trades} onUpdate={fetchTrades} />

      {/* Add New Trade Dialog */}
<Dialog open={isNewTradeOpen} onOpenChange={setIsNewTradeOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Add New Trade</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Enter the details of your new trade position.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Token Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Token</Label>
        <TokenSearch onSelect={setSelectedToken} />
      </div>

      {selectedToken && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src={selectedToken.image || `/api/placeholder/40/40?text=${selectedToken.symbol}`}
                alt={selectedToken.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <div>
              <div className="font-medium">{selectedToken.name}</div>
              <div className="text-sm text-muted-foreground">{selectedToken.symbol.toUpperCase()}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Purchase Price */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Purchase Price (USD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
              step="0.000001"
              required
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Quantity
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
              step="0.000001"
              required
            />
          </div>
        </div>
      </div>

      {/* Purchase Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Purchase Date
        </Label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
      </div>

      {/* Trade Summary */}
      {purchasePrice && quantity && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Value</span>
              <span className="text-lg font-bold">
                ${(parseFloat(purchasePrice) * parseFloat(quantity)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Price per Token</span>
              <Badge variant="secondary">
                ${parseFloat(purchasePrice).toFixed(6)}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsNewTradeOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit">Add Trade</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
    </div>
  );
} 