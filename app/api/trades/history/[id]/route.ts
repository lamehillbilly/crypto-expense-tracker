import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = parseInt(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid history ID' },
        { status: 400 }
      );
    }

    // Get the history entry and related trade
    const historyEntry = await prisma.tradeHistory.findUnique({
      where: { id },
      include: { trade: true }
    });

    if (!historyEntry) {
      return NextResponse.json(
        { error: 'History entry not found' },
        { status: 404 }
      );
    }

    // Update trade and delete history in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete PnL record if it exists
      if (historyEntry.type === 'close') {
        await tx.pnlRecord.deleteMany({
          where: { 
            tradeId: historyEntry.tradeId,
            date: historyEntry.date
          }
        });
      }

      // Update trade
      await tx.trade.update({
        where: { id: historyEntry.tradeId },
        data: {
          quantity: historyEntry.type === 'close' ? 
            historyEntry.trade.quantity + historyEntry.amount :
            historyEntry.trade.quantity + historyEntry.amount,
          status: 'open',
          realizedPnl: {
            decrement: historyEntry.pnl
          }
        }
      });

      // Delete the history entry
      await tx.tradeHistory.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete history entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete history entry' },
      { status: 500 }
    );
  }
} 