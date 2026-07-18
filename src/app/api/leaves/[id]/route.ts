import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy } = body;

    const allowedStatuses = ["approved", "rejected", "cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (approvedBy !== undefined) data.approvedBy = approvedBy;

    const leave = await prisma.leave.update({
      where: { id },
      data,
    });

    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update leave" },
      { status: 500 }
    );
  }
}
