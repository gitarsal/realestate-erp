import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const cancellation = await prisma.cancellation.findUnique({
      where: { id },
      include: { file: { include: { unit: true } } },
    });
    if (!cancellation) return NextResponse.json({ error: 'Cancellation not found' }, { status: 404 });

    const updated = await prisma.cancellation.update({
      where: { id },
      data: { status },
    });

    // If approved/completed, release the plot and cancel the file
    if (status === 'refunded' || status === 'approved') {
      await prisma.file.update({
        where: { id: cancellation.fileId },
        data: { status: 'cancelled' },
      });

      // Release the unit back to available
      if (cancellation.file.unitId) {
        await prisma.unit.update({
          where: { id: cancellation.file.unitId },
          data: { status: 'available' },
        });
      }
    }

    return NextResponse.json({ cancellation: updated, message: `Cancellation ${status}` });
  } catch (error) {
    console.error('Error updating cancellation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
