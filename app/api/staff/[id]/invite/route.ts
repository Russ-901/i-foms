import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/connection';
import Staff from '@/models/Staff';
import User from '@/models/User';
import { sendInviteEmail } from '@/lib/mailer';
import { requireAdmin } from '@/lib/api-auth';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST: (re)generate an invite link for a staff member who doesn't have a
// User account yet. Always returns the link so the admin can copy/share it
// even if email sending fails or isn't configured; email is best-effort.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const staff = await Staff.findById(id);
    if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });

    const existingAccount = await User.findOne({ staffId: id });
    if (existingAccount) {
      return NextResponse.json(
        { message: 'This staff member already has an account.' },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(24).toString('hex');
    staff.inviteToken = token;
    staff.inviteTokenExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await staff.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const inviteUrl = `${appUrl}/auth/accept-invite?token=${token}`;

    let emailSent = false;
    try {
      await sendInviteEmail(staff.email, staff.name, inviteUrl);
      emailSent = true;
    } catch (err) {
      // Email is a nice-to-have here — the admin still gets a copyable link.
      console.error('Failed to send invite email:', err);
    }

    return NextResponse.json({
      inviteUrl,
      inviteToken: token,
      expiresAt: staff.inviteTokenExpiresAt,
      emailSent,
    });
  } catch (error) {
    console.error('POST /staff/[id]/invite error:', error);
    return NextResponse.json({ message: 'Error creating invite' }, { status: 500 });
  }
}
