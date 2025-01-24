// app/api/claims/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TokenDetail {
  tokenSymbol: string;
  amount: number;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { date, tokenDetails, totalAmount, heldForTaxes, taxAmount, txn } = body;

    const tokenClaims = tokenDetails.map((token: TokenDetail) => ({
      tokenSymbol: token.tokenSymbol,
      amount: Number(token.amount)
    }));

    const updatedClaim = await prisma.entry.update({
      where: { id },
      data: {
        type: 'Claims',
        date: new Date(`${date}T12:00:00.000-00:00`),
        txn: txn || null,
        amount: totalAmount,
        claimDetails: {
          tokenClaims,
          taxAmount,
          heldForTaxes,
          date: `${date}T12:00:00.000-00:00`
        }
      }
    });

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.entry.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    );
  }
}