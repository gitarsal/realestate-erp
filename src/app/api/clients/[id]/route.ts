import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            project: { select: { id: true, name: true } },
            unit: { select: { id: true, plotNo: true, block: { select: { name: true } } } },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
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
    const { name, cnic, phone, email, address, category } = body;

    if (!name || !cnic || !phone) {
      return NextResponse.json(
        { error: 'Name, CNIC, and Phone are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findUnique({ where: { cnic } });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Another client with this CNIC already exists' },
        { status: 409 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        cnic,
        phone,
        email: email || null,
        address: address || null,
        category: category || null,
      },
    });

    return NextResponse.json({ client, message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { files: { select: { id: true, unitId: true } } },
    });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Release any booked units
    for (const file of client.files) {
      if (file.unitId) {
        await prisma.unit.update({ where: { id: file.unitId }, data: { status: 'available' } }).catch(() => {});
      }
    }

    const fileIds = client.files.map(f => f.id);

    if (fileIds.length > 0) {
      // Delete in dependency order
      await prisma.refund.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.commission.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.cancellation.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.receipt.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.transfer.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.complaint.deleteMany({ where: { fileId: { in: fileIds } } });

      // Delete installments via payment plans
      const plans = await prisma.paymentPlan.findMany({ where: { fileId: { in: fileIds } }, select: { id: true } });
      const planIds = plans.map(p => p.id);
      if (planIds.length > 0) {
        await prisma.installment.deleteMany({ where: { planId: { in: planIds } } });
      }
      await prisma.paymentPlan.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.filePartnership.deleteMany({ where: { fileId: { in: fileIds } } });
      await prisma.file.deleteMany({ where: { clientId: id } });
    }

    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ message: 'Client and all related records deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
