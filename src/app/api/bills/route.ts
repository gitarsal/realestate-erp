import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        registration: {
          include: {
            client: { select: { name: true, cnic: true } },
            unit: { select: { plotNo: true, block: { select: { name: true } } } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = bills.map((b) => ({
      id: b.id,
      billNo: b.billNo,
      member: b.registration.memberName || b.registration.client?.name || '—',
      clientName: b.registration.client?.name || '—',
      unit: `${b.registration.unit?.block?.name || ''}-${b.registration.unit?.plotNo || ''}`,
      period: b.period,
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      status: b.status,
      dueDate: b.dueDate,
      createdAt: b.createdAt,
      paymentCount: b.payments.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, period, totalAmount, dueDate } = body;

    if (!registrationId || !period || !totalAmount) {
      return NextResponse.json(
        { error: 'registrationId, period, and totalAmount are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await prisma.bill.count({
      where: { billNo: { startsWith: `BILL-${ym}-` } },
    });
    const seq = String(count + 1).padStart(4, '0');
    const billNo = `BILL-${ym}-${seq}`;

    const bill = await prisma.bill.create({
      data: {
        billNo,
        regId: registrationId,
        period,
        totalAmount: parseFloat(totalAmount),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Failed to create bill:', error);
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
}
