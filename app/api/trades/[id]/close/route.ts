// In app/api/trades/[id]/close/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const tradeId = parseInt(id);
    
    console.log('Processing close trade request for ID:', tradeId);

    if (!tradeId || isNaN(tradeId)) {
      console.log('Invalid trade ID:', id);
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Close trade request body:', body);

    const { closeAmount, closePrice, isFullClose, pnl, date } = body;

    // Find the trade first
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    console.log('Found trade:', trade);

    if (!trade) {
      console.log('Trade not found for ID:', tradeId);
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create trade history entry
      const history = await tx.tradeHistory.create({
        data: {
          tradeId,
          date: new Date(date),
          amount: closeAmount,
          price: closePrice,
          type: isFullClose ? 'close' : 'partial_close',
          pnl
        }
      });

      console.log('Created trade history:', history);

      // Update the trade
      if (isFullClose) {
        return await tx.trade.update({
          where: { id: tradeId },
          data: {
            status: 'closed',
            closePrice,
            closeDate: new Date(date),
            realizedPnl: {
              increment: pnl
            },
            quantity: 0
          }
        });
      } else {
        // For partial close
        return await tx.trade.update({
          where: { id: tradeId },
          data: {
            quantity: {
              decrement: closeAmount
            },
            realizedPnl: {
              increment: pnl
            }
          }
        });
      }
    });

    console.log('Transaction completed successfully:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in close trade route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to close trade',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}