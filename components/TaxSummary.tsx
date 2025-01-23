// components/TaxSummary.tsx
import React, { useMemo, useState } from 'react';
import { Entry, TaxSummary as TaxSummaryType } from '@/types';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

interface TaxSummaryProps {
  entries: Entry[];
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({ entries }) => {
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [isExpanded, setIsExpanded] = useState(true);

    const taxSummary = useMemo(() => {
        const summary: TaxSummaryType = {
          totalHeld: 0,
          byMonth: {},
          totalClaims: 0,
          averageTaxRate: 0,
          byYear: {}
        };
  

    let totalTaxPercentage = 0;
    let taxEntryCount = 0;

    entries.forEach(entry => {
      if (entry.type === 'Claims') {
        if (entry.claimDetails?.heldForTaxes && entry.claimDetails.taxAmount) {
          const date = new Date(entry.date);
          const year = date.getFullYear().toString();
          const monthYear = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });

          // Update summary
          summary.totalHeld += entry.claimDetails.taxAmount;
          summary.byMonth[monthYear] = (summary.byMonth[monthYear] || 0) + entry.claimDetails.taxAmount;
          
          // Track by year for filtering
          if (!summary.byYear[year]) {
            summary.byYear[year] = 0;
          }
          summary.byYear[year] += entry.claimDetails.taxAmount;
          
          if (entry.claimDetails.taxPercentage) {
            totalTaxPercentage += entry.claimDetails.taxPercentage;
            taxEntryCount++;
          }
        }
        summary.totalClaims++;
      }
    });

    summary.averageTaxRate = taxEntryCount > 0 ? totalTaxPercentage / taxEntryCount : 0;

    return summary;
  }, [entries]);

  const filteredMonths = useMemo(() => {
    return Object.entries(taxSummary.byMonth)
      .filter(([month]) => {
        if (yearFilter === 'all') return true;
        return month.includes(yearFilter);
      })
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [taxSummary.byMonth, yearFilter]);

  const years = useMemo(() => {
    return Object.keys(taxSummary.byYear).sort((a, b) => b.localeCompare(a));
  }, [taxSummary.byYear]);

  const downloadTaxReport = () => {
    const report = {
      summary: {
        totalTaxHeld: taxSummary.totalHeld,
        totalClaims: taxSummary.totalClaims,
        averageTaxRate: taxSummary.averageTaxRate,
      },
      monthlyBreakdown: taxSummary.byMonth,
      yearlyBreakdown: taxSummary.byYear,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tax Summary</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">Total Tax Held</p>
              <p className="text-2xl font-bold">${taxSummary.totalHeld.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Total Claims</p>
              <p className="text-2xl font-bold">{taxSummary.totalClaims}</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-purple-600">Average Tax Rate</p>
              <p className="text-2xl font-bold">{taxSummary.averageTaxRate.toFixed(1)}%</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded cursor-pointer" onClick={downloadTaxReport}>
              <p className="text-sm text-orange-600 flex items-center">
                Download Report
                <Download className="ml-2 h-4 w-4" />
              </p>
              <p className="text-2xl font-bold">JSON</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredMonths.map(([month, amount]) => (
                <div
                  key={month}
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                >
                  <span className="font-medium">{month}</span>
                  <span className="text-green-600">${amount.toFixed(2)}</span>
                </div>
              ))}
              
              {filteredMonths.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No tax entries found for this period
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};