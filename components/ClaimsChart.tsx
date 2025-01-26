import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { getAddress } from 'ethers';
import TokenLogo from './TokenLogo';

interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
}

interface ClaimData {
  date: string;
  tokenTotals: Record<string, number>;
  totalAmount: number;
}

interface ChartProps {
  data: ClaimData[];
  timeframe: 'day' | 'week' | 'month';
}

interface GroupedData {
  date: string;
  total: number;
  tokenTotals: Record<string, number>;
  trend?: number;
}

const chartConfig = {
  total: {
    label: "Total Claims",
    color: "hsl(var(--chart-1))",
  },
  trend: {
    label: "Trend",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function TabbedClaimsChart({ data = [], timeframe }: ChartProps) {

  const [activeView, setActiveView] = useState('overview');
  const [tokenColors, setTokenColors] = useState({});
  const [tokenMetadata, setTokenMetadata] = useState({});
  

  const getTokenColor = (index: number): string => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--chart-6))',
      'hsl(var(--chart-7))',
      'hsl(var(--chart-8))',
    ];
    return colors[index % colors.length];
  };

  // Color extraction function
  

  // Token logo URL generator with checksummed address
  

  // Default color generator for fallback
  const getDefaultTokenColor = (index: number): string => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--chart-6))',
      'hsl(var(--chart-7))',
      'hsl(var(--chart-8))',
    ];
    return colors[index % colors.length];
  };

  // Fetch token metadata and colors

  // Chart data processing
  const chartData = useMemo(() => {
    // Sort data by date in ascending order
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group data by timeframe
    const groupedData: Record<string, GroupedData> = sortedData.reduce((acc, item) => {
      const date = new Date(item.date);
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      let key: string;
      
      switch (timeframe) {
        case 'week':
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
      if (item.tokenTotals) {
        Object.entries(item.tokenTotals).forEach(([token, amount]) => {
          acc[key].tokenTotals[token] = (acc[key].tokenTotals[token] || 0) + amount;
        });
      }

      return acc;
    }, {} as Record<string, GroupedData>);

    const dataArray = Object.values(groupedData);
    const periods = timeframe === 'day' ? 7 : timeframe === 'week' ? 4 : 3;
    
    return dataArray.map((item, index) => {
      const startIndex = Math.max(0, index - periods + 1);
      const endIndex = index + 1;
      const subset = dataArray.slice(startIndex, endIndex);
      const average = subset.reduce((sum, curr) => sum + curr.total, 0) / subset.length;

      return {
        ...item,
        trend: average
      };
    });
  }, [data, timeframe]);

  // Token symbols processing
  const tokenSymbols = useMemo(() => {
    const symbols = new Set<string>();
    data.forEach(entry => {
      if (entry.tokenTotals) {
        Object.keys(entry.tokenTotals).forEach(symbol => symbols.add(symbol));
      }
    });
    return Array.from(symbols);
  }, [data]);
  
  // Formatting functions
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    if (timeframe === 'month') {
      return localDate.toLocaleDateString('default', { 
        month: 'short',
        year: 'numeric'
      });
    }
    return localDate.toLocaleDateString('default', { 
      month: 'short',
      day: 'numeric',
      year: timeframe === 'week' ? 'numeric' : undefined
    });
  };
  const total = useMemo(
    () => ({
      overview: chartData.reduce((acc, curr) => acc + (curr.total || 0), 0),
      breakdown: chartData.reduce((acc, curr) => acc + (curr.total || 0), 0),
    }),
    [chartData]
  );
  const formatValue = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  const chartConfig = {
    overview: {
      label: "Overview",
      color: "hsl(var(--chart-1))",
    },
    breakdown: {
      label: "Token Breakdown",
      color: "hsl(var(--chart-2))",
    },
  };

  // Custom components
  const CustomTooltip = ({ 
    active, 
    payload, 
    label,
    isStacked = false
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      return (
        <Card className="p-3 min-w-[200px] border shadow-lg bg-muted/75">
          <p className="font-semibold border-b pb-2 mb-2">{formatDate(label || '')}</p>
          <div className="space-y-2">
            {!isStacked ? (
              <>
                <p className="text-sm flex justify-between items-center font-medium">
                  <span>Total:</span>
                  <span>{formatValue(data.total)}</span>
                </p>
                <p className="text-sm flex justify-between items-center font-medium">
                  <span>Trend:</span>
                  <span>{formatValue(data.trend || 0)}</span>
                </p>
              </>
            ) : (
              <div className="space-y-1">
                {payload.map((entry: { name: string; color: string; value: number }, index: number) => {
                  const token = tokenMetadata[entry.name as keyof typeof tokenMetadata];
                  return (
                    <p key={index} className="text-sm flex justify-between items-center">
                      <span className="flex items-center gap-2">
                      {token && (
                        <TokenLogo 
                          tokenId={token.id}
                          symbol={token.symbol}
                          size="sm"
                        />
)}
                        <span style={{ color: entry.color }}>{entry.name}:</span>
                      </span>
                      <span style={{ color: entry.color }}>{formatValue(entry.value)}</span>
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      );
    }
    return null;
  };


  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center text-gray-500">
        No claims data available
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Claims Analysis</CardTitle>
          <CardDescription>
            {timeframe === 'day' ? 'Daily' : timeframe === 'week' ? 'Weekly' : 'Monthly'} claim overview
          </CardDescription>
        </div>
        <div className="flex">
          {['overview', 'breakdown'].map((view) => (
            <button
              key={view}
              data-active={activeView === view}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveView(view)}
            >
              <span className="text-lg text-primary">
                {chartConfig[view as keyof typeof chartConfig].label}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {activeView === 'overview' ? (
            <LineChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
              />
              <YAxis
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-overview)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-overview)",
                }}
                activeDot={{
                  r: 6,
                }}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="var(--color-trend)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Tooltip content={<CustomTooltip />} />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
              />
              <YAxis
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} isStacked={true} />} />
              {tokenSymbols
                .sort((a, b) => {
                  const totalA = chartData.reduce((sum, entry) => sum + (entry.tokenTotals?.[a] || 0), 0);
                  const totalB = chartData.reduce((sum, entry) => sum + (entry.tokenTotals?.[b] || 0), 0);
                  return totalA - totalB;
                })
                .map((symbol, index) => (
                  <Bar
                    key={symbol}
                    dataKey={`tokenTotals.${symbol}`}
                    name={symbol}
                    stackId="tokens"
                    fill={tokenColors[symbol] || getDefaultTokenColor(index)}
                    radius={[
                      index === tokenSymbols.length - 1 ? 4 : 0,
                      index === tokenSymbols.length - 1 ? 4 : 0,
                      index === 0 ? 4 : 0,
                      index === 0 ? 4 : 0
                    ]}
                  />
                ))}
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default TabbedClaimsChart;