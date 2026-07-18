import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, ownerId, targetDate, status, completionPct } = body;

    if (!title || !ownerId) {
      return NextResponse.json(
        { error: "title and ownerId are required" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description: description || null,
        ownerId,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status || "active",
        completionPct: completionPct || 0,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
