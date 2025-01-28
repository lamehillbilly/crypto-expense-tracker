import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { getAddress } from 'ethers';
import TokenLogo from './TokenLogo';
import { Checkbox } from "@/components/ui/checkbox";

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

export interface GroupedData {
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
  const [tokenMetadata, setTokenMetadata] = useState({});
  

  // Default color generator for fallback
  const getDefaultTokenColor = (index: number): string => {
    // Base HSL colors with higher luminosity for dark backgrounds
    const baseColors = [
      'hsl(210, 100%, 65%)',  // Bright blue
      'hsl(150, 100%, 65%)',  // Bright green
      'hsl(280, 100%, 70%)',  // Bright purple
      'hsl(30, 100%, 65%)',   // Bright orange
      'hsl(340, 100%, 70%)',  // Bright pink
      'hsl(180, 100%, 65%)',  // Bright cyan
      'hsl(60, 100%, 65%)',   // Bright yellow
      'hsl(0, 100%, 65%)',    // Bright red
      'hsl(240, 100%, 70%)',  // Bright indigo
      'hsl(120, 100%, 65%)',  // Bright emerald
      'hsl(300, 100%, 70%)',  // Bright magenta
      'hsl(90, 100%, 65%)',   // Bright lime
    ];

    // Generate variations by rotating hue and adjusting saturation/lightness
    const variations = baseColors.flatMap(color => {
      const hue = parseInt(color.match(/hsl\((\d+)/)?.[1] || '0');
      return [
        color,
        `hsl(${(hue + 15) % 360}, 90%, 70%)`,
        `hsl(${(hue + 30) % 360}, 85%, 65%)`,
      ];
    });

    // Ensure we never run out of colors by cycling through variations
    const colorIndex = index % variations.length;
    const baseColor = variations[colorIndex];

    // Add slight opacity variation to differentiate repeated colors
    const cycle = Math.floor(index / variations.length);
    const opacity = Math.max(0.7, 1 - cycle * 0.15);

    return baseColor.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
  };

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
          // Get day of week (0-6, Sunday-Saturday)
          const dayOfWeek = date.getUTCDay();
          const daysToThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
          const thursday = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() - daysToThursday,
            0, 0, 0, 0
          ));
          key = thursday.toISOString().split('T')[0];
          break;
        case 'month':
          // Group by first day of month, adjusting for UTC
          const monthDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1, // Add 1 to get correct month
            1,
            0, 0, 0, 0
          ));
          key = monthDate.toISOString().split('T')[0];
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
      // Adjust the month display
      const monthDate = new Date(dateStr); // Parse the ISO string
      return monthDate.toLocaleDateString('default', { 
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
    isStacked = false,
    timeframe
  }: {
    active: boolean;
    payload?: Array<any>;
    label?: string;
    isStacked?: boolean;
    timeframe: 'day' | 'week' | 'month';
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      
      // Format date range for weekly/monthly view
      const formatDateRange = (dateStr: string) => {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        
        switch (timeframe) {
          case 'week':
            const thursday = new Date(dateStr);
            const nextWed = new Date(thursday);
            nextWed.setDate(thursday.getDate() + 6);
            return `${thursday.toLocaleDateString('default', { 
              month: 'short',
              day: 'numeric'
            })} - ${nextWed.toLocaleDateString('default', { 
              month: 'short',
              day: 'numeric'
            })}`;
          
          case 'month':
            const monthDate = new Date(dateStr); // Parse the ISO string
            return monthDate.toLocaleDateString('default', { 
              month: 'short',
              year: 'numeric'
            });
            
          default:
            return formatDate(dateStr);
        }
      };

      return (
        <Card className="p-3 min-w-[200px] border shadow-lg bg-muted/75">
          <p className="font-semibold border-b pb-2 mb-2">
            {formatDateRange(label || '')}
          </p>
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
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{
                fill: "hsl(var(--chart-1))",
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Tooltip content={<CustomTooltip timeframe={timeframe} />} />
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
              <Tooltip content={(props) => <CustomTooltip {...props} isStacked={true} timeframe={timeframe} />} />
              {tokenSymbols
                .sort((a, b) => {
                  const totalA = chartData.reduce((sum, entry) => sum + (entry.tokenTotals?.[a] || 0), 0);
                  const totalB = chartData.reduce((sum, entry) => sum + (entry.tokenTotals?.[b] || 0), 0);
                  return totalB - totalA; // Changed to sort descending
                })
                .filter(symbol => // Add this filter
                  chartData.some(entry => (entry.tokenTotals?.[symbol] || 0) > 0)
                )
                .map((symbol, index) => (
                  <Bar
                    key={symbol}
                    dataKey={`tokenTotals.${symbol}`}
                    name={symbol}
                    stackId="tokens"
                    fill={getDefaultTokenColor(index)}  // Remove tokenColors reference
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