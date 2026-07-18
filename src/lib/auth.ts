import bcrypt from 'bcryptjs';
import prisma from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple session-based auth using cookies
// In production, use NextAuth.js or similar

export async function createUser(email: string, password: string, firstName: string, lastName: string, roleName: string = 'admin') {
  const passwordHash = await hashPassword(password);
  
  // Find or create role
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        description: `${roleName} role`,
        permissions: JSON.stringify(['*']),
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      username: email.split('@')[0],
      passwordHash,
      firstName,
      lastName,
      roleId: role.id,
    },
    include: { role: true },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function getUserFromCookie(cookieHeader: string | null): { userId: string; email: string; role: string } | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function createSessionCookie(userId: string, email: string, role: string): string {
  const data = JSON.stringify({ userId, email, role });
  const encoded = Buffer.from(data).toString('base64');
  return `session=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
