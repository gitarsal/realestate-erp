import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        file: {
          include: {
            client: true,
            project: true,
          },
        },
        transferor: { select: { name: true } },
        transferee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, fromClientId, toClientId, fee, transferDate } = body;

    if (!fileId || !fromClientId || !toClientId) {
      return NextResponse.json(
        { error: 'fileId, fromClientId, and toClientId are required' },
        { status: 400 }
      );
    }

    const transfer = await prisma.transfer.create({
      data: {
        fileId,
        fromClientId,
        toClientId,
        fee: fee ? parseFloat(fee) : 0,
        transferDate: transferDate ? new Date(transferDate) : new Date(),
        status: 'pending',
      },
    });

    return NextResponse.json({ transfer, message: 'Transfer created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
