import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (status) {
      where.status = status;
    }

    const followups = await prisma.followup.findMany({
      where,
      include: { lead: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ followups });
  } catch (error) {
    console.error('Error fetching followups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, date, priority, note, createdBy } = body;

    if (!leadId || !date || !createdBy) {
      return NextResponse.json(
        { error: 'leadId, date, and createdBy are required' },
        { status: 400 }
      );
    }

    const followup = await prisma.followup.create({
      data: {
        leadId,
        date: new Date(date),
        priority: priority || null,
        note: note || null,
        createdBy,
      },
    });

    return NextResponse.json({ followup, message: 'Followup created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating followup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const followup = await prisma.followup.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ followup, message: 'Followup updated successfully' });
  } catch (error) {
    console.error('Error updating followup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
