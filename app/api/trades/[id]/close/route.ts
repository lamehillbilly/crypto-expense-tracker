import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;  // Destructure id from context.params
    if (!id) {
      return NextResponse.json(
        { error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    const tradeId = parseInt(id);
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { closeAmount, closePrice, isFullClose, pnl, date } = body;

    // Validate the trade exists
    const existingTrade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Execute the transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('Closing trade with data:', {
        tradeId,
        closeAmount,
        closePrice,
        isFullClose,
        pnl,
        date
      });

      // Create trade history entry
      const tradeHistory = await tx.tradeHistory.create({
        data: {
          tradeId,
          date: new Date(date),
          amount: closeAmount,
          price: closePrice,
          type: isFullClose ? 'close' : 'partial_close',
          pnl,
        },
      });

      console.log('Created trade history:', tradeHistory);

      // Update the trade
      const updatedTrade = await tx.trade.update({
        where: { id: tradeId },
        data: {
          quantity: isFullClose ? 0 : {
            decrement: closeAmount
          },
          status: isFullClose ? 'closed' : 'open',
          closePrice: isFullClose ? closePrice : null,
          closeDate: isFullClose ? new Date(date) : null,
          realizedPnl: {
            increment: pnl
          }
        },
      });

      console.log('Updated trade:', updatedTrade);

      // Create PnL record if fully closed
      if (isFullClose) {
        const pnlRecord = await tx.pnlRecord.create({
          data: {
            date: new Date(date),
            tokenSymbol: updatedTrade.tokenSymbol,
            amount: pnl,
            taxEstimate: pnl > 0 ? pnl * 0.35 : 0,
            tradeId: tradeId
          }
        });
        console.log('Created PnL record:', pnlRecord);
      }

      return { trade: updatedTrade, history: tradeHistory };
    });

    return NextResponse.json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to close trade:', { error: errorMessage });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to close trade',
      details: errorMessage
    }, { status: 500 });
  }
} 