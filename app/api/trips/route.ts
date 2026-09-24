import Trip from '@/models/Trip';
import connectDB from '@/lib/connection';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';

// 🟩 GET — fetch all trips (any logged-in user)
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();
    const trips = await Trip.find()
      .populate('requestedBy', 'username')
      .populate('approvedBy', 'username')
      .populate('vehicleId', 'plateNumber modelName');
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ message: 'Failed to fetch trips' }, { status: 500 });
  }
}

// 🟦 POST — create new trip
export async function POST(req: Request) {
  try {
    await connectDB();
    const { session, error } = await requireUser();
    if (error) return error;

    const body = await req.json();

    let tripData = {
      ...body,
      requestedBy: session!.user.id,
      status: session!.user.role === 'staff' ? 'Pending' : body.status || 'Approved',
    };

    if (session!.user.role === 'admin') {
      tripData = { ...tripData, approvedBy: session!.user.id };
    }

    const trip = await Trip.create(tripData);
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ message: 'Failed to create trip' }, { status: 500 });
  }
}
