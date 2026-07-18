import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      entityType,
      entityId,
      category,
      description,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy,
      accessLevel,
      expiryDate,
    } = body;

    if (!name || !entityType || !entityId || !fileUrl || !fileType || fileSize === undefined) {
      return NextResponse.json(
        { error: "name, entityType, entityId, fileUrl, fileType, and fileSize are required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        name,
        entityType,
        entityId,
        category: category || null,
        description: description || null,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy: uploadedBy || "system",
        accessLevel: accessLevel || "private",
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
