import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: ignored, ...tradeData } = body;

    const trade = await prisma.trade.create({
      data: {
        tokenName: tradeData.tokenName,
        amount: tradeData.amount,
        purchaseDate: new Date(tradeData.purchaseDate),
        closeAmount: tradeData.closeAmount || null,
        closeDate: tradeData.closeDate ? new Date(tradeData.closeDate) : null,
        status: tradeData.status || 'open'
      }
    });

    return NextResponse.json(trade);
  } catch {
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
} 