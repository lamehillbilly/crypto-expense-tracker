// components/PaginatedTable.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Entry, ExpenseDetails, TradeDetails, TransactionType } from '@/types';
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Trash2, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

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
}

type SortableFields = 'date' | 'type' | 'amount' | 'category';

export function PaginatedTable({ entries, onDelete, onEdit }: PaginatedTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    dateFrom: '',
    dateTo: ''
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

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(entry => {
        const description = entry.expenseDetails?.description?.toLowerCase() || '';
        const txn = entry.txn?.toLowerCase() || '';
        const tokenName = entry.type === 'Trades' 
          ? (entry.tradeDetails as TradeDetails)?.tokenName?.toLowerCase() || ''
          : '';
        const category = entry.expenseDetails?.category?.toLowerCase() || '';

        return description.includes(searchLower) || 
               txn.includes(searchLower) || 
               tokenName.includes(searchLower) ||
               category.includes(searchLower);
      });
    }

    // Type filter
    if (filters.type) {
      result = result.filter(entry => entry.type === filters.type);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(entry => new Date(entry.date) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
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
    <div className="space-y-4 bg-secondary p-4 rounded-lg">
      {/* Filters Section */}
      <div className="space-y-4">
        {/* Search and Type Filter Row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              type: e.target.value as TransactionType || undefined 
            }))}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
          >
            <option value="">All Types</option>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
            <option value="Trades">Trades</option>
            <option value="Claims">Claims</option>
          </select>
        </div>

        {/* Date Range Filter Row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            />
          </div>
          
          {/* Clear Filters Button */}
          {(filters.search || filters.type || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ search: '' })}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2">
          {filters.type && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {filters.type}
              <button
                onClick={() => setFilters(prev => ({ ...prev, type: undefined }))}
                className="hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.dateFrom && filters.dateTo && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {format(new Date(filters.dateFrom), 'MMM d, yyyy')} - {format(new Date(filters.dateTo), 'MMM d, yyyy')}
              <button
                onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                className="hover:text-primary/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              {['Date', 'Type', 'Amount', 'Category'].map((header) => (
                <th
                  key={header.toLowerCase()}
                  onClick={() => handleSort(header.toLowerCase() as SortableFields)}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/80"
                >
                  {header}
                  {sortField === header.toLowerCase() && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                TXN
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {currentEntries.map((entry) => (
              <tr key={String(entry.id)} className="group hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {entry.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  ${entry.amount?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {entry.type === 'Expense' ? entry.expenseDetails?.category || '-' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {entry.txn ? (
                    <a
                      href={entry.txn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:text-primary/80 hover:underline"
                    >
                      <span className="truncate max-w-[150px]">View</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center justify-end gap-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10 transition-colors"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(Number(entry.id))}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}