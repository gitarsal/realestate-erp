import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { plotNo, category, size, sizeUnit, price, status } = body;

    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        plotNo: plotNo || unit.plotNo,
        category: category || unit.category,
        size: size !== undefined ? parseFloat(size) : unit.size,
        sizeUnit: sizeUnit || unit.sizeUnit,
        price: price !== undefined ? parseFloat(price) : unit.price,
        status: status || unit.status,
      },
    });

    return NextResponse.json({ unit: updated, message: 'Unit updated successfully' });
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const unit = await prisma.unit.findUnique({ where: { id }, include: { _count: { select: { files: true } } } });
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

    if (unit._count.files > 0) {
      return NextResponse.json({ error: 'Cannot delete unit with existing bookings' }, { status: 400 });
    }

    await prisma.unitStatusHistory.deleteMany({ where: { unitId: id } });
    await prisma.unit.delete({ where: { id } });

    return NextResponse.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
