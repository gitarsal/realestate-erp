import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [totalUnits, totalClients, totalBookings, billingSchedules, bills, receipts] = await Promise.all([
      prisma.unit.count(),
      prisma.client.count(),
      prisma.file.count(),
      prisma.billingSchedule.count(),
      prisma.bill.findMany({ select: { totalAmount: true, paidAmount: true, status: true } }),
      prisma.receipt.aggregate({ _sum: { amount: true } }),
    ]);

    const totalBillAmount = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
    const totalBillPaid = bills.reduce((s, b) => s + Number(b.paidAmount), 0);
    const outstanding = totalBillAmount - totalBillPaid;
    const overdueBills = bills.filter(b => b.status === 'overdue').length;
    const totalCollected = Number(receipts._sum.amount || 0);

    return NextResponse.json({
      totalUnits,
      totalClients,
      totalBookings,
      activeSchedules: billingSchedules,
      billsGenerated: bills.length,
      totalCollected,
      outstanding: outstanding > 0 ? outstanding : 0,
      overdueBills,
    });
  } catch (error) {
    console.error('Failed to fetch billing overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing overview' },
      { status: 500 }
    );
  }
}
