'use client';
import React from 'react';
import { Entry } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  entries: Entry[];
}

export function ExpenseCategoryChart({ entries }: Props) {
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
} 