import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { Entry, Trade } from '@/types';

export async function POST(request: Request) {
  try {
    const { entries, trades } = await request.json();
    // Use a transaction to ensure data consistency
    const prisma = new PrismaClient();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing data
      await tx.entry.deleteMany();
      await tx.trade.deleteMany();

      // Insert new entries
      if (entries && entries.length > 0) {
        await tx.entry.createMany({
          data: entries.map((entry: Entry) => ({
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
          }))
        });
      }

      // Insert new trades
      if (trades && trades.length > 0) {
        await tx.trade.createMany({
          data: trades.map((trade: Trade) => ({
            tokenName: trade.tokenName,
            purchaseAmount: trade.purchaseAmount,
            purchaseDate: new Date(trade.purchaseDate).toISOString(),
            status: trade.status,
            closeAmount: trade.closeAmount || null,
            closeDate: trade.closeDate ? new Date(trade.closeDate).toISOString() : null,
            pnl: trade.pnl || null,
            daysHeld: trade.daysHeld || null
          }))
        });
      }
    });

    return NextResponse.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ message: 'Error saving data' }, { status: 500 });
  }
}