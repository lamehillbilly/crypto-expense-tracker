import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

interface ClaimData {
  date: string;
  tokenTotals: Record<string, number>;
  totalAmount: number;
}

interface ChartProps {
  data: ClaimData[];
  timeframe: 'day' | 'week' | 'month';
}

interface ChartData {
  date: string;
  total: number;
  tokenTotals: Record<string, number>;
}

interface TokenTotal {
  token: string;
  amount: number;
}

interface GroupedData {
  date: string;
  total: number;
  tokenTotals: Record<string, number>;
}

const chartConfig = {
  total: {
    label: "Total Claims",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const ClaimsChart = ({ data = [], timeframe }: ChartProps) => {
  const chartData = useMemo(() => {
    // Sort data by date in ascending order
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group data by timeframe
    const groupedData: Record<string, GroupedData> = sortedData.reduce((acc, item) => {
      const date = new Date(item.date);
      // Adjust for timezone offset
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      let key: string;
      
      switch (timeframe) {
        case 'week':
          // Get Monday of the week
          const monday = new Date(localDate);
          monday.setDate(date.getDate() - date.getDay() + 1);
          key = monday.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${localDate.getMonth() + 1}/${localDate.getFullYear()}`;
          break;
        default:
          key = localDate.toISOString().split('T')[0];
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          total: 0,
          tokenTotals: {}
        };
      }

      acc[key].total += item.totalAmount;
      // Aggregate token totals
      if (item.tokenTotals) {
        Object.entries(item.tokenTotals).forEach(([token, amount]) => {
          acc[key].tokenTotals[token] = (acc[key].tokenTotals[token] || 0) + amount;
        });
      }

      return acc;
    }, {} as Record<string, GroupedData>);

    return Object.values(groupedData);
  }, [data, timeframe]);

  const formatDate = (dateStr: string) => {
    // Parse date string and adjust for local timezone
    const date = new Date(dateStr);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    if (timeframe === 'month') {
      return localDate.toLocaleDateString('default', { 
        month: 'short',
        year: 'numeric'
      });
    }
    // For daily and weekly views
    return localDate.toLocaleDateString('default', { 
      month: 'short',
      day: 'numeric',
      year: timeframe === 'week' ? 'numeric' : undefined
    });
  };

  const formatValue = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: Array<{ payload: ChartData; value: number }>; 
    label?: string; 
  }) => {
    if (active && payload && payload.length > 0) {
      const data: ChartData = payload[0].payload;
      
      // Convert token totals to array for rendering
      const tokenTotals: TokenTotal[] = Object.entries(data.tokenTotals || {}).map(([token, amount]) => ({
        token,
        amount
      }));

      return (
        <div className="bg-secondary border border-gray-200 p-4 rounded-lg shadow-lg min-w-[200px]">
          <p className="font-semibold border-b pb-2 mb-2">{formatDate(label || '')}</p>
          <div className="space-y-2">
            {/* Total amount */}
            <p className="text-sm flex justify-between items-center font-medium">
              <span>Total:</span>
              <span>{formatValue(data.total)}</span>
            </p>
            {/* Token breakdown */}
            {data.tokenTotals && Object.keys(data.tokenTotals).length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Token Breakdown:</p>
                {tokenTotals
                  .sort((a, b) => b.amount - a.amount) // Sort by amount descending
                  .map(({ token, amount }) => (
                    <p key={token} className="text-sm flex justify-between items-center">
                      <span>{token}:</span>
                      <span>{formatValue(amount)}</span>
                    </p>
                  ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center text-gray-500">
        No claims data available
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Claims Overview</CardTitle>
        <CardDescription>
          {timeframe === 'day' ? 'Daily' : 
           timeframe === 'week' ? 'Weekly' : 
           'Monthly'} claim totals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  minTickGap={timeframe === 'month' ? 60 : 30}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={timeframe === 'month' ? 0 : 'preserveStartEnd'}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={formatValue}
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Claims"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--color-total)",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ClaimsChart;