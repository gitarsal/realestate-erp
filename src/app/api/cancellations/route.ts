import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cancellations = await prisma.cancellation.findMany({
      include: {
        file: {
          include: {
            client: { select: { name: true } },
            project: { select: { name: true } },
            unit: { select: { plotNo: true, block: { select: { name: true } } } },
            receipts: { select: { amount: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ cancellations });
  } catch (error) {
    console.error('Error fetching cancellations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, reason, cancelledBy, deductionPercent } = body;

    if (!fileId || !reason || !cancelledBy) {
      return NextResponse.json(
        { error: 'fileId, reason, and cancelledBy are required' },
        { status: 400 }
      );
    }

    // Calculate paid amount from receipts
    const receipts = await prisma.receipt.findMany({
      where: { fileId },
      select: { amount: true },
    });
    const paidAmount = receipts.reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate deductions from percentage
    const percent = parseFloat(deductionPercent || '0');
    const deductions = Math.round(paidAmount * percent / 100);
    const refundableAmount = paidAmount - deductions;

    const cancellation = await prisma.cancellation.create({
      data: {
        fileId,
        reason,
        cancelledBy,
        paidAmount,
        deductions,
        refundableAmount,
      },
    });

    return NextResponse.json({ cancellation, message: 'Cancellation created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
