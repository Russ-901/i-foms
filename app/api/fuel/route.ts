import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import FuelRequest from '@/models/Fuel';
import Trip from '@/models/Trip';
import Vehicle from '@/models/Vehicle';
import Report from '@/models/Report';
import { requireUser, requireAdmin } from '@/lib/api-auth';

// 🟩 GET — Fetch all fuel requests (any logged-in user)
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();
    const requests = await FuelRequest.find()
      .populate('vehicleId', 'plateNumber modelName fuelType')
      .populate('tripId', 'tripNumber')
      .populate('requestedBy', 'username email position')
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching fuel requests:', error);
    return NextResponse.json({ message: 'Failed to fetch fuel requests' }, { status: 500 });
  }
}

// 🟦 POST — Staff: create a new fuel request
export async function POST(req: Request) {
  try {
    await connectDB();
    const { session, error } = await requireUser();
    if (error) return error;

    if (session!.user.role !== 'staff') {
      return NextResponse.json({ message: 'Only staff can make fuel requests' }, { status: 403 });
    }

    const { vehicleId, amountLitres, requestDate } = await req.json();
    if (!vehicleId || !amountLitres || !requestDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }

    // ✅ Find active trip for this vehicle that hasn't requested fuel yet
    const trip = await Trip.findOne({ vehicleId, fuelRequested: false })
      .sort({ createdAt: -1 }); // optional: pick latest if multiple

    if (!trip) {
      return NextResponse.json({
        message: 'No eligible trip found for this vehicle or fuel already requested',
      }, { status: 400 });
    }

    // ✅ Create fuel request
    const newFuelRequest = await FuelRequest.create({
      vehicleId,
      tripId: trip._id,
      liters: amountLitres,
      requestedBy: session!.user.id,
      requestDate,
      status: 'Pending',
    });

    // ✅ Update trip to mark fuel requested
    trip.fuelRequested = true;
    await trip.save();

    // 🧾 Log to Report model
    await Report.create({
      staffId: session!.user.staffId,
      actionType: 'CREATE_FUEL_REQUEST',
      description: `Fuel request for ${vehicle.plateNumber} (${vehicle.modelName}) made by ${session!.user.username}`,
      targetId: newFuelRequest._id,
      targetModel: 'FuelRequest',
    });

    return NextResponse.json(newFuelRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating fuel request:', error);
    return NextResponse.json({ message: 'Error creating fuel request' }, { status: 500 });
  }
}

// 🟥 PATCH — Admin: update fuel request status
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { requestId, status, cancellationReason } = await req.json();

    if (!requestId || !status) {
      return NextResponse.json({ message: 'Request ID and status required' }, { status: 400 });
    }

    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    if (status === 'Cancelled' && !cancellationReason) {
      return NextResponse.json({ message: 'Cancellation reason required' }, { status: 400 });
    }

    const updated = await FuelRequest.findByIdAndUpdate(
      requestId,
      { status, cancellationReason },
      { new: true }
    ).populate('vehicleId', 'plateNumber modelName');

    if (!updated) {
      return NextResponse.json({ message: 'Fuel request not found' }, { status: 404 });
    }

    // Log to Report model
    await Report.create({
      staffId: session!.user.staffId,
      actionType: 'UPDATE_FUEL_REQUEST_STATUS',
      description: `Fuel request for ${updated.vehicleId.plateNumber} marked as ${status} by ${session!.user.username}`,
      targetId: updated._id,
      targetModel: 'FuelRequest',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating fuel request:', error);
    return NextResponse.json({ message: 'Error updating fuel request' }, { status: 500 });
  }
}
