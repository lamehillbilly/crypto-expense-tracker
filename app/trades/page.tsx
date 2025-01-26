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
import { Switch } from "@/components/ui/switch";
import { DatePicker } from '@/components/DatePicker';
import { CoinGeckoTokenSearch } from '@/components/TradeSearch';

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
  marketCapRank?: number | null;
}

interface TokenSearchResult {
  id: string;
  symbol: string;
  name: string;
  large: string;
  image?: string;
}

interface CachedPrice {
  price: number;
  timestamp: number;
}

interface PriceCache {
  [tokenId: string]: CachedPrice;
}

interface EditTokenDialogProps {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

function EditTokenDialog({ trade, open, onOpenChange, onUpdate }: EditTokenDialogProps) {
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/trades/${trade.id}/update-token`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedToken!.id,
          tokenSymbol: selectedToken!.symbol,
          tokenName: selectedToken!.name,
          tokenImage: selectedToken!.large,
          isCustomToken: false
        }),
      });

      if (!response.ok) throw new Error('Failed to update token');

      toast.success('Token updated successfully');
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update token');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Token</DialogTitle>
          <DialogDescription>
            Link this custom token to a CoinGecko listing to track its current price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Token</h4>
            <div className="flex items-center gap-3">
              {trade.tokenImage && (
                <Image
                  src={trade.tokenImage}
                  alt={trade.tokenName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{trade.tokenSymbol}</p>
                <p className="text-sm text-muted-foreground">{trade.tokenName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Search CoinGecko Listing</Label>
            <TokenSearch onSelect={setSelectedToken} />
          </div>

          {selectedToken && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Token</h4>
              <div className="flex items-center gap-3">
                <Image
                  src={selectedToken.large}
                  alt={selectedToken.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedToken.symbol.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{selectedToken.name}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!selectedToken || isLinking}
            >
              {isLinking ? 'Updating...' : 'Update Token'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const [isCustomToken, setIsCustomToken] = useState(false);
  const [customTokenData, setCustomTokenData] = useState({
    symbol: '',
    name: '',
    image: ''
  });
  const [editingToken, setEditingToken] = useState<Trade | null>(null);

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
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch trades:', errorData);
        throw new Error(`Failed to fetch trades: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      
      // Fetch current prices for all open trades
      const openTrades = data.trades.filter((trade: Trade) => trade.status === 'open');
      const tokenIds = openTrades.map((trade: Trade) => trade.tokenId);
      
      if (tokenIds.length > 0) {
        try {
          const priceResponse = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`
          );
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            
            // Update trades with current prices
            const tradesWithPrices = data.trades.map((trade: Trade) => {
              if (trade.status === 'open' && priceData[trade.tokenId]) {
                const currentPrice = priceData[trade.tokenId].usd;
                const unrealizedPnl = (currentPrice - trade.purchasePrice) * trade.quantity;
                return {
                  ...trade,
                  currentPrice,
                  unrealizedPnl
                };
              }
              return trade;
            });
            
            setTrades(tradesWithPrices);
          }
        } catch (error) {
          console.error('Error fetching prices:', error);
        }
      }
      
      setTotalRealizedPnL(data.totalRealizedPnL);
      setTotalTaxEstimate(data.totalTaxEstimate);
    } catch (error) {
      console.error('Error in fetchTrades:', error);
      toast.error('Failed to load trades');
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // In your TradesPage component, update the handleSubmit function:

const handleSubmit = async (e: { preventDefault: () => void; }) => {
  e.preventDefault();
  
  if (!isCustomToken && !selectedToken) {
    toast.error('Please select a token');
    return;
  }

  if (isCustomToken && (!customTokenData.symbol || !customTokenData.name)) {
    toast.error('Please fill in token details');
    return;
  }

  if (!purchasePrice || !quantity) {
    toast.error('Please fill in all fields');
    return;
  }

  try {
    const tradeData = {
      tokenId: isCustomToken ? `custom-${customTokenData.symbol.toLowerCase()}` : selectedToken!.id,
      tokenSymbol: isCustomToken ? customTokenData.symbol.toUpperCase() : selectedToken!.symbol.toUpperCase(),
      tokenName: isCustomToken ? customTokenData.name : selectedToken!.name,
      tokenImage: isCustomToken ? customTokenData.image : selectedToken!.large, // Use large image from CoinGecko
      purchaseDate: new Date(purchaseDate).toISOString(),
      purchasePrice: parseFloat(purchasePrice),
      quantity: parseFloat(quantity),
      marketCapRank: selectedToken?.market_cap_rank || null,
      status: 'open',
      currentPrice: selectedToken?.current_price || parseFloat(purchasePrice),
      unrealizedPnl: 0,
      realizedPnl: 0,
      isCustomToken: isCustomToken
    };

    console.log('Submitting trade data:', tradeData); // Debug log

    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create trade:', errorData);
      throw new Error(errorData.error || 'Failed to create trade');
    }

    toast.success('Trade added successfully');
    setIsNewTradeOpen(false);
    setSelectedToken(null);
    setIsCustomToken(false);
    setCustomTokenData({ symbol: '', name: '', image: '' });
    fetchTrades();
  } catch (error) {
    console.error('Error in handleSubmit:', error);
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
      {/* Custom Token Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={isCustomToken}
          onCheckedChange={setIsCustomToken}
          id="custom-token"
        />
        <Label htmlFor="custom-token">Add Custom Token</Label>
      </div>

      {isCustomToken ? (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Token Symbol</Label>
        <input
          type="text"
          value={customTokenData.symbol}
          onChange={(e) => setCustomTokenData(prev => ({
            ...prev,
            symbol: e.target.value
          }))}
          className="w-full p-2 border rounded-lg bg-background"
          placeholder="e.g., BTC"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Token Name</Label>
        <input
          type="text"
          value={customTokenData.name}
          onChange={(e) => setCustomTokenData(prev => ({
            ...prev,
            name: e.target.value
          }))}
          className="w-full p-2 border rounded-lg bg-background"
          placeholder="e.g., Bitcoin"
          required
        />
      </div>
    </div>
  </div>
) : (
  <div className="space-y-2">
    <Label>Select Token</Label>
    <CoinGeckoTokenSearch 
      onSelect={(token) => {
        if (token) {
          setSelectedToken({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            large: token.large,
            current_price: token.current_price
          });
          // If we have a current price, update the purchase price field
          if (token.current_price) {
            setPurchasePrice(token.current_price.toString());
          }
        } else {
          setSelectedToken(null);
        }
      }}
      selectedToken={selectedToken}
    />
  </div>
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
          <DatePicker
              value={purchaseDate}
              onChange={setPurchaseDate}
              className="w-full p-2"
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

<Button 
  variant="outline" 
  onClick={() => {
    localStorage.removeItem('priceCache'); // Clear cache
    fetchTrades(); // Refetch all prices
  }}
>
  Refresh Prices
</Button>
    </div>
  );
} 