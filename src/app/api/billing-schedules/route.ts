import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const billingSchedules = await prisma.billingSchedule.findMany({
      include: {
        registration: {
          include: {
            client: { select: { name: true } },
            unit: { select: { plotNo: true, block: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(billingSchedules);
  } catch (error) {
    console.error('Failed to fetch billing schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, chargeType, amount, frequency } = body;

    if (!fileId || !chargeType || !amount || !frequency) {
      return NextResponse.json(
        { error: 'fileId, chargeType, amount, and frequency are required' },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        client: { select: { name: true, cnic: true } },
        unit: { select: { plotNo: true } },
      },
    });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    let registration = await prisma.bmmsRegistration.findFirst({
      where: { unitId: file.unitId || '', clientId: file.clientId },
    });

    if (!registration) {
      registration = await prisma.bmmsRegistration.create({
        data: {
          regNo: `BMMS-${Date.now().toString(36).toUpperCase()}`,
          clientId: file.clientId,
          unitId: file.unitId || '',
          memberName: file.client?.name || 'Unknown',
          nic: file.client?.cnic || null,
        },
      });
    }

    const billingSchedule = await prisma.billingSchedule.create({
      data: {
        regId: registration.id,
        chargeType,
        amount: parseFloat(amount),
        frequency,
      },
    });

    return NextResponse.json(billingSchedule, { status: 201 });
  } catch (error) {
    console.error('Failed to create billing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create billing schedule' },
      { status: 500 }
    );
  }
}
