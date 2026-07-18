import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { followups: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, source, leadType, budget, notes, status, projectId } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email || null;
    if (source !== undefined) data.source = source || null;
    if (leadType !== undefined) data.leadType = leadType || null;
    if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
    if (notes !== undefined) data.notes = notes || null;
    if (status !== undefined) data.status = status;
    if (projectId !== undefined) data.projectId = projectId || null;

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json({ lead, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
