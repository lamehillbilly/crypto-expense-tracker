'use client';
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function DistributionOverview({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-card rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <h2 className="text-lg font-semibold">Distribution Overview</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(var(${entry.color}))`}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Legend 
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 