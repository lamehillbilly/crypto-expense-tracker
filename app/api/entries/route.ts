// app/api/entries/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { entries = [] } = await request.json();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const entry of entries) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: ignored, ...entryData } = entry;
        await tx.entry.create({
          data: {
            type: entryData.type,
            amount: entryData.amount,
            date: new Date(entryData.date),
            txn: entryData.txn || null,
            expenseDetails: entryData.expenseDetails || null,
            claimDetails: entryData.claimDetails || null,
            purchaseAmount: entryData.purchaseAmount || 0,
            purchaseDate: entryData.purchaseDate ? new Date(entryData.purchaseDate) : new Date(),
            status: entryData.status || 'open'
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}