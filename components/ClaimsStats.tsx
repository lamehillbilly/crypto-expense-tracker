import { useMemo } from 'react';

interface ClaimsStatsProps {
  claims: Array<{
    totalAmount: number;
    tokenTotals: Record<string, number>;
    taxAmount?: number;
  }>;
}

export function ClaimsStats({ claims }: ClaimsStatsProps) {
  const stats = useMemo(() => {
    const totalClaimed = claims.reduce((sum, claim) => sum + claim.totalAmount, 0);
    const totalTaxHeld = claims.reduce((sum, claim) => sum + (claim.taxAmount || 0), 0);

    // Calculate totals per token across all claims
    const tokenTotals = claims.reduce((acc, claim) => {
      Object.entries(claim.tokenTotals || {}).forEach(([token, amount]) => {
        acc[token] = (acc[token] || 0) + amount;
      });
      return acc;
    }, {} as Record<string, number>);

    // Find token with highest total
    const topToken = Object.entries(tokenTotals).reduce((top, [token, amount]) => {
      return amount > (top?.amount || 0) ? { token, amount } : top;
    }, { token: '', amount: 0 });

    return {
      totalClaimed,
      totalTaxHeld,
      topToken
    };
  }, [claims]);

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Total Claimed</h3>
        <p className="text-2xl font-bold text-primary mt-2">
          ${stats.totalClaimed.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
      </div>

      <div className="bg-card rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Highest Token Value</h3>
        <p className="text-2xl font-bold text-primary mt-2">
          {stats.topToken.token}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ${stats.topToken.amount.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
      </div>

      <div className="bg-card rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Total Tax Held</h3>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
          ${stats.totalTaxHeld.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </p>
      </div>
    </div>
  );
} 