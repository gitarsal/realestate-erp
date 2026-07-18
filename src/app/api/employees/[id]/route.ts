import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (cnic !== undefined) data.cnic = cnic;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (departmentId !== undefined) data.departmentId = departmentId;
    if (designationId !== undefined) data.designationId = designationId;
    if (joinDate !== undefined) data.joinDate = new Date(joinDate);
    if (salary !== undefined) data.salary = salary;
    if (gender !== undefined) data.gender = gender;
    if (address !== undefined) data.address = address;
    if (isActive !== undefined) data.isActive = isActive;

    const employee = await prisma.employee.update({
      where: { id },
      data,
    });

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}
