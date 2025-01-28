import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import _ from 'lodash';

const CSVTransformer = ({ onTransformSuccess }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const getTxHash = (link) => {
    if (!link) return '';
    try {
      return link.split('/').pop() || '';
    } catch (e) {
      return '';
    }
  };

  const transformData = (data) => {
    // Group by date and combine asset details
    const groupedByTx = _.groupBy(data, row => getTxHash(row.Link) || 'no-tx');
    
    const transformedClaims = Object.entries(groupedByTx).map(([txHash, entries]) => {
      // Get the first entry with a valid date
      const dateEntry = entries.find(entry => entry.Date) || entries[0];
      
      // Filter and transform token details
      const tokenDetails = entries
        .filter(entry => 
          entry.Asset && 
          typeof entry['Asset USD value change'] === 'number' && 
          Math.abs(entry['Asset USD value change']) > 0
        )
        .map(entry => ({
          token: entry.Asset,
          amount: Number(Math.abs(entry['Asset USD value change']).toFixed(8))
        }));

      const totalAmount = Number(_.sumBy(tokenDetails, 'amount').toFixed(8));

      return {
        date: formatDate(dateEntry.Date),
        tokenDetails,
        totalAmount,
        heldForTaxes: false,
        taxAmount: 0,
        txn: txHash === 'no-tx' ? '' : txHash
      };
    });

    // Filter out any claims with no valid tokens or missing transaction hash
    return transformedClaims.filter(claim => 
      claim.tokenDetails.length > 0 && 
      claim.totalAmount > 0 &&
      claim.date &&
      claim.txn // Only include claims with valid transaction hashes
    );
  };

  const validateTransformedData = (data) => {
    return data.every(claim => 
      typeof claim.date === 'string' &&
      claim.date.match(/^\d{4}-\d{2}-\d{2}$/) &&
      Array.isArray(claim.tokenDetails) &&
      claim.tokenDetails.length > 0 &&
      claim.tokenDetails.every(detail => 
        typeof detail.token === 'string' &&
        typeof detail.amount === 'number' &&
        detail.amount > 0
      ) &&
      typeof claim.totalAmount === 'number' &&
      claim.totalAmount > 0 &&
      typeof claim.heldForTaxes === 'boolean' &&
      (claim.taxAmount === 0 || typeof claim.taxAmount === 'number') &&
      typeof claim.txn === 'string' &&
      claim.txn.length > 0
    );
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing CSV file...');

    try {
      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: header => header.replace(/ /g, '_')
      });

      if (result.errors.length > 0) {
        throw new Error('CSV parsing failed: ' + result.errors[0].message);
      }

      const transformedData = transformData(result.data);
      
      if (!validateTransformedData(transformedData)) {
        throw new Error('Data validation failed. Please check the CSV format.');
      }

      console.log('Transformed data:', transformedData);

      // Create a JSON file for download
      const blob = new Blob([JSON.stringify(transformedData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transformed_claims.json';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`CSV transformed successfully! Found ${transformedData.length} valid claims.`, { id: loadingToast });
      onTransformSuccess?.(transformedData);
    } catch (error) {
      console.error('Transform error:', error);
      toast.error('Failed to transform CSV', {
        id: loadingToast,
        description: error.message
      });
    }

    event.target.value = '';
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => document.getElementById('csv-upload')?.click()}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Transform CSV
      </Button>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default CSVTransformer;