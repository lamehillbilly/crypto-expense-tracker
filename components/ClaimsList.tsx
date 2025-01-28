import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Pencil, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { EditClaimDialog } from '@/components/EditClaimDialog';
import { getAddress } from 'ethers';
import TokenLogo from '@/components/TokenLogo';
import ImportExportClaims from './ImportExport';
import { Token, Entry } from '@/types';
import { GroupedData } from './ClaimsChart';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card } from '@/components/ui/card';
import { cn } from "@/lib/utils";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClaims = claims.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(claims.length / itemsPerPage);

  const handleTransformSuccess = (transformedData) => {
    // The transformed data is automatically downloaded as JSON
    // You can then import it using the existing ImportExportClaims component
    console.log('Data transformed:', transformedData);
  };
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

  const handleTokenAmountChange = (tokenId: string, amount: number) => {
    setClaimEntries(prev => {
      const newEntries = prev.filter(entry => entry.tokenId !== tokenId);
      // Only add entry if amount is a valid number and greater than 0
      if (!isNaN(amount) && amount > 0) {
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

    // Update total amount with validation
    const newTotal = claimEntries.reduce((sum, entry) => {
      const amount = parseFloat(entry.amount.toString());
      return !isNaN(amount) ? sum + amount : sum;
    }, 0);
    setTotalAmount(newTotal);
  };
  

  

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(claims.map(claim => claim.id));
    } else {
      setSelectedClaims([]);
    }
  };
  const handleSelect = (claimId: string, checked: boolean) => {
    setSelectedClaims(prev => 
      checked 
        ? [...prev, claimId]
        : prev.filter(id => id !== claimId)
    );
  };
  const handleBatchDelete = async () => {
    if (selectedClaims.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedClaims.length} claims?`)) {
      const loadingToast = toast.loading(`Deleting ${selectedClaims.length} claims...`);
      
      try {
        await Promise.all(
          selectedClaims.map(claimId =>
            fetch(`/api/claims/${claimId}`, {
              method: 'DELETE',
            })
          )
        );

        toast.success('Selected claims deleted successfully', { id: loadingToast });
        setSelectedClaims([]);
        onClaimUpdate();
      } catch (error) {
        console.error('Error deleting claims:', error);
        toast.error('Failed to delete some claims', { id: loadingToast });
      }
    }
  };

  return (
    <Card className="w-full">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-card-foreground">Claims History</h2>
          <div className="flex gap-2">
            <ImportExportClaims onImportSuccess={onClaimUpdate} />
            {selectedClaims.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedClaims.length})
              </Button>
            )}
          </div>
        </div>

        <div className="relative rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedClaims.length === currentClaims.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all claims"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Tax Hold</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentClaims.map((claim) => (
                <React.Fragment key={claim.id}>
                  <TableRow className="border-b">
                    <TableCell>
                      <Checkbox
                        checked={selectedClaims.includes(claim.id)}
                        onCheckedChange={(checked) => 
                          handleSelect(claim.id, checked as boolean)
                        }
                        aria-label={`Select claim from ${claim.date}`}
                      />
                    </TableCell>
                    <TableCell>{formatDate(claim.date)}</TableCell>
                    <TableCell>{formatAmount(claim.totalAmount)}</TableCell>
                    <TableCell>
                      {claim.taxAmount ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {formatAmount(claim.taxAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingClaim(claim)}
                          className="h-8 w-8 p-0 hover:bg-background"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(claim.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(Number(claim.id))}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRows.includes(Number(claim.id)) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditClaimDialog
        claim={editingClaim}
        open={!!editingClaim}
        onClose={() => setEditingClaim(null)}
        onUpdate={onClaimUpdate}
      />
    </Card>
  );
}