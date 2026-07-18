import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        vendor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, item, quantity, rate, deliveryDate } = body;

    const required = ['vendorId', 'item', 'quantity', 'rate'];
    const missing = required.filter((field) => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const count = await prisma.purchaseOrder.count({
      where: {
        poNo: { startsWith: `PO-${ym}-` },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    const poNo = `PO-${ym}-${seq}`;
    const totalAmount = quantity * rate;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNo,
        vendorId,
        item,
        quantity,
        rate,
        totalAmount,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      },
      include: {
        vendor: { select: { name: true } },
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to create purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
