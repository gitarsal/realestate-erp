import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, type } = body;

    if (!code || !name || !type) {
      return NextResponse.json(
        { error: 'Code, name, and type are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.chartOfAccount.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: 'Account with this code already exists' },
        { status: 409 }
      );
    }

    const account = await prisma.chartOfAccount.create({
      data: { code, name, type },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
