// components/PaginatedTable.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Entry, ExpenseDetails, TradeDetails, TransactionType } from '@/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Calendar, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PaginatedTableProps {
  entries: Entry[];
  onDelete: (id: number) => void;
  onEdit: (entry: Entry) => void;
}

interface Filters {
  search: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  searchFields: {
    description: boolean;
    tokenSymbol: boolean;
    txn: boolean;
  };
}

type SortableFields = 'date' | 'type' | 'amount' | 'category';

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

const formatDateForInput = (date: string | undefined) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export function PaginatedTable({ entries, onDelete, onEdit }: PaginatedTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    searchFields: {
      description: true,
      tokenSymbol: true,
      txn: true
    }
  });
  const [sortField, setSortField] = useState<SortableFields>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSort = (field: SortableFields) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Type filter
    if (filters.type) {
      result = result.filter(entry => entry.type === filters.type);
    }

    // Enhanced text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(entry => {
        const matches = [];
        
        if (filters.searchFields.description) {
          matches.push(
            entry.expenseDetails?.description?.toLowerCase().includes(searchLower) || false
          );
        }
        
        if (filters.searchFields.tokenSymbol) {
          matches.push(
            entry.tokenSymbol?.toLowerCase().includes(searchLower) || false
          );
        }
        
        if (filters.searchFields.txn) {
          matches.push(
            entry.txn?.toLowerCase().includes(searchLower) || false
          );
        }

        return matches.some(match => match);
      });
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(entry => new Date(entry.date) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(entry => new Date(entry.date) <= toDate);
    }

    return result;
  }, [entries, filters]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'date':
          return direction * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'type':
          return direction * a.type.localeCompare(b.type);
        case 'amount':
          return direction * (a.amount - b.amount);
        case 'category':
          const categoryA = (a.expenseDetails as ExpenseDetails)?.category || '';
          const categoryB = (b.expenseDetails as ExpenseDetails)?.category || '';
          return direction * categoryA.localeCompare(categoryB);
        default:
          return 0;
      }
    });
  }, [filteredEntries, sortField, sortDirection]);

  const currentEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, itemsPerPage, sortedEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="space-y-4 p-6">
        {/* Search and Filters Section */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr,auto]">
            {/* Search Section */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {['description', 'tokenSymbol', 'txn'].map((field) => (
                  <label key={field} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.searchFields[field as keyof typeof filters.searchFields]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        searchFields: {
                          ...prev.searchFields,
                          [field]: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-start">
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  type: e.target.value as TransactionType || undefined 
                }))}
                className="px-4 py-2 border rounded-lg bg-background text-foreground min-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Claims">Claims</option>
                <option value="Trade">Trades</option>
              </select>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="flex flex-wrap items-center gap-4 bg-secondary/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={formatDateForInput(filters.dateFrom)}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="px-3 py-1.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateTo)}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="px-3 py-1.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {(filters.search || filters.type || filters.dateFrom || filters.dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  search: '',
                  dateFrom: '',
                  dateTo: '',
                  searchFields: {
                    description: true,
                    tokenSymbol: true,
                    txn: true
                  }
                })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'searchFields') return null;
              return (
                <Badge 
                  key={key} 
                  variant="secondary"
                  className="py-1.5 pl-3 pr-2 gap-2"
                >
                  {key === 'dateFrom' ? `From ${format(new Date(value), 'MMM d, yyyy')}` :
                   key === 'dateTo' ? `To ${format(new Date(value), 'MMM d, yyyy')}` :
                   key === 'type' ? `Type: ${value}` :
                   key === 'search' ? `Search: ${value}` : value}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                    className="hover:bg-background/50 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Table Section */}
        <div className="relative rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Token/Description</TableHead>
                <TableHead className="font-semibold">Amount/P&L</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell className="py-3">{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {entry.type === 'Trade' ? (
                      <span className="font-medium">{entry.tokenSymbol}</span>
                    ) : (
                      entry.expenseDetails?.description
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.type === 'Trade' ? (
                      formatPnL(entry.pnl)
                    ) : (
                      <span className="font-medium">${entry.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.type === 'Trade' ? (
                      <Badge variant={entry.status === 'open' ? 'success' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entry)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(entry.id!)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {currentEntries.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No transactions found matching your filters.</p>
          </div>
        )}

        {/* Pagination Section */}
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
    </Card>
  );
}