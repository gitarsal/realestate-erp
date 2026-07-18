import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { cnic: { contains: search } },
        { phone: { contains: search } },
        { files: { some: { regNo: { contains: search, mode: 'insensitive' as const } } } },
      ],
    } : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          files: {
            select: {
              id: true,
              regNo: true,
              status: true,
              project: { select: { id: true, name: true } },
              unit: { select: { id: true, plotNo: true, block: { select: { name: true } } } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cnic, phone, email, address, category, source } = body;

    if (!name || !cnic || !phone) {
      return NextResponse.json(
        { error: 'Name, CNIC, and Phone are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findUnique({ where: { cnic } });
    if (existing) {
      return NextResponse.json(
        { error: 'Client with this CNIC already exists', warning: true, existingClientId: existing.id },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        cnic,
        phone,
        email: email || null,
        address: address || null,
        category: category || null,
        source: source || 'manual',
      },
    });

    return NextResponse.json(
      { client, message: 'Client registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
