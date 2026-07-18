import { NextResponse } from 'next/server';
import { createUser, createSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, firstName, lastName, role);

    const cookie = createSessionCookie(user.id, user.email, user.role.name);

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
        },
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
