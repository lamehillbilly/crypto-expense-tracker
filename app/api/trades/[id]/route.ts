import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    console.log('Updating trade:', id, body);

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        tokenId: body.tokenId,
        tokenSymbol: body.tokenSymbol,
        tokenName: body.tokenName,
        purchasePrice: Number(body.purchasePrice),
        quantity: Number(body.quantity),
        purchaseDate: new Date(body.purchaseDate),
        status: body.status,
        closePrice: body.closePrice ? Number(body.closePrice) : null,
        closeDate: body.closeDate ? new Date(body.closeDate) : null,
        realizedPnl: body.realizedPnl ? Number(body.realizedPnl) : null,
        updatedAt: new Date(),
      },
    });

    console.log('Trade updated:', updatedTrade);
    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('Failed to update trade:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update trade',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = parseInt(context.params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    // Delete the trade and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related PnL records
      await tx.pnlRecord.deleteMany({
        where: { tradeId: id }
      });

      // Delete trade history
      await tx.tradeHistory.deleteMany({
        where: { tradeId: id }
      });

      // Delete the trade
      await tx.trade.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Failed to fetch trade:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trade' },
      { status: 500 }
    );
  }
} 