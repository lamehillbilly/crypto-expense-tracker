// app/api/entries/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Entry, Trade } from '@/types';

export async function GET() {
  try {
    const [entries, trades] = await Promise.all([
      prisma.entry.findMany({
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.trade.findMany({
        where: {
          status: 'open'
        }
      })
    ]);

    return NextResponse.json({ entries, trades });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { entries, trades } = await request.json();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create new entries
      for (const entry of entries) {
        await tx.entry.create({
          data: {
            type: entry.type,
            amount: entry.amount,
            date: new Date(entry.date),
            txn: entry.txn || null,
            tokenName: entry.tokenName || null,
            pnl: entry.pnl || null,
            daysHeld: entry.daysHeld || null,
            expenseDetails: entry.expenseDetails || null,
            claimDetails: entry.claimDetails || null,
            purchaseAmount: entry.purchaseAmount || 0,
            purchaseDate: new Date(entry.purchaseDate || entry.date).toISOString(),
            status: entry.status || 'open'
          }
        });
      }

      // Create new trades
      for (const trade of trades) {
        await tx.trade.create({
          data: {
            tokenName: trade.tokenName,
            purchaseAmount: trade.purchaseAmount,
            purchaseDate: new Date(trade.purchaseDate).toISOString(),
            status: trade.status,
            closeAmount: trade.closeAmount || null,
            closeDate: trade.closeDate ? new Date(trade.closeDate).toISOString() : null,
            pnl: trade.pnl || null,
            daysHeld: trade.daysHeld || null
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}