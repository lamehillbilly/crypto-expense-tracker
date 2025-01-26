import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tokenId, tokenSymbol, tokenName, tokenImage, isCustomToken, currentPrice } = body;

    // Calculate unrealized P/L if we have a current price
    let unrealizedPnl = 0;
    const trade = await prisma.trade.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (trade && currentPrice) {
      // Convert string values to numbers and calculate with full precision
      const quantity = Number(trade.quantity);
      const purchasePrice = Number(trade.purchasePrice);
      const currentPriceNum = Number(currentPrice);

      const positionValue = quantity * currentPriceNum;
      const costBasis = quantity * purchasePrice;
      unrealizedPnl = positionValue - costBasis;

      console.log({
        quantity,
        purchasePrice,
        currentPrice: currentPriceNum,
        positionValue,
        costBasis,
        unrealizedPnl
      });
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: parseInt(params.id) },
      data: {
        tokenId,
        tokenSymbol,
        tokenName,
        tokenImage,
        isCustomToken,
        currentPrice: currentPrice ? Number(currentPrice) : undefined,
        unrealizedPnl: currentPrice ? unrealizedPnl : undefined
      },
    });

    return Response.json(updatedTrade);
  } catch (error) {
    console.error('Error updating trade:', error);
    return Response.json(
      { error: 'Failed to update token' },
      { status: 500 }
    );
  }
} 