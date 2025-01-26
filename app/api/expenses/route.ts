// app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.entry.findMany({
      where: {
        type: {
          in: ['Expense', 'Income']
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, amount, date, txn, expenseDetails } = body;

    const entry = await prisma.entry.create({
      data: {
        type,
        amount: Number(amount),
        date: new Date(date),
        txn: txn || null,
        expenseDetails: expenseDetails || null,
        purchaseAmount: 0, // Default value as per your schema
        status: 'completed'
      }
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}