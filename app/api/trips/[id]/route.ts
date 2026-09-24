// app/api/trips/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Trip from '@/models/Trip';
import { requireUser } from '@/lib/api-auth';

// GET a single trip (any logged-in user) — powers the trip details page.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const trip = await Trip.findById(id)
      .populate('vehicleId', 'plateNumber modelName manufacturer fuelType')
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username');

    if (!trip) return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json({ message: 'Error fetching trip' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  // Admins manage the whole trip lifecycle; the assigned driver gets a
  // narrow slice of it so they can work from the field view.
  const { session, error } = await requireUser();
  if (error) return error;

  const { id: tripId } = await params;
  const updates = await req.json();

  const trip = await Trip.findById(tripId);
  if (!trip) return new Response('Trip not found', { status: 404 });

  const isAdmin = session!.user.role === 'admin';
  const isAssignedDriver =
    !!session!.user.staffId &&
    !!trip.driverId &&
    String(trip.driverId) === String(session!.user.staffId);

  if (isAdmin) {
    if (updates.status === 'Cancelled' && trip.status === 'Ongoing') {
      trip.status = 'Cancelled';
      trip.cancellationReason = updates.cancellationReason;
    } else if (['Approved', 'Declined', 'Ongoing', 'Completed'].includes(updates.status)) {
      trip.status = updates.status;
      trip.approvedBy = session!.user.id;

      // Stamp the real start time so live tracking measures progress from now,
      // not from the (possibly past) planned trip date.
      if (updates.status === 'Ongoing' && !trip.actualStartTime) {
        trip.actualStartTime = new Date();
      }
      if (updates.status === 'Completed' && !trip.endDate) {
        trip.endDate = new Date();
      }
    }
  } else if (isAssignedDriver) {
    // A driver may only depart on a trip that's already been approved, and
    // finish one they're currently on. Everything else stays with admins.
    const canStart = updates.status === 'Ongoing' && trip.status === 'Approved';
    const canComplete = updates.status === 'Completed' && trip.status === 'Ongoing';

    if (!canStart && !canComplete) {
      return NextResponse.json(
        { message: 'Drivers can only start an approved trip or complete an ongoing one.' },
        { status: 403 }
      );
    }

    trip.status = updates.status;
    if (canStart && !trip.actualStartTime) trip.actualStartTime = new Date();
    if (canComplete) trip.endDate = new Date();
  } else {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await trip.save();
  return Response.json(trip);
}
