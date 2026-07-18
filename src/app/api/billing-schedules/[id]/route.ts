import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const billingSchedule = await prisma.billingSchedule.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(billingSchedule);
  } catch (error) {
    console.error('Failed to update billing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update billing schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.billingSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Billing schedule deleted' });
  } catch (error) {
    console.error('Failed to delete billing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete billing schedule' },
      { status: 500 }
    );
  }
}
