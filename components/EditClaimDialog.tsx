import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TokenSelect } from '@/components/TokenSelect';
import { toast } from 'sonner';
import { useTokens } from '@/hooks/useTokens';
import { Token } from '@/types';
import TokenLogo from './TokenLogo';
import { Trash2Icon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { DatePicker, DatePickerForm } from './DatePicker';


interface TokenDetail {
  tokenSymbol: string;
  amount: number;
}


interface EditClaimDialogProps {
  claim: {
    id: string;
    date: string;
    tokenTotals: Record<string, number>;
    taxAmount?: number;
    txn?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditClaimDialog({ claim, open, onClose, onUpdate }: EditClaimDialogProps) {
  const { tokens } = useTokens();
  const [date, setDate] = useState('');
  const [tokenDetails, setTokenDetails] = useState<TokenDetail[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [txn, setTxn] = useState('');

  useEffect(() => {
    if (claim) {
      setDate(claim.date.split('T')[0]);
      setTokenDetails(
        Object.entries(claim.tokenTotals).map(([tokenSymbol, amount]) => ({
          tokenSymbol,
          amount
        }))
      );
      setSelectedTokens(
        tokens?.filter(token => 
          Object.keys(claim.tokenTotals).includes(token.symbol)
        ) || []
      );
      setTaxAmount(claim.taxAmount || 0);
      setTxn(claim.txn || '');
    }
  }, [claim, tokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;

    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          tokenDetails,
          totalAmount: tokenDetails.reduce((sum, token) => sum + Number(token.amount), 0),
          taxAmount: taxAmount || undefined,
          txn: txn || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update claim');

      toast.success('Claim updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update claim');
      console.error('Error updating claim:', error);
    }
  };

  const handleTokenChange = (index: number, field: 'tokenSymbol' | 'amount', value: string | number) => {
    setTokenDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'amount' ? Number(value) : value
      };
      return updated;
    });
  };

  const removeToken = (index: number) => {
    setTokenDetails(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = tokenDetails.reduce((sum, token) => sum + Number(token.amount), 0);

  if (!claim) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Claim</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <DatePicker
              value={date}
              onChange={setDate}
              className="w-full p-2"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Token Claims</label>
            {tokenDetails.map((token, index) => (
              <div key={index} className="flex gap-2">
                <div className="min-w-[120px] p-2 border rounded bg-muted">
                  <div className="flex items-center gap-2">
                  <TokenLogo 
                    tokenId={tokens?.find(t => t.symbol === token.tokenSymbol)?.id}
                    symbol={token.tokenSymbol}
                    size="md"
                  />
                  {token.tokenSymbol}
                  </div>
                </div>
                <input
                  type="number"
                  value={token.amount}
                  onChange={(e) => handleTokenChange(index, 'amount', Number(e.target.value))}
                  className="w-full p-2 border rounded bg-muted/50"
                  placeholder="Amount"
                  step="0.01"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeToken(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium mb-2">Add New Token</label>
              <div className="flex gap-2">
                <TokenSelect
                  tokens={tokens || []}
                  selectedTokens={selectedTokens}
                  onTokensChange={(token) => {
                    setSelectedTokens([...selectedTokens, token]);
                    setTokenDetails([
                      ...tokenDetails,
                      { tokenSymbol: token.symbol, amount: 0 }
                    ]);
                  }}
                  placeholder="Select token"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tax Amount</label>
            <input
              type="number"
              value={taxAmount}
              onChange={(e) => setTaxAmount(Number(e.target.value))}
              className="w-full p-2 border rounded bg-muted/50"
              placeholder="Tax amount"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transaction URL</label>
            <input
              type="url"
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              className="w-full p-2 border rounded bg-muted/50"
              placeholder="https://"
            />
          </div>

          <div className="pt-4 border-t">
            <div className="text-right text-lg font-bold">
              Total: ${totalAmount.toFixed(2)}
            </div>
            {taxAmount > 0 && (
              <div className="text-right text-sm text-gray-600">
                Net after tax hold: ${(totalAmount - taxAmount).toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 