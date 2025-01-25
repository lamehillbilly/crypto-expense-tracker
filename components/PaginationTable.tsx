import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PnLRecord {
  id: number;
  date: string;
  tokenSymbol: string;
  type: string;
  amount: number;
  taxEstimate: number;
}

const formatPnL = (pnl: number | undefined) => {
  if (pnl === undefined) return '-';
  return (
    <span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
      ${Math.abs(pnl).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {pnl >= 0 ? (
        <ArrowUpRight className="inline h-4 w-4 ml-1" />
      ) : (
        <ArrowDownRight className="inline h-4 w-4 ml-1" />
      )}
    </span>
  );
};

export function PaginationTable() {
  const [records, setRecords] = useState<PnLRecord[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalTax, setTotalTax] = useState(0);

  const fetchPnL = async () => {
    try {
      console.log('Fetching PnL data...');
      const response = await fetch('/api/pnl');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PnL fetch error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch PnL data');
      }
      
      const data = await response.json();
      console.log('Received PnL data:', data);
      
      if (!data.records) {
        throw new Error('Invalid data format received');
      }
      
      setRecords(data.records);
      setTotalPnL(data.totalPnL);
      setTotalTax(data.totalTax);
    } catch (error) {
      console.error('Error fetching PnL:', error);
      // Optionally show a toast message
      // toast.error('Failed to load trading history');
    }
  };

  useEffect(() => {
    fetchPnL();
    // Set up an interval to refresh data
    const interval = setInterval(fetchPnL, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium">Total Realized P/L</h3>
          <p className="text-2xl font-bold">{formatPnL(totalPnL)}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium">Estimated Tax</h3>
          <p className="text-2xl font-bold text-muted-foreground">
            ${totalTax.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>P/L</TableHead>
            <TableHead>Est. Tax</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{record.tokenSymbol}</TableCell>
              <TableCell>{record.type}</TableCell>
              <TableCell>{formatPnL(record.amount)}</TableCell>
              <TableCell className="text-muted-foreground">
                ${record.taxEstimate.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 