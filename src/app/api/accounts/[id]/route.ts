import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type } = body;

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: { ...(name && { name }), ...(type && { type }) },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
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

    const hasEntries = await prisma.voucherEntry.findFirst({
      where: { accountId: id },
    });
    if (hasEntries) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing voucher entries' },
        { status: 400 }
      );
    }

    await prisma.chartOfAccount.delete({ where: { id } });
    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
