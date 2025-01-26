import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { EditClaimDialog } from '@/components/EditClaimDialog';
import { getAddress } from 'ethers';
import TokenLogo from '@/components/TokenLogo';
import ImportExportClaims from './ImportExport';

interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
}

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ClaimsList({ claims, onClaimUpdate }: ClaimsListProps) {
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  

  // Load token metadata
  useEffect(() => {
    const fetchTokenMetadata = async () => {
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

    if (expandedRows.length > 0) {
      fetchTokenMetadata();
    }
  }, [expandedRows]);

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
        onClaimUpdate();
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
      <ImportExportClaims 
      onImportSuccess={() => {
        // Refresh claims data after successful import
        fetch('/api/claims')
          .then(response => response.json())
          .then(data => setClaims(data))
          .catch(error => console.error('Error fetching claims:', error));
      }} 
    />
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
                      className="p-1 hover:bg-accent rounded"
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
                    <TableCell colSpan={6} className="bg-muted/40 p-0">
                      <div className="py-2 px-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
                          {Object.entries(claim.tokenTotals || {}).map(([token, amount]) => {
                            const metadata = tokenMetadata[token];
                            
                            return (
                              <div 
                                key={token} 
                                className="flex items-center gap-3 p-2 rounded-lg bg-background/60 border border-border/50 hover:border-border transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                {metadata && (
                                    <div className="relative flex-shrink-0">
                                      <TokenLogo 
                                        tokenId={metadata.id}
                                        symbol={metadata.symbol}
                                        size="md"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium truncate text-sm">
                                      {metadata?.symbol || token}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatAmount(amount)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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