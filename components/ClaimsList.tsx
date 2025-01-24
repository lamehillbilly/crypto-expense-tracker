import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { EditClaimDialog } from '@/components/EditClaimDialog';

interface Claim {
  id: string;
  date: string;
  totalAmount: number;
  tokenTotals?: Record<string, number>;
  taxAmount?: number;
  txn?: string;
}

interface ClaimsListProps {
  claims: Claim[];
  onClaimUpdate: () => void;
}

export function ClaimsList({ claims, onClaimUpdate }: ClaimsListProps) {
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleDelete = async (claimId: string) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        const response = await fetch(`/api/claims/${claimId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete claim');
        
        toast.success('Claim deleted successfully');
        onClaimUpdate(); // Refresh claims list
      } catch (error) {
        toast.error('Failed to delete claim');
        console.error('Error deleting claim:', error);
      }
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <EditClaimDialog
        claim={editingClaim && {
          id: editingClaim.id,
          date: editingClaim.date,
          tokenTotals: editingClaim.tokenTotals || {},
          taxAmount: editingClaim.taxAmount,
          txn: editingClaim.txn
        }}
        open={!!editingClaim}
        onClose={() => setEditingClaim(null)}
        onUpdate={onClaimUpdate}
      />
      
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Claims History</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Tax Hold</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right">Actions</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <React.Fragment key={claim.id}>
                <TableRow className="border-b">
                  <TableCell>{formatDate(claim.date)}</TableCell>
                  <TableCell>{formatAmount(claim.totalAmount)}</TableCell>
                  <TableCell>
                    {claim.taxAmount ? (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {formatAmount(claim.taxAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {claim.txn ? (
                      <a
                        href={claim.txn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingClaim(claim)}
                        className="p-2 hover:bg-accent rounded-full"
                        title="Edit claim"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(claim.id)}
                        className="p-2 hover:bg-destructive/10 rounded-full text-destructive"
                        title="Delete claim"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => toggleRow(Number(claim.id))}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedRows.includes(Number(claim.id)) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(Number(claim.id)) && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/50 p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Token Breakdown</h4>
                        <div className="grid gap-2">
                          {Object.entries(claim.tokenTotals || {}).map(([token, amount]) => (
                            <div key={token} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{token}</span>
                              <span>{formatAmount(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}