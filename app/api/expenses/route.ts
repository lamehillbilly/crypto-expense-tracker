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
    const { type, amount, date, txn, details } = body;

    // Debug log
    console.log('Received data:', { type, amount, date, txn, details });

    // Validate required fields
    if (!type || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the entry
    const entry = await prisma.entry.create({
      data: {
        type,
        amount: Number(amount),
        date: new Date(date),
        txn: txn || null,
        expenseDetails: details,
        status: 'completed',
        purchaseAmount: 0,
      }
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}