'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Entry } from '@/types';

interface Props {
  entries: Entry[];
}

const chartConfig = {
  amount: {
    label: 'Amount',
  },
  food: {
    label: 'Food & Dining',
    color: 'hsl(var(--chart-1))',
  },
  utilities: {
    label: 'Utilities',
    color: 'hsl(var(--chart-2))',
  },
  transportation: {
    label: 'Transportation',
    color: 'hsl(var(--chart-3))',
  },
  entertainment: {
    label: 'Entertainment',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
};

export function ExpenseCategoryChart({ entries }: Props) {
  const chartData = useMemo(() => {
    const expensesByCategory = entries
      .filter(entry => entry.type === 'Expense')
      .reduce((acc: { [key: string]: number }, entry) => {
        const category = entry.expenseDetails?.category || 'Other';
        acc[category] = (acc[category] || 0) + entry.amount;
        return acc;
      }, {});

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      fill: chartConfig[category.toLowerCase()]?.color || chartConfig.other.color,
    }));
  }, [entries]);

  const totalExpenses = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  // Calculate month-over-month change
  const monthOverMonthChange = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentMonthExpenses = entries
      .filter(entry => 
        entry.type === 'Expense' && 
        new Date(entry.date).getMonth() === currentMonth
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    const lastMonthExpenses = entries
      .filter(entry => 
        entry.type === 'Expense' && 
        new Date(entry.date).getMonth() === currentMonth - 1
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    return lastMonthExpenses ? 
      ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
  }, [entries]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>Current Month Overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-64"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          ${totalExpenses.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Expenses
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {monthOverMonthChange > 0 ? (
            <>
              Spending up by {Math.abs(monthOverMonthChange).toFixed(1)}% this month
              <TrendingUp className="h-4 w-4 text-destructive" />
            </>
          ) : (
            <>
              Spending down by {Math.abs(monthOverMonthChange).toFixed(1)}% this month
              <TrendingDown className="h-4 w-4 text-primary" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total expenses for the current month
        </div>
      </CardFooter>
    </Card>
  );
}