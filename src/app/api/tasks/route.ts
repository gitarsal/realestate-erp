import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const goalId = searchParams.get("goalId");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (goalId) {
      where.goalId = goalId;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, ownerId, dueDate, priority, goalId } = body;

    if (!title || !ownerId) {
      return NextResponse.json(
        { error: "title and ownerId are required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        ownerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "medium",
        goalId: goalId || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
