import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const caseType = searchParams.get('caseType');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { moza: { contains: search, mode: 'insensitive' } },
        { khasraNo: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (caseType) {
      where.caseType = caseType;
    }

    if (status) {
      where.status = status;
    }

    const landRecords = await prisma.landRecord.findMany({
      where,
      include: {
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(landRecords);
  } catch (error) {
    console.error('Failed to fetch land records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch land records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      moza,
      khasraNo,
      khewatNo,
      khatooniNo,
      ownerName,
      caseType,
      purchaseType,
      ownershipShare,
      area,
      areaUnit,
    } = body;

    const required = ['moza', 'khasraNo', 'khewatNo', 'khatooniNo', 'ownerName', 'caseType'];
    const missing = required.filter((field) => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const landRecord = await prisma.landRecord.create({
      data: {
        projectId: projectId || null,
        moza,
        khasraNo,
        khewatNo,
        khatooniNo,
        ownerName,
        caseType,
        purchaseType: purchaseType || null,
        ownershipShare: ownershipShare || null,
        area: area || null,
        areaUnit: areaUnit || null,
      },
      include: {
        project: { select: { name: true } },
      },
    });

    return NextResponse.json(landRecord, { status: 201 });
  } catch (error) {
    console.error('Failed to create land record:', error);
    return NextResponse.json(
      { error: 'Failed to create land record' },
      { status: 500 }
    );
  }
}
