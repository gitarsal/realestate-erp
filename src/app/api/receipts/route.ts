import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          receiptNo: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        file: {
          include: {
            client: { select: { name: true, cnic: true } },
            project: { select: { name: true } },
          },
        },
        installment: { select: { instNo: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });

    return NextResponse.json({ receipts });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, amount, mode, instrumentNo, chequeDate, narration, receivedBy } = body;

    if (!fileId || amount == null || !mode || !receivedBy) {
      return NextResponse.json(
        { error: 'fileId, amount, mode, and receivedBy are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const count = await prisma.receipt.count({
      where: {
        receiptNo: { startsWith: `RCP-${yearMonth}` },
      },
    });

    const seq = String(count + 1).padStart(5, '0');
    const receiptNo = `RCP-${yearMonth}-${seq}`;
    const paymentAmount = parseFloat(amount);

    // Find the file's payment plan and unpaid installments
    const paymentPlan = await prisma.paymentPlan.findUnique({
      where: { fileId },
      include: {
        installments: {
          where: { status: { in: ['pending', 'partial', 'overdue'] } },
          orderBy: { instNo: 'asc' },
        },
      },
    });

    let linkedInstallmentId: string | null = null;

    if (paymentPlan && paymentPlan.installments.length > 0) {
      let remaining = paymentAmount;

      for (const inst of paymentPlan.installments) {
        if (remaining <= 0) break;

        const dueAmount = Number(inst.dueAmount);
        const alreadyPaid = Number(inst.paidAmount);
        const balance = dueAmount - alreadyPaid;

        if (balance <= 0) continue;

        const toPay = Math.min(remaining, balance);
        const newPaid = alreadyPaid + toPay;
        const newStatus = newPaid >= dueAmount ? 'paid' : 'partial';

        await prisma.installment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaid,
            status: newStatus,
          },
        });

        remaining -= toPay;

        if (!linkedInstallmentId) {
          linkedInstallmentId = inst.id;
        }
      }
    }

    // Auto-update file status to "completed" if all installments are paid
    if (paymentPlan) {
      const allPaid = await prisma.installment.aggregate({
        where: { planId: paymentPlan.id },
        _sum: { dueAmount: true, paidAmount: true },
      });
      const totalDue = Number(allPaid._sum.dueAmount || 0);
      const totalPaid = Number(allPaid._sum.paidAmount || 0);
      if (totalDue > 0 && totalPaid >= totalDue) {
        await prisma.file.update({
          where: { id: fileId },
          data: { status: 'completed' },
        });
      }
    }

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        fileId,
        installmentId: linkedInstallmentId,
        amount: paymentAmount,
        mode,
        instrumentNo: instrumentNo || null,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        narration: narration || null,
        receivedBy,
        receivedAt: now,
      },
    });

    return NextResponse.json({ receipt, message: 'Receipt created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
