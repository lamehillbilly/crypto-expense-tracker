// app/api/entries/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    const trades = await prisma.trade.findMany({
      where: {
        status: 'open'
      }
    });

    return NextResponse.json({ entries, trades });
  } catch {
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (data.type === 'Trades' && data.status === 'open') {
      const trade = await prisma.trade.create({
        data: {
          tokenName: data.tokenName,
          purchaseAmount: data.purchaseAmount,
          purchaseDate: new Date(data.purchaseDate).toISOString(),
          status: 'open'
        }
      });
      return NextResponse.json(trade);
    }

    const entry = await prisma.entry.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        txn: data.txn,
        tokenName: data.tokenName,
        pnl: data.pnl,
        daysHeld: data.daysHeld,
        expenseDetails: data.expenseDetails,
        claimDetails: data.claimDetails,
        purchaseAmount: data.purchaseAmount || 0,
        purchaseDate: new Date(data.purchaseDate || data.date).toISOString(),
        status: data.status || 'open'
      }
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: 'Failed to save entries' }, { status: 500 });
  }
}