import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' }, { status: 200 });
  response.cookies.set('session', '', { path: '/', maxAge: 0 });
  return response;
}
