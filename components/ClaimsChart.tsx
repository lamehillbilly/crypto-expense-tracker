import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { CartesianGrid, Line, LineChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartLegend, ChartTooltip, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAddress } from 'ethers';

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

  const [tokenColors, setTokenColors] = useState<Record<string, string>>({});
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

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
  const getImageColor = useCallback(async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (context) {
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const colorCounts: Record<string, number> = {};
          
          // Sample pixels and count distinct colors
          for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3];
            if (alpha > 128) { // Only consider mostly opaque pixels
              const r = imageData[i];
              const g = imageData[i + 1];
              const b = imageData[i + 2];
              
              // Skip white, black, and very light/dark colors
              if ((r + g + b) > 740 || (r + g + b) < 20) continue;
              
              const key = `${r},${g},${b}`;
              colorCounts[key] = (colorCounts[key] || 0) + 1;
            }
          }
          
          // Find the most common color
          let maxCount = 0;
          let dominantColor = '0,0,0';
          
          Object.entries(colorCounts).forEach(([color, count]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantColor = color;
            }
          });
          
          const [r, g, b] = dominantColor.split(',').map(Number);
          resolve(`rgba(${r}, ${g}, ${b}, 0.85)`);
        } else {
          resolve(getTokenColor(0));
        }
      };
      
      img.onerror = () => {
        resolve(getTokenColor(0));
      };
      
      img.src = imageUrl;
    });
  }, []);

  // Token logo URL generator with checksummed address
  const getTokenLogoUrl = useCallback((tokenId: string) => {
    if (!tokenId) return '';
    try {
      const checksumAddress = getAddress(tokenId);
      return `https://raw.githubusercontent.com/RamsesExchange/ramses-assets/main/blockchains/avalanche/assets/${checksumAddress}/logo.png`;
    } catch (error) {
      console.error('Error converting address to checksum format:', error);
      return '';
    }
  }, []);



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
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await fetch('https://pharaoh-api-production.up.railway.app/tokens');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tokens: TokenMetadata[] = await response.json();
        
        const tokenMap: Record<string, TokenMetadata> = {};
        const colorPromises: Promise<[string, string]>[] = [];

        tokens.forEach(token => {
          if (token.symbol && token.id) {
            tokenMap[token.symbol] = token;
            const logoUrl = getTokenLogoUrl(token.id);
            colorPromises.push(
              getImageColor(logoUrl).then(color => [token.symbol, color])
            );
          }
        });

        setTokenMetadata(tokenMap);

        // Wait for all colors to be extracted
        const colors = await Promise.all(colorPromises);
        const colorMap = Object.fromEntries(colors);
        setTokenColors(colorMap);
      } catch (error) {
        console.error('Error fetching token metadata:', error);
      }
    };

    fetchTokenData();
  }, [getTokenLogoUrl, getImageColor]);

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

  const formatValue = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  // Custom components
  const CustomTooltip = ({ 
    active, 
    payload, 
    label,
    isStacked = false
  }: { 
    active?: boolean; 
    payload?: Array<{ payload: any; value: number; name: string; color: string }>; 
    label?: string;
    isStacked?: boolean;
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
                  <span>{formatValue(data.trend)}</span>
                </p>
              </>
            ) : (
              <div className="space-y-1">
                {payload.map((entry, index) => {
                  const token = tokenMetadata[entry.name];
                  return (
                    <p key={index} className="text-sm flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        {token && (
                          <img 
                            src={getTokenLogoUrl(token.id)}
                            alt={token.symbol}
                            className="w-4 h-4 rounded-full"
                            onError={(e) => {
                              console.log(`Failed to load logo for ${token.symbol}:`, getTokenLogoUrl(token.id));
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Claims Overview</CardTitle>
        <CardDescription>
          {timeframe === 'day' ? 'Daily' : 
           timeframe === 'week' ? 'Weekly' : 
           'Monthly'} claim analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Token Breakdown</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ChartContainer config={chartConfig}>
              <div className="h-[350px]">
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
                    <Line
                      type="monotone"
                      dataKey="trend"
                      name="Trend"
                      stroke="var(--color-trend)"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="breakdown">
            <ChartContainer config={chartConfig}>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
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
                        // Get the total value for each token across all dates
                        const totalA = chartData.reduce((sum, entry) => sum + (entry.tokenTotals[a] || 0), 0);
                        const totalB = chartData.reduce((sum, entry) => sum + (entry.tokenTotals[b] || 0), 0);
                        // Sort in ascending order (smaller values at bottom)
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
                            index === tokenSymbols.length - 1 ? 4 : 0,  // top-left: round only if it's the last bar
                            index === tokenSymbols.length - 1 ? 4 : 0,  // top-right: round only if it's the last bar
                            index === 1 ? 4 : 0,                        // bottom-right: round only if it's the first bar
                            index === 1 ? 4 : 0                         // bottom-left: round only if it's the first bar
                          ]}
                        />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TabbedClaimsChart;