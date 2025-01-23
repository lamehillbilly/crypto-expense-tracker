// components/ClaimForm.tsx
import React, { useState } from 'react';
import { ClaimDetails } from '@/types';
import { TokenSelect } from './TokenSelect';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface ClaimFormProps {
  details: ClaimDetails;
  onChange: (details: ClaimDetails) => void;
  onAmountChange: (totalValue: number) => void;
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

  const handleTotalAmountChange = (amount: string) => {
    const newAmount = parseFloat(amount);
    const newDetails: ClaimDetails = {
      ...details,
      totalAmount: isNaN(newAmount) ? 0 : newAmount
    };
    
    // Recalculate tax amount if percentage-based
    if (details.heldForTaxes && typeof details.taxPercentage === 'number') {
      newDetails.taxAmount = (newAmount * details.taxPercentage) / 100;
    }
    
    onChange(newDetails);
    onAmountChange(newAmount);
  };

  const handleTaxRateChange = (rate: number | 'custom') => {
    setSelectedRate(rate);
    setCustomTaxAmount('');

    if (rate === 'custom') {
      // Reset tax amount but keep heldForTaxes true
      onChange({
        ...details,
        taxPercentage: undefined,
        taxAmount: 0,
        heldForTaxes: true
      });
      return;
    }

    // Calculate tax amount based on percentage
    const taxAmount = (details.totalAmount * (rate as number)) / 100;
    onChange({
      ...details,
      taxPercentage: rate as number,
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
        taxPercentage: undefined,
        taxAmount: customAmount,
        heldForTaxes: true
      });
    }
  };

  return (
    <div className="space-y-4">
      <TokenSelect
        tokens={data || []}
        selectedTokens={details.tokenTags || []}
        onTokensChange={(newTokens) => onChange({ ...details, tokenTags: newTokens })}
      />

      <div className="relative">
        <span className="absolute left-3 top-2">$</span>
        <input
          type="number"
          value={details.totalAmount || ''}
          onChange={(e) => handleTotalAmountChange(e.target.value)}
          placeholder="Total Claim Amount"
          className="w-full p-2 pl-6 border rounded"
          required
          step="0.01"
        />
      </div>

      {details.totalAmount > 0 && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="heldForTaxes"
              checked={details.heldForTaxes}
              onChange={(e) => {
                onChange({ 
                  ...details, 
                  heldForTaxes: e.target.checked,
                  taxAmount: e.target.checked ? details.taxAmount : undefined,
                  taxPercentage: e.target.checked ? details.taxPercentage : undefined
                });
                if (!e.target.checked) {
                  setSelectedRate('');
                  setCustomTaxAmount('');
                }
              }}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="heldForTaxes" className="text-sm text-gray-700">
              Hold amount for taxes
            </label>
          </div>

          {details.heldForTaxes && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {TAX_RATES.map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleTaxRateChange(value as number | "custom")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedRate === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedRate === 'custom' && (
                <div className="relative">
                  <span className="absolute left-3 top-2">$</span>
                  <input
                    type="number"
                    value={customTaxAmount}
                    onChange={(e) => handleCustomTaxAmountChange(e.target.value)}
                    placeholder="Enter tax amount to hold"
                    className="w-full p-2 pl-6 border rounded"
                    min="0"
                    max={details.totalAmount}
                    step="0.01"
                  />
                </div>
              )}

              {details.taxAmount !== undefined && details.taxAmount > 0 && (
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    Amount Held for Taxes: ${details.taxAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Net Claim Amount: ${(details.totalAmount - details.taxAmount).toFixed(2)}
                  </p>
                  {details.taxPercentage && (
                    <p className="text-sm text-gray-600">
                      Tax Rate: {details.taxPercentage}%
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};