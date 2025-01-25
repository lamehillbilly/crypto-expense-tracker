// components/ClaimForm.tsx
'use client';

import React, { useState } from 'react';
import { ClaimDetails } from '@/types';
import { TokenSelect } from './TokenSelect';
import { DollarSign, Calculator, Coins } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ClaimFormProps {
  details: ClaimDetails;
  onChange: (details: ClaimDetails) => void;
  onAmountChange: (totalValue: number) => void;
}

interface ExtendedClaimDetails extends ClaimDetails {
  taxPercentage: number;
}

const TAX_RATES = [
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: '30%', value: 30 },
  { label: 'Custom Amount', value: 'custom' }
];

export const ClaimForm: React.FC<ClaimFormProps> = ({
  details,
  onChange,
  onAmountChange
}) => {
  const { data } = useSWR('/api/tokens', fetcher);
  const [customTaxAmount, setCustomTaxAmount] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<string | number>('');

  const handleAmountChange = (amount: number) => {
    const newAmount = amount;
    const newDetails: ExtendedClaimDetails = {
      ...details,
      totalAmount: newAmount,
      taxPercentage: Number(details.taxPercentage || 0)
    };
    
    if (newDetails.heldForTaxes && newDetails.taxPercentage) {
      newDetails.taxAmount = (newAmount * newDetails.taxPercentage) / 100;
    }
    
    const claimDetails: ClaimDetails = {
      ...details,
      totalAmount: newAmount,
      taxAmount: newDetails.taxAmount,
      heldForTaxes: newDetails.heldForTaxes,
      tokenTags: newDetails.tokenTags,
      tokenClaims: newDetails.tokenClaims,
      date: newDetails.date
    };
    onChange(claimDetails);
    onAmountChange(newAmount);
  };

  const handleTaxRateChange = (rate: number | 'custom') => {
    setSelectedRate(rate);
    setCustomTaxAmount('');

    if (rate === 'custom') {
      onChange({
        ...details,
        taxAmount: 0,
        heldForTaxes: true
      });
      return;
    }

    const taxAmount = (details.totalAmount * (rate as number)) / 100;
    onChange({
      ...details,
      taxAmount,
      heldForTaxes: true
    });
  };

  const handleCustomTaxAmountChange = (value: string) => {
    setCustomTaxAmount(value);
    const customAmount = parseFloat(value);
    
    if (!isNaN(customAmount) && customAmount >= 0 && customAmount <= details.totalAmount) {
      onChange({
        ...details,
        taxAmount: customAmount,
        heldForTaxes: true
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Select Tokens</Label>
          <TokenSelect
            tokens={data || []} 
            selectedTokens={data?.filter((token: { symbol: string; }) => 
              details.tokenTags?.includes(token.symbol)
            ) || []}
            onTokensChange={(newToken) => {
              onChange({ ...details, tokenTags: [...(details.tokenTags || []), newToken.symbol] })
            }}
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Claim Amount</Label>
          <div className="relative mt-1.5">
            <div className="absolute left-3 top-2.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="number"
              value={details.totalAmount || ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
              placeholder="Enter total claim amount"
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              step="0.01"
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Tax Withholding</Label>
              <p className="text-sm text-muted-foreground">
                Set aside funds for tax obligations
              </p>
            </div>
            <Switch
              checked={details.heldForTaxes}
              onCheckedChange={(checked) => onChange({ ...details, heldForTaxes: checked })}
            />
          </div>

          {details.heldForTaxes && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {TAX_RATES.map(({ label, value }) => (
                  <Button
                    key={label}
                    type="button"
                    variant={selectedRate === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTaxRateChange(value as number | "custom")}
                    className="rounded-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {selectedRate === 'custom' && (
                <div className="relative">
                  <div className="absolute left-3 top-2.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="number"
                    value={customTaxAmount}
                    onChange={(e) => handleCustomTaxAmountChange(e.target.value)}
                    placeholder="Enter custom tax amount"
                    className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    min="0"
                    max={details.totalAmount}
                    step="0.01"
                  />
                </div>
              )}

              {details.taxAmount !== undefined && details.taxAmount > 0 && (
                <Card className="border border-muted p-4 bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Tax Amount
                      </span>
                      <Badge variant="secondary">
                        ${details.taxAmount.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Net Amount
                      </span>
                      <Badge variant="outline">
                        ${(details.totalAmount - details.taxAmount).toFixed(2)}
                      </Badge>
                    </div>
                    {details.taxPercentage && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tax Rate</span>
                        <Badge variant="secondary">
                          {details.taxPercentage}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};