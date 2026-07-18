import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, type, location, description, isActive } = body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (code && code !== project.code) {
      const existing = await prisma.project.findUnique({ where: { code } });
      if (existing) return NextResponse.json({ error: 'Project code already exists' }, { status: 409 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name || project.name,
        code: code || project.code,
        type: type || project.type,
        location: location !== undefined ? location : project.location,
        description: description !== undefined ? description : project.description,
        isActive: isActive !== undefined ? isActive : project.isActive,
      },
    });

    return NextResponse.json({ project: updated, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id }, include: { _count: { select: { files: true } } } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (project._count.files > 0) {
      return NextResponse.json({ error: 'Cannot delete project with existing bookings' }, { status: 400 });
    }

    // Delete blocks and units first
    const blocks = await prisma.block.findMany({ where: { projectId: id }, select: { id: true } });
    for (const block of blocks) {
      await prisma.unit.deleteMany({ where: { blockId: block.id } });
    }
    await prisma.block.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
