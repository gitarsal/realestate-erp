import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, empCode: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { empId, typeId, fromDate, toDate, reason } = body;

    if (!empId || !typeId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "empId, typeId, fromDate, and toDate are required" },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = to.getTime() - from.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.leave.create({
      data: {
        empId,
        typeId,
        fromDate: from,
        toDate: to,
        days,
        reason: reason || null,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create leave" },
      { status: 500 }
    );
  }
}
