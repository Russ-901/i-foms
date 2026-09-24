import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { roles } from '@/lib/roles';

// Shared helpers so API routes don't repeat the same session/role checks.
// Usage: const { session, error } = await requireUser(); if (error) return error;

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireUser();
  if (error) return { session: null, error };

  if (session!.user.role !== roles.ADMIN) {
    return { session: null, error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { session, error: null };
}
