import React, { useCallback, useState } from 'react';
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
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing file...');

    try {
      let data;
      if (file.name.endsWith('.csv')) {
        // Handle CSV
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        data = result.data;
      } else if (file.name.endsWith('.json')) {
        // Handle JSON
        const text = await file.text();
        data = JSON.parse(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Handle Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd'
        });
        data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      } else {
        throw new Error('Unsupported file format');
      }

      // Validate and format data
      const formattedData = data.map(row => ({
        date: row.date,
        tokenDetails: Array.isArray(row.tokenDetails) ? row.tokenDetails : [],
        totalAmount: parseFloat(row.totalAmount),
        heldForTaxes: Boolean(row.heldForTaxes),
        taxAmount: row.taxAmount ? parseFloat(row.taxAmount) : undefined,
        txn: row.txn
      }));

      // Send to API
      const response = await fetch('/api/claims/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error('Failed to import claims');

      toast.success('Claims imported successfully!', { id: loadingToast });
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
        // Create CSV
        const csv = Papa.unparse(claims.map(claim => ({
          date: claim.date,
          totalAmount: claim.totalAmount,
          heldForTaxes: claim.heldForTaxes,
          taxAmount: claim.taxAmount,
          txn: claim.txn,
          tokenDetails: JSON.stringify(claim.tokenDetails)
        })));
        
        downloadFile(csv, `claims-export-${dateStr}.csv`, 'text/csv');
      } else if (format === 'json') {
        // Create JSON with proper formatting
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