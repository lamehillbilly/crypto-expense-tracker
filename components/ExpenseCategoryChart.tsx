'use client';
import React, { useState } from 'react';
import { Entry } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  entries: Entry[];
}

export function ExpenseCategoryChart({ entries }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  const expensesByCategory = entries
    .filter(entry => entry.type === 'Expense')
    .reduce((acc: { [key: string]: number }, entry) => {
      const category = entry.expenseDetails?.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + entry.amount;
      return acc;
    }, {});

  const data = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    amount: value
  }));

  return (
    <div className="w-full bg-card rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <h2 className="text-lg font-semibold">Expense Categories</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 pt-0 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? 'hsl(var(--muted))' : 'hsl(var(--border))'}
              />
              <XAxis 
                dataKey="name" 
                stroke={isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
              />
              <YAxis 
                stroke={isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'}
              />
              <Tooltip 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 