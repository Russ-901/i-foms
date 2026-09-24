import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Staff from '@/models/Staff';
import User from '@/models/User';
import Trip from '@/models/Trip';
import { requireAdmin } from '@/lib/api-auth';

// GET a single staff member with their account/invite status (admin-only —
// this is the one place invite tokens are ever returned).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const staff = await Staff.findById(id).select('+inviteToken +inviteTokenExpiresAt');
    if (!staff) return NextResponse.json({ message: 'Staff not found' }, { status: 404 });

    const account = await User.findOne({ staffId: id }).select('username role status');

    // Drivers get their trip history shown on the details page.
    const trips = ['Driver', 'Senior Driver'].includes(staff.position)
      ? await Trip.find({ driverId: id })
          .populate('vehicleId', 'plateNumber modelName')
          .sort({ startDate: -1 })
      : [];

    const hasValidInvite =
      !!staff.inviteToken && !!staff.inviteTokenExpiresAt && staff.inviteTokenExpiresAt > new Date();

    return NextResponse.json({
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        department: staff.department,
        position: staff.position,
        createdAt: staff.createdAt,
      },
      account,
      invite: hasValidInvite
        ? { token: staff.inviteToken, expiresAt: staff.inviteTokenExpiresAt }
        : null,
      trips,
    });
  } catch (error) {
    console.error('GET /staff/[id] error:', error);
    const detail = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ message: 'Error fetching staff', ...(detail && { detail }) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Whitelist: invite fields are only ever managed by the invite route.
    const updates: Record<string, string> = {};
    for (const field of ['name', 'email', 'phone', 'department', 'position'] as const) {
      if (typeof body[field] === 'string') updates[field] = body[field];
    }

    const updated = await Staff.findByIdAndUpdate(id, updates, { new: true });
    if (!updated)
      return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /staff/[id] error:', error);
    return NextResponse.json({ message: 'Error updating staff' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const deleted = await Staff.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('DELETE /staff/[id] error:', error);
    return NextResponse.json({ message: 'Error deleting staff' }, { status: 500 });
  }
}
