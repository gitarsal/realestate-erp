import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { ticketNo: { contains: search, mode: "insensitive" } },
        { memberName: { contains: search, mode: "insensitive" } },
        { blockHouseNo: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        category: { select: { name: true } },
        client: { select: { name: true } },
        file: { select: { regNo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, memberName, blockHouseNo, details, clientId, fileId, availableTime, priority } = body;

    if (!categoryId || !memberName || !blockHouseNo || !details) {
      return NextResponse.json(
        { error: "categoryId, memberName, blockHouseNo, and details are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `CMP-${yearMonth}`;

    const lastComplaint = await prisma.complaint.findFirst({
      where: { ticketNo: { startsWith: prefix } },
      orderBy: { ticketNo: "desc" },
    });

    let seq = 1;
    if (lastComplaint) {
      const lastSeq = parseInt(lastComplaint.ticketNo.split("-")[2] || "0", 10);
      seq = lastSeq + 1;
    }

    const ticketNo = `${prefix}-${String(seq).padStart(4, "0")}`;

    const complaint = await prisma.complaint.create({
      data: {
        ticketNo,
        categoryId,
        memberName,
        blockHouseNo,
        details,
        clientId: clientId || null,
        fileId: fileId || null,
        availableTime: availableTime || null,
        priority: priority || "medium",
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}
