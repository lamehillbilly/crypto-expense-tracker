// components/ClaimsChart.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TokenClaim } from '@/types';

interface ChartData {
  total: number;
  claims: TokenClaim[];
  date: string;
  tokens: Record<string, number>;
}

interface ChartProps {
  data: ChartData[];
  timeframe: 'day' | 'week' | 'month';
}

function ClaimsChart({ data, timeframe }: ChartProps) {
  const chartData = useMemo(() => {
    const aggregatedData = new Map<string, ChartData>();
    
    data.forEach((day) => {
      let dateKey = day.date;
      const currentDate = new Date(day.date);

      if (timeframe === 'month') {
        dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeframe === 'week') {
        const dayOfWeek = currentDate.getDay();
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(currentDate.setDate(diff));
        dateKey = monday.toISOString().split('T')[0];
      }

      if (!aggregatedData.has(dateKey)) {
        aggregatedData.set(dateKey, {
            date: dateKey,
            total: 0,
            claims: [],
            tokens: {}
        });
      }

      const periodData = aggregatedData.get(dateKey)!;

      // Aggregate claims for this period
      day.claims.forEach((claim: TokenClaim) => {
        if (claim.tokenClaims && Array.isArray(claim.tokenClaims) && claim.tokenClaims.length > 0) {
          claim.tokenClaims.forEach((tokenClaim: TokenClaim) => {
            const { tokenSymbol, amount } = tokenClaim;
            periodData.tokens[tokenSymbol] = (periodData.tokens[tokenSymbol] || 0) + amount;
          });
        } else {
          periodData.tokens['Unspecified'] = (periodData.tokens['Unspecified'] || 0) + claim.totalAmount;
        }
        periodData.total += claim.totalAmount;
      });
    });

    return Array.from(aggregatedData.values());
  }, [data, timeframe]);

  const tokenSymbols = useMemo(() => {
    const symbols = new Set<string>();
    chartData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date' && key !== 'total') {
          symbols.add(key);
        }
      });
    });
    return Array.from(symbols);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No claims data available
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    switch (timeframe) {
      case 'month':
        const [year, month] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { 
          month: 'short',
          year: '2-digit'
        });
      case 'week':
        return `Week of ${new Date(dateStr).toLocaleDateString('default', { 
          month: 'short',
          day: 'numeric'
        })}`;
      default:
        return new Date(dateStr).toLocaleDateString('default', { 
          month: 'short',
          day: 'numeric'
        });
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />
        <YAxis 
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
          labelFormatter={formatDate}
        />
        <Legend />
        {tokenSymbols.map((symbol, index) => (
          <Bar
            key={symbol}
            dataKey={symbol}
            stackId="a"
            name={symbol}
            fill={`hsl(${(index * 137.508) % 360}, 70%, 50%)`}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ClaimsChart;