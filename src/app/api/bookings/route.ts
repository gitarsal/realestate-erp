import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRegNo, generateBookingNo } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const projectId = searchParams.get('projectId') || '';

    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (search) {
      where.OR = [
        { regNo: { contains: search, mode: 'insensitive' as const } },
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { cnic: { contains: search } } },
      ];
    }

    const files = await prisma.file.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, cnic: true, phone: true } },
        project: { select: { id: true, name: true } },
        unit: { select: { id: true, plotNo: true, block: { select: { name: true } }, price: true, status: true } },
        paymentPlan: {
          include: {
            installments: { orderBy: { instNo: 'asc' } },
          },
        },
        receipts: { select: { id: true, amount: true, receiptNo: true, receivedAt: true, mode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookings = files.map((f) => {
      const plan = f.paymentPlan;
      const totalPaid = f.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalAmount = plan ? Number(plan.totalAmount) : Number(f.unit?.price || 0);
      const remaining = totalAmount - totalPaid - (plan ? Number(plan.downPayment) : 0);
      const paidInstallments = plan ? plan.installments.filter((i) => Number(i.paidAmount) >= Number(i.dueAmount)).length : 0;
      const totalInstallments = plan ? plan.installments.length : 0;

      return {
        id: f.id,
        regNo: f.regNo,
        bookingNo: f.bookingNo,
        clientId: f.clientId,
        clientName: f.client.name,
        clientCnic: f.client.cnic,
        clientPhone: f.client.phone,
        projectId: f.projectId,
        projectName: f.project.name,
        unitId: f.unitId,
        plotNo: f.unit?.plotNo || '—',
        blockName: f.unit?.block?.name || '',
        unitPrice: Number(f.unit?.price || 0),
        unitStatus: f.unit?.status || '',
        totalAmount,
        downPayment: plan ? Number(plan.downPayment) : 0,
        rebateAmount: plan ? Number(plan.rebateAmount) : 0,
        totalPaid,
        remaining,
        totalInstallments,
        paidInstallments,
        status: f.status,
        createdAt: f.createdAt,
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, projectId, unitId, totalAmount, downPayment, installmentCount, installmentMonths } = body;

    if (!clientId || !projectId || !totalAmount) {
      return NextResponse.json({ error: 'Client, Project, and Total Amount are required' }, { status: 400 });
    }

    const regNo = generateRegNo();
    const bookingNo = generateBookingNo();

    const result = await prisma.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          regNo,
          bookingNo,
          clientId,
          projectId,
          unitId: unitId || null,
          status: 'active',
          createdBy: 'system',
        },
      });

      let paymentPlan = null;
      const total = parseFloat(totalAmount);
      const dp = parseFloat(downPayment || '0');
      const instCount = parseInt(installmentCount || '12');
      const instMonths = parseInt(installmentMonths || '1');

      if (total > 0) {
        paymentPlan = await tx.paymentPlan.create({
          data: {
            fileId: file.id,
            planType: 'standard',
            totalAmount: total,
            downPayment: dp,
          },
        });

        const installableAmount = total - dp;
        const perInst = installableAmount / instCount;
        const now = new Date();

        const installments = [];
        for (let i = 1; i <= instCount; i++) {
          const dueDate = new Date(now);
          dueDate.setMonth(dueDate.getMonth() + i * instMonths);
          installments.push({
            planId: paymentPlan.id,
            instNo: i,
            dueDate,
            dueAmount: perInst,
          });
        }
        await tx.installment.createMany({ data: installments });
      }

      if (unitId) {
        await tx.unit.update({ where: { id: unitId }, data: { status: 'booked' } });
      }

      return { file, paymentPlan };
    });

    return NextResponse.json({ booking: result, message: 'Booking created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
