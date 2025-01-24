import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all entries
    const entries = await prisma.entry.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    // Get open trades
    const trades = await prisma.trade.findMany({
      where: {
        status: 'open'
      }
    });

    return NextResponse.json({ entries, trades });
  } catch (error) {
    console.error('Error loading data:', error);
    return NextResponse.json({ message: 'Error loading data' }, { status: 500 });
  }
}