// components/TradesList.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  DollarSign,
  Link
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React from 'react';

interface TradeHistory {
  id: number;
  tradeId: number;
  date: string;
  amount: number;
  price: number;
  type: 'close' | 'partial_close';
  pnl: number;
}

interface Trade {
  id?: number;
  tokenId: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImage?: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  status: 'open' | 'closed';
  marketCapRank?: number | null;
  isCustomToken: boolean;
  tradeHistory?: TradeHistory[];
}

interface TradesListProps {
  trades: Trade[];
  onUpdate: () => void;
}


export function TradesList({ trades, onUpdate }: TradesListProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [closeAmount, setCloseAmount] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  const toggleRow = (tradeId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(tradeId)) {
      newExpandedRows.delete(tradeId);
    } else {
      newExpandedRows.add(tradeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleCloseTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrade || !closePrice || !closeAmount) return;

    const closeAmountNum = parseFloat(closeAmount);
    const closePriceNum = parseFloat(closePrice);

    if (closeAmountNum > selectedTrade.quantity) {
      toast.error('Close amount cannot exceed position size');
      return;
    }

    const loadingToast = toast.loading('Processing trade closure...');

    try {
      const isFullClose = closeAmountNum === selectedTrade.quantity;
      const pnl = (closePriceNum - selectedTrade.purchasePrice) * closeAmountNum;

      const response = await fetch(`/api/trades/${selectedTrade.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closeAmount: closeAmountNum,
          closePrice: closePriceNum,
          isFullClose,
          pnl,
          date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to close trade');
      }

      toast.success(
        isFullClose ? 'Position closed successfully' : 'Partial close successful', 
        { id: loadingToast }
      );
      
      setSelectedTrade(null);
      setCloseAmount('');
      setClosePrice('');
      setIsClosing(false);
      onUpdate();
    } catch (error) {
      console.error('Close trade error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to close trade', 
        { id: loadingToast }
      );
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    if (!confirm('Are you sure you want to delete this trade and all its history?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }

      toast.success('Trade deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete trade');
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!confirm('Are you sure you want to delete this trade history entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trades/history/${historyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete history entry');
      }

      toast.success('History entry deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete history entry');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

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

  const handleEdit = async (trade: Trade) => {
    try {
      // Only allow editing open trades
      if (trade.status !== 'open') {
        toast.error('Can only edit open trades');
        return;
      }

      setSelectedTrade(trade);
      setCloseAmount(trade.quantity.toString());
      setClosePrice(trade.currentPrice.toString());
      setIsClosing(true);
    } catch (error) {
      console.error('Error editing trade:', error);
      toast.error('Failed to edit trade');
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Unrealized P/L</TableHead>
              <TableHead>Realized P/L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <React.Fragment key={trade.id}>
                <TableRow 
                  className={`cursor-pointer hover:bg-muted/50 ${
                    trade.status === 'closed' ? 'bg-muted/30' : ''
                  }`}
                >
                  <TableCell onClick={() => trade.id && toggleRow(trade.id)}>
                    {expandedRows.has(trade.id!) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>
  <div className="flex items-center gap-3">
    <div className="relative w-8 h-8">
      {trade.tokenImage ? (
        <Image
          src={trade.tokenImage}
          alt={trade.tokenName}
          width={32}
          height={32}
          className="rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <rect width="32" height="32" fill="#f0f0f0"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12" fill="#666">
                  ${trade.tokenSymbol.slice(0, 3)}
                </text>
              </svg>`
            )}`;
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {trade.tokenSymbol.slice(0, 3)}
          </span>
        </div>
      )}
    </div>
    <div>
      <div className="font-medium">
        {trade.tokenSymbol}
        {trade.marketCapRank && (
          <span className="ml-2 text-xs text-muted-foreground">
            #{trade.marketCapRank}
          </span>
        )}
      </div>
      <div className="text-sm text-muted-foreground">{trade.tokenName}</div>
    </div>
  </div>
</TableCell>
                  <TableCell>{format(new Date(trade.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>${formatPrice(trade.purchasePrice)}</TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell>${formatPrice(trade.currentPrice)}</TableCell>
                  <TableCell>
                    {trade.status === 'open' 
                      ? formatPnL(
                          trade.unrealizedPnl || 
                          ((trade.currentPrice - trade.purchasePrice) * trade.quantity)
                        ) 
                      : '-'
                    }
                  </TableCell>
                  <TableCell className={trade.status === 'closed' ? 'font-medium' : ''}>
                    {formatPnL(trade.realizedPnl)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.status === 'open' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trade.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      {trade.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleEdit(trade)}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {trade.isCustomToken && (
                            <button
                              onClick={() => setEditingToken(trade)}
                              className="p-1 hover:bg-accent rounded"
                            >
                              <Link className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteTrade(trade.id!)}
                        className="p-2 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.has(trade.id!) && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Trade History</h4>
                        {trade.tradeHistory && trade.tradeHistory.length > 0 ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground mb-2">
                              <div>Date</div>
                              <div>Type</div>
                              <div>Amount</div>
                              <div>Price</div>
                              <div>P/L</div>
                            </div>
                            {trade.tradeHistory.map((history) => (
                              <div key={history.id} className="grid grid-cols-6 gap-4 text-sm">
                                <div>{format(new Date(history.date), 'MMM dd, yyyy HH:mm')}</div>
                                <div className="capitalize">{history.type.replace('_', ' ')}</div>
                                <div>{history.amount.toLocaleString()}</div>
                                <div>${formatPrice(history.price)}</div>
                                <div>{formatPnL(history.pnl)}</div>
                                <div>
                                  <button
                                    onClick={() => handleDeleteHistory(history.id)}
                                    className="p-1 hover:bg-red-100 rounded-full text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No trade history available
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isClosing} onOpenChange={setIsClosing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Position</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCloseTrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Close Amount (Max: {selectedTrade?.quantity})
              </label>
              <input
                type="number"
                value={closeAmount}
                onChange={(e) => setCloseAmount(e.target.value)}
                className="w-full p-2 border rounded"
                step="0.000001"
                max={selectedTrade?.quantity}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Closing Price (USD)
              </label>
              <input
                type="number"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className="w-full p-2 border rounded"
                step="0.000001"
                required
              />
            </div>
            {closePrice && closeAmount && selectedTrade && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Projected P/L: {formatPnL(
                    (parseFloat(closePrice) - selectedTrade.purchasePrice) * parseFloat(closeAmount)
                  )}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClosing(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {parseFloat(closeAmount) === selectedTrade?.quantity 
                  ? 'Close Position' 
                  : 'Partial Close'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}