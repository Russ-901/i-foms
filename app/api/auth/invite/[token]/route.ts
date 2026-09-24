import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/connection';
import Staff from '@/models/Staff';
import User from '@/models/User';
import { roleForPosition } from '@/lib/roles';

async function findValidInvite(token: string) {
  const staff = await Staff.findOne({ inviteToken: token }).select(
    '+inviteToken +inviteTokenExpiresAt'
  );
  if (!staff || !staff.inviteTokenExpiresAt || staff.inviteTokenExpiresAt < new Date()) {
    return null;
  }
  return staff;
}

// GET: look up who an invite link belongs to, so the accept-invite page can
// greet them by name before they set a password. Public — no session yet.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;

    const staff = await findValidInvite(token);
    if (!staff) {
      return NextResponse.json({ message: 'Invalid or expired invite link' }, { status: 404 });
    }

    return NextResponse.json({
      name: staff.name,
      email: staff.email,
      department: staff.department,
      position: staff.position,
    });
  } catch (error) {
    console.error('GET /auth/invite/[token] error:', error);
    return NextResponse.json({ message: 'Error loading invite' }, { status: 500 });
  }
}

// POST: accept the invite — creates the User account and consumes the token.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const staff = await findValidInvite(token);
    if (!staff) {
      return NextResponse.json({ message: 'Invalid or expired invite link' }, { status: 404 });
    }

    const existingAccount = await User.findOne({ staffId: staff._id });
    if (existingAccount) {
      return NextResponse.json({ message: 'This invite has already been used' }, { status: 400 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = roleForPosition(staff.position);

    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      staffId: staff._id,
      status: 'Active',
    });

    staff.inviteToken = undefined;
    staff.inviteTokenExpiresAt = undefined;
    await staff.save();

    return NextResponse.json({
      success: true,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('POST /auth/invite/[token] error:', error);
    return NextResponse.json({ message: 'Error accepting invite' }, { status: 500 });
  }
}
