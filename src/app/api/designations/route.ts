import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const designations = await prisma.designation.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(designations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch designations" },
      { status: 500 }
    );
  }
}
