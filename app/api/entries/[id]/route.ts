// app/api/entries/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Destructure and ignore id from body with eslint disable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: ignored, ...updateData } = body;

    const updated = await prisma.entry.update({
      where: { id },
      data: {
        type: updateData.type,
        amount: updateData.amount,
        date: new Date(updateData.date),
        txn: updateData.txn || null,
        expenseDetails: updateData.expenseDetails || null,
        claimDetails: updateData.claimDetails || null,
        purchaseAmount: updateData.purchaseAmount || 0,
        purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : new Date(),
        status: updateData.status || 'open'
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}