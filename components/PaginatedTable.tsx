// components/PaginatedTable.tsx
import React, { useState, useMemo } from 'react';
import { Entry } from '@/types';
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react';

interface PaginatedTableProps {
  entries: Entry[];
  itemsPerPage?: number;
}

type SortField = 'date' | 'type' | 'amount' | 'pnl';
type SortDirection = 'asc' | 'desc';

export const PaginatedTable: React.FC<PaginatedTableProps> = ({ 
  entries,
  itemsPerPage = 10 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Apply filters
    if (filters.type) {
      result = result.filter(entry => entry.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(entry => 
        entry.tokenName?.toLowerCase().includes(searchLower) ||
        entry.txn?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateRange.start) {
      result = result.filter(entry => 
        new Date(entry.date) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange.end) {
      result = result.filter(entry => 
        new Date(entry.date) <= new Date(filters.dateRange.end)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'pnl':
          comparison = (a.pnl || 0) - (b.pnl || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, sortField, sortDirection, filters]);

  const totalPages = Math.ceil(filteredAndSortedEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentEntries = filteredAndSortedEntries.slice(startIndex, endIndex);
  const pageSizeOptions = [5, 10, 25, 50];

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);
  const renderDetails = (entry: Entry) => {
    if (entry.type === 'Claims' && entry.claimDetails?.tokenTags) {
      return (
        <div className="flex flex-wrap gap-1">
          {entry.claimDetails.tokenTags.map(token => (
            <span 
              key={token.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {token.symbol}
            </span>
          ))}
          {entry.claimDetails.heldForTaxes && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Tax Hold: ${entry.claimDetails.taxAmount?.toFixed(2)}
            </span>
          )}
        </div>
      );
    }

    if (entry.type === 'Trades') {
      return entry.tokenName ? `Token: ${entry.tokenName}` : '-';
    }

    if (entry.type === 'Expense' && entry.expenseDetails) {
      return `${entry.expenseDetails.description}${entry.expenseDetails.vendor ? ` (${entry.expenseDetails.vendor})` : ''}`;
    }

    return entry.txn ? `TXN: ${entry.txn}` : '-';
  };
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9 w-full p-2 border rounded"
          />
        </div>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="p-2 border rounded"
        >
          <option value="">All Types</option>
          {['Expense', 'Held for Taxes', 'Trades', 'Income', 'Claims'].map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateRange.start}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, start: e.target.value }
          }))}
          className="p-2 border rounded"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.dateRange.end}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, end: e.target.value }
          }))}
          className="p-2 border rounded"
          placeholder="End Date"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th 
                className="p-2 text-right cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Amount
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="p-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.map(entry => (
              <tr key={entry.id} className="border-b">
                <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-2">{entry.type}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  ${entry.amount.toFixed(2)}
                  {entry.pnl !== undefined && (
                    <span 
                      className={`ml-2 ${entry.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
                      title={entry.daysHeld ? `${entry.daysHeld} day hold` : undefined}
                    >
                      (P/L: ${entry.pnl.toFixed(2)})
                    </span>
                  )}
                </td>
                <td className="p-2">
                  {renderDetails(entry)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded p-1 text-sm"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedEntries.length)} of {filteredAndSortedEntries.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};