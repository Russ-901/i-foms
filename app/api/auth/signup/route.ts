import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Staff from '@/models/Staff';
import { roleForPosition } from '@/lib/roles';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, password, staffId } = await req.json();

    if (!username || !password || !staffId) {
      return NextResponse.json(
        { message: 'Username, password and staff profile are required' },
        { status: 400 }
      );
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return NextResponse.json({ message: 'Staff profile not found' }, { status: 404 });
    }

    // Check if any admin user exists
    const hasAdmin = await User.findOne({ role: 'admin' });
    const isFirstUser = !hasAdmin;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role is always derived server-side from the staff position, never
    // trusted from the client — except the very first account, which
    // becomes admin so someone can manage the system.
    const finalRole = isFirstUser ? 'admin' : roleForPosition(staff.position);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: finalRole,
      staffId: staff._id,
      status: 'Active',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      },
      message: isFirstUser
        ? 'First admin account created successfully!'
        : 'User account created successfully!',
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
