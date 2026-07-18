import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        location: true,
        description: true,
        isActive: true,
        createdAt: true,
        _count: { select: { blocks: true, files: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, type, location, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Project code already exists' }, { status: 409 });
    }

    // Use the first company or create a default one
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({ data: { name: 'Default', code: 'DEF' } });
    }

    const project = await prisma.project.create({
      data: {
        name,
        code,
        type: type || 'residential',
        location: location || null,
        description: description || null,
        companyId: company.id,
      },
    });

    return NextResponse.json({ project, message: 'Project created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
