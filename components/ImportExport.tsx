import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ImportExportClaims = ({ onImportSuccess }) => {
  const transformTokenTotalsToDetails = (tokenTotals) => {
    return Object.entries(tokenTotals).map(([tokenSymbol, amount]) => ({
      tokenSymbol,
      amount: Number(amount)
    }));
  };

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing file...');

    try {
      let data;
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Transform the data to match the expected format
        data = jsonData.map(entry => ({
          date: entry.date.split('T')[0], // Extract just the date part
          tokenDetails: transformTokenTotalsToDetails(entry.tokenTotals),
          totalAmount: entry.totalAmount,
          heldForTaxes: false,
          taxAmount: 0,
          txn: entry.txn
        }));
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        // Transform CSV data
        data = result.data.map(row => {
          const { date, totalAmount, txn, ...tokenColumns } = row;
          const tokenDetails = Object.entries(tokenColumns)
            .filter(([key, value]) => value && !['date', 'totalAmount', 'txn'].includes(key))
            .map(([tokenSymbol, amount]) => ({
              tokenSymbol,
              amount: Number(amount)
            }));
          
          return {
            date: date.split('T')[0],
            tokenDetails,
            totalAmount: Number(totalAmount),
            heldForTaxes: false,
            taxAmount: 0,
            txn
          };
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd'
        });
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        // Transform Excel data
        data = rawData.map(row => {
          const { date, totalAmount, txn, ...tokenColumns } = row;
          const tokenDetails = Object.entries(tokenColumns)
            .filter(([key, value]) => value && !['date', 'totalAmount', 'txn'].includes(key))
            .map(([tokenSymbol, amount]) => ({
              tokenSymbol,
              amount: Number(amount)
            }));
          
          return {
            date: new Date(date).toISOString().split('T')[0],
            tokenDetails,
            totalAmount: Number(totalAmount),
            heldForTaxes: false,
            taxAmount: 0,
            txn
          };
        });
      } else {
        throw new Error('Unsupported file format');
      }

      // Import claims one by one with progress tracking
      const results = { success: 0, failed: 0, errors: [] };
      const importPromises = data.map(async (claim, index) => {
        try {
          const response = await fetch('/api/claims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(claim),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `Failed to import claim for ${claim.date}`);
          }

          results.success++;
          // Update loading toast with progress
          toast.loading(
            `Importing claims: ${index + 1}/${data.length}`,
            { id: loadingToast }
          );
          
          return await response.json();
        } catch (error) {
          results.failed++;
          results.errors.push({
            date: claim.date,
            error: error.message
          });
        }
      });

      await Promise.all(importPromises);

      // Show final results
      if (results.failed > 0) {
        toast.error(`Import completed with errors`, {
          id: loadingToast,
          description: `Successfully imported ${results.success} claims, failed to import ${results.failed} claims.`
        });
        console.error('Failed imports:', results.errors);
      } else {
        toast.success(`Successfully imported ${results.success} claims!`, {
          id: loadingToast
        });
      }

      onImportSuccess?.();

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import claims', {
        id: loadingToast,
        description: error.message
      });
    }

    // Reset file input
    event.target.value = '';
  }, [onImportSuccess]);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = useCallback(async (format) => {
    const loadingToast = toast.loading('Preparing export...');

    try {
      const response = await fetch('/api/claims');
      if (!response.ok) throw new Error('Failed to fetch claims');
      
      const claims = await response.json();
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const csvData = claims.map(claim => ({
          date: claim.date,
          totalAmount: claim.totalAmount,
          ...claim.tokenTotals,
          txn: claim.txn
        }));
        
        const csv = Papa.unparse(csvData);
        downloadFile(csv, `claims-export-${dateStr}.csv`, 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(claims, null, 2);
        downloadFile(json, `claims-export-${dateStr}.json`, 'application/json');
      }

      toast.success(`Claims exported successfully as ${format.toUpperCase()}!`, { id: loadingToast });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export claims', {
        id: loadingToast,
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  }, []);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <input
        id="file-upload"
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ImportExportClaims;