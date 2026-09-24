import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Vehicle from '@/models/Vehicle';
import Trip, { ITrip } from '@/models/Trip';
import { requireUser } from '@/lib/api-auth';
import { HydratedDocument } from 'mongoose';

// There's no real GPS hardware wired up here, so a vehicle's position is
// simulated: while a trip is "Ongoing" it's animated along a straight line
// from origin to destination over this fixed duration, based on elapsed
// wall-clock time since the trip started. This is computed fresh on every
// request — nothing is persisted, so there's no drift or write contention.
const SIMULATION_DURATION_MS = 3 * 60 * 1000; // 3 minutes

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();

    const [vehicles, trips] = await Promise.all([
      Vehicle.find(),
      Trip.find({ status: { $in: ['Ongoing', 'Completed'] } }).sort({ startDate: -1 }),
    ]);

    // Pick the most relevant trip per vehicle: an Ongoing one wins, otherwise
    // fall back to the most recently Completed one (parked at its destination).
    const tripByVehicle = new Map<string, HydratedDocument<ITrip>>();
    for (const trip of trips) {
      const vehicleId = trip.vehicleId.toString();
      const existing = tripByVehicle.get(vehicleId);
      if (!existing || (existing.status !== 'Ongoing' && trip.status === 'Ongoing')) {
        tripByVehicle.set(vehicleId, trip);
      }
    }

    const points = vehicles
      .map((vehicle) => {
        const trip = tripByVehicle.get(String(vehicle._id));
        if (
          !trip ||
          trip.originLat == null || trip.originLng == null ||
          trip.destinationLat == null || trip.destinationLng == null
        ) {
          return null;
        }

        let lat: number;
        let lng: number;
        let progress: number;

        if (trip.status === 'Ongoing') {
          // Prefer when the trip was actually started; fall back to the
          // planned date for trips started before that was recorded.
          const startedAt = trip.actualStartTime ?? trip.startDate;
          const elapsed = Date.now() - new Date(startedAt).getTime();
          progress = Math.min(Math.max(elapsed / SIMULATION_DURATION_MS, 0), 1);
          lat = lerp(trip.originLat, trip.destinationLat, progress);
          lng = lerp(trip.originLng, trip.destinationLng, progress);
        } else {
          lat = trip.destinationLat;
          lng = trip.destinationLng;
          progress = 1;
        }

        return {
          vehicleId: String(vehicle._id),
          plateNumber: vehicle.plateNumber,
          modelName: vehicle.modelName,
          status: progress < 1 ? 'moving' : 'parked',
          tripStatus: trip.status,
          tripNumber: trip.tripNumber,
          lat,
          lng,
          progress,
        };
      })
      .filter((p) => p !== null);

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error building vehicle tracking data:', error);
    return NextResponse.json({ message: 'Failed to load tracking data' }, { status: 500 });
  }
}
