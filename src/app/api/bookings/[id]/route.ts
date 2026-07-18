import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, cnic: true, phone: true, email: true } },
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, plotNo: true, block: { select: { name: true } }, price: true } },
        paymentPlan: { include: { installments: { orderBy: { instNo: 'asc' } } } },
        receipts: { orderBy: { receivedAt: 'desc' } },
      },
    });

    if (!file) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const plan = file.paymentPlan;
    const totalPaid = file.receipts.reduce((sum, r) => sum + Number(r.amount), 0);

    return NextResponse.json({
      booking: {
        ...file,
        totalPaid,
        totalInstallments: plan?.installments.length || 0,
        paidInstallments: plan?.installments.filter((i) => Number(i.paidAmount) >= Number(i.dueAmount)).length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { unitId, totalAmount, downPayment, status } = body;

    const file = await prisma.file.findUnique({ where: { id }, include: { paymentPlan: true } });
    if (!file) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (unitId !== undefined) {
      const newUnitId = unitId || null;
      if (newUnitId !== file.unitId) {
        // Free old unit
        if (file.unitId) {
          await prisma.unit.update({ where: { id: file.unitId }, data: { status: 'available' } });
        }
        // Book new unit
        if (newUnitId) {
          await prisma.unit.update({ where: { id: newUnitId }, data: { status: 'booked' } });
        }
        await prisma.file.update({ where: { id }, data: { unitId: newUnitId } });
      }
    }
    if (status) {
      await prisma.file.update({ where: { id }, data: { status } });
    }
    if (totalAmount && file.paymentPlan) {
      await prisma.paymentPlan.update({
        where: { fileId: id },
        data: { totalAmount: parseFloat(totalAmount), downPayment: parseFloat(downPayment || '0') },
      });
    }

    return NextResponse.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
