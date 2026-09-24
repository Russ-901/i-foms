import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import User from '@/models/User';
import Staff from '@/models/Staff';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/api-auth';
import { roleForPosition } from '@/lib/roles';

// GET: Fetch all users (admin only)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const users = await User.find()
    .select('-password')
    .populate('staffId', 'name email department position');
  return NextResponse.json(users);
}

// POST: Create new user account synced with staff data (admin only)
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { staffId, username, password } = await req.json();

    const staff = await Staff.findById(staffId);
    if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });

    const existingUser = await User.findOne({ staffId });
    if (existingUser)
      return NextResponse.json({ message: 'User already exists for this staff' }, { status: 400 });

    const role = roleForPosition(staff.position);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      staffId: staff._id,
      status: 'Active',
    });

    return NextResponse.json(
      {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        staffId: newUser.staffId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
