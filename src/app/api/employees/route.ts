import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { empCode: { contains: search, mode: "insensitive" } },
        { cnic: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      cnic,
      phone,
      email,
      departmentId,
      designationId,
      joinDate,
      salary,
      gender,
      address,
    } = body;

    if (!firstName || !lastName || !cnic || !phone || !departmentId || !designationId || !joinDate || salary === undefined) {
      return NextResponse.json(
        { error: "firstName, lastName, cnic, phone, departmentId, designationId, joinDate, and salary are required" },
        { status: 400 }
      );
    }

    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { empCode: "desc" },
    });

    let seq = 1;
    if (lastEmployee) {
      const lastSeq = parseInt(lastEmployee.empCode.split("-")[1] || "0", 10);
      seq = lastSeq + 1;
    }

    const empCode = `EMP-${String(seq).padStart(4, "0")}`;

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "No company found. Please create a company first." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        empCode,
        firstName,
        lastName,
        cnic,
        phone,
        email: email || null,
        departmentId,
        designationId,
        joinDate: new Date(joinDate),
        companyId: company.id,
        salary,
        gender: gender || null,
        address: address || null,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
