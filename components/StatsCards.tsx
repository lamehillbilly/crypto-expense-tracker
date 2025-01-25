import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Percent, Trophy } from 'lucide-react';

const EnhancedClaimsStats = ({ claims }) => {
  const totalClaimed = claims.reduce((sum, claim) => 
    sum + claim.totalAmount, 0
  );

  const aggregatedTokens = claims.reduce((acc, claim) => {
    if (claim.tokenTotals) {
      Object.entries(claim.tokenTotals).forEach(([token, amount]) => {
        acc[token] = (acc[token] || 0) + amount;
      });
    }
    return acc;
  }, {});

  const topTokens = Object.entries(aggregatedTokens)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([symbol, amount]) => ({
      symbol,
      amount
    }));

  const totalTaxHeld = claims.reduce((sum, claim) => 
    sum + (claim.taxAmount || 0), 0
  );
  
  const targetTaxAmount = totalClaimed * 0.20;
  const taxDifference = totalTaxHeld - targetTaxAmount;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <Card className="h-[200px]">
          <CardContent className="h-full flex flex-col justify-between pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Claimed</p>
                <h3 className="text-4xl font-bold mt-4">${totalClaimed.toFixed(2)}</h3>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              Total amount claimed across all tokens
            </div>
          </CardContent>
        </Card>

        <Card className="h-[280px]">
        <CardContent className="h-full pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Trophy className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Top Tokens</p>
          </div>
          <div className="space-y-3">
            {topTokens.map((token, index) => (
              <div key={token.symbol} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                  {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                  {index === 2 && <Trophy className="h-5 w-5 text-amber-700" />}
                  <span className="font-medium">{token.symbol}</span>
                </div>
                <span className="font-bold">${token.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      
      <Card className="h-[200px]">
          <CardContent className="h-full flex flex-col justify-between pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Tax Status</p>
                  <div className="flex items-center w-full justify-end"><Percent className="h-8 w-8 text-primary ml-4 " /></div>
                </div>
                <h3 className="text-3xl font-bold">
                  ${Math.abs(totalTaxHeld).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {taxDifference >= 0 ? 'over' : 'under'}
                  </span>
                </h3>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Under/Over</span>
                <span className="font-medium">${taxDifference.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default EnhancedClaimsStats;