import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        entries: {
          include: {
            account: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Failed to fetch vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, date, narration, entries } = body;

    const required = ['type', 'date', 'entries'];
    const missing = required.filter((field) => !body[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(entries) || entries.length < 2) {
      return NextResponse.json(
        { error: 'A voucher must have at least 2 entries' },
        { status: 400 }
      );
    }

    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const count = await prisma.voucher.count({
      where: {
        voucherNo: { startsWith: `VCH-${ym}-` },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    const voucherNo = `VCH-${ym}-${seq}`;

    const voucher = await prisma.voucher.create({
      data: {
        voucherNo,
        type,
        date: new Date(date),
        narration: narration || null,
        createdBy: 'system',
        entries: {
          create: entries.map((entry: { accountId: string; debit?: number; credit?: number; narration?: string }) => ({
            accountId: entry.accountId,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            narration: entry.narration || null,
          })),
        },
      },
      include: {
        entries: {
          include: {
            account: { select: { name: true, code: true } },
          },
        },
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error('Failed to create voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}
