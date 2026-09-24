import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Staff from '@/models/Staff';
import { requireUser } from '@/lib/api-auth';

// GET: any logged-in user (trip creation needs the staff/driver list)
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  await connectDB();
  const staff = await Staff.find();
  return NextResponse.json(staff);
}

// POST: intentionally open (no session yet) — the signup page creates the
// Staff profile before the linked User account exists.
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const staff = await Staff.create(body);
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating staff' }, { status: 500 });
  }
}
