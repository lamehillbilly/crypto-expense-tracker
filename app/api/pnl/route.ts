import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching closed trades...');
    
    // Get all closed trades
    const closedTrades = await prisma.trade.findMany({
      where: {
        status: 'closed',
        closeDate: { not: null },
        realizedPnl: { not: null }
      },
      select: {
        id: true,
        closeDate: true,
        tokenSymbol: true,
        realizedPnl: true,
        status: true
      },
      orderBy: {
        closeDate: 'desc'
      }
    });

    console.log('Found closed trades:', closedTrades);

    // Format the records for display
    const records = closedTrades.map(trade => {
      const record = {
        id: trade.id,
        date: trade.closeDate!.toISOString(),
        tokenSymbol: trade.tokenSymbol,
        type: 'Trade',
        amount: trade.realizedPnl,
        taxEstimate: trade.realizedPnl > 0 ? trade.realizedPnl * 0.35 : 0
      };
      console.log('Formatted record:', record);
      return record;
    });

    // Calculate totals
    const totalPnL = records.reduce((sum, record) => sum + record.amount, 0);
    const totalTax = records.reduce((sum, record) => sum + record.taxEstimate, 0);

    console.log('Response:', { records, totalPnL, totalTax });

    return NextResponse.json({
      records,
      totalPnL,
      totalTax
    });
  } catch (error) {
    console.error('Failed to fetch PnL records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PnL records' },
      { status: 500 }
    );
  }
} 