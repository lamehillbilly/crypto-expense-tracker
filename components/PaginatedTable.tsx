// components/PaginatedTable.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { Entry, ExpenseDetails, TradeDetails, TransactionType } from '@/types';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface PaginatedTableProps {
  entries: Entry[];
  onDelete: (id: number) => void;
  onEdit: (entry: Entry) => void;
}

interface Filters {
  search: string;
  type?: TransactionType;
}

type SortableFields = 'date' | 'type' | 'amount' | 'category';

export function PaginatedTable({ entries, onDelete, onEdit }: PaginatedTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<Filters>({ search: '' });
  const [sortField, setSortField] = useState<SortableFields>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(entry => {
        const description = entry.expenseDetails?.description?.toLowerCase() || '';
        const txn = entry.txn?.toLowerCase() || '';
        const tokenName = entry.type === 'Trades' 
          ? (entry.tradeDetails as TradeDetails)?.tokenName?.toLowerCase() || ''
          : '';

        return description.includes(searchLower) || 
               txn.includes(searchLower) || 
               tokenName.includes(searchLower);
      });
    }

    if (filters.type) {
      result = result.filter(entry => entry.type === filters.type);
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
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Type', 'Amount', 'Category'].map((header) => (
                <th
                  key={header.toLowerCase()}
                  onClick={() => handleSort(header.toLowerCase() as SortableFields)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {header}
                  {sortField === header.toLowerCase() && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TXN
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentEntries.map((entry) => (
              <tr key={String(entry.id)} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${entry.amount?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.type === 'Expense' ? entry.expenseDetails?.category || '-' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.txn ? (
                    <a
                      href={entry.txn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      title={entry.txn}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(entry)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(Number(entry.id))}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
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
          <span className="text-sm text-gray-700">
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