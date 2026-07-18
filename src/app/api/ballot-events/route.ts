import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ballotEvents = await prisma.ballotEvent.findMany({
      include: {
        project: { select: { name: true } },
        _count: { select: { applicants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ballotEvents);
  } catch (error) {
    console.error('Failed to fetch ballot events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ballot events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, type, runDate, eligibilityRules } = body;

    const required = ['projectId', 'name', 'runDate'];
    const missing = required.filter((field) => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const ballotEvent = await prisma.ballotEvent.create({
      data: {
        projectId,
        name,
        type: type || null,
        runDate: new Date(runDate),
        eligibilityRules: eligibilityRules || '{}',
      },
      include: {
        project: { select: { name: true } },
        _count: { select: { applicants: true } },
      },
    });

    return NextResponse.json(ballotEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to create ballot event:', error);
    return NextResponse.json(
      { error: 'Failed to create ballot event' },
      { status: 500 }
    );
  }
}
