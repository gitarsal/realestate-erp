import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const blockId = searchParams.get('blockId');
    const status = searchParams.get('status');
    const all = searchParams.get('all');

    const where: any = {};
    if (projectId) where.block = { projectId };
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    const units = await prisma.unit.findMany({
      where,
      include: {
        block: {
          select: { id: true, name: true, project: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ block: { name: 'asc' } }, { plotNo: 'asc' }],
      take: all ? undefined : 500,
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, blockName, plots, bulk } = body;

    if (!projectId || !blockName) {
      return NextResponse.json({ error: 'Project and block name are required' }, { status: 400 });
    }

    // Find or create block
    let block = await prisma.block.findFirst({
      where: { projectId, name: blockName },
    });
    if (!block) {
      block = await prisma.block.create({ data: { projectId, name: blockName } });
    }

    if (bulk) {
      // Bulk create: { startNo, endNo, size, sizeUnit, price, category }
      const { startNo, endNo, size, sizeUnit, price, category } = bulk;
      if (!startNo || !endNo || !size || !price) {
        return NextResponse.json({ error: 'startNo, endNo, size, and price are required for bulk' }, { status: 400 });
      }

      const start = parseInt(startNo);
      const end = parseInt(endNo);
      if (isNaN(start) || isNaN(end) || start > end) {
        return NextResponse.json({ error: 'Invalid plot range' }, { status: 400 });
      }

      const created = [];
      const skipped = [];
      for (let i = start; i <= end; i++) {
        const plotNo = String(i);
        const existing = await prisma.unit.findFirst({ where: { blockId: block.id, plotNo } });
        if (existing) {
          skipped.push(plotNo);
          continue;
        }
        const unit = await prisma.unit.create({
          data: {
            blockId: block.id,
            plotNo,
            category: category || 'residential',
            size: parseFloat(size),
            sizeUnit: sizeUnit || 'sqft',
            price: parseFloat(price),
            status: 'available',
          },
        });
        created.push(unit);
      }

      return NextResponse.json({
        message: `${created.length} plots created${skipped.length ? `, ${skipped.length} skipped (already exist)` : ''}`,
        created: created.length,
        skipped: skipped.length,
        skippedNos: skipped,
      }, { status: 201 });
    }

    // Single plot create
    if (!plots || !Array.isArray(plots) || plots.length === 0) {
      return NextResponse.json({ error: 'plots array is required' }, { status: 400 });
    }

    const created = [];
    for (const p of plots) {
      const existing = await prisma.unit.findFirst({ where: { blockId: block.id, plotNo: p.plotNo } });
      if (existing) continue;
      const unit = await prisma.unit.create({
        data: {
          blockId: block.id,
          plotNo: p.plotNo,
          category: p.category || 'residential',
          size: parseFloat(p.size || '0'),
          sizeUnit: p.sizeUnit || 'sqft',
          price: parseFloat(p.price || '0'),
          status: 'available',
        },
      });
      created.push(unit);
    }

    return NextResponse.json({ message: `${created.length} plots created`, created }, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { unitId, status, changedBy } = body;

    if (!unitId || !status) {
      return NextResponse.json(
        { error: 'Unit ID and status are required' },
        { status: 400 }
      );
    }

    const currentUnit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!currentUnit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      );
    }

    if (currentUnit.status !== 'available' && status === 'booked') {
      return NextResponse.json(
        { error: 'Unit is no longer available', currentStatus: currentUnit.status },
        { status: 409 }
      );
    }

    const [updatedUnit] = await prisma.$transaction([
      prisma.unit.update({
        where: { id: unitId },
        data: { status },
      }),
      prisma.unitStatusHistory.create({
        data: {
          unitId,
          oldStatus: currentUnit.status,
          newStatus: status,
          changedBy: changedBy || 'system',
        },
      }),
    ]);

    return NextResponse.json({
      unit: updatedUnit,
      message: `Unit status changed from ${currentUnit.status} to ${status}`,
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
