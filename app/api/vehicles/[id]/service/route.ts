import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Service from '@/models/Service';
import Vehicle from '@/models/Vehicle';
import { requireUser, requireAdmin } from '@/lib/api-auth';

// GET service history for a vehicle (any logged-in user).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const records = await Service.find({ vehicleId: id }).sort({ serviceDate: -1 });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching service history:', error);
    return NextResponse.json({ message: 'Error fetching service history' }, { status: 500 });
  }
}

// POST a new service record (admin-only — mirrors who manages fleet maintenance).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const { description, odometer, cost, servicedBy, serviceDate } = await req.json();

    if (!description) {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });

    const record = await Service.create({
      vehicleId: id,
      description,
      odometer: typeof odometer === 'number' ? odometer : undefined,
      cost: typeof cost === 'number' ? cost : undefined,
      servicedBy: servicedBy || undefined,
      serviceDate: serviceDate || undefined,
    });

    // Keep the vehicle's mileage current if this service logged a higher reading.
    if (typeof odometer === 'number' && odometer > vehicle.mileage) {
      vehicle.mileage = odometer;
      await vehicle.save();
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating service record:', error);
    return NextResponse.json({ message: 'Error creating service record' }, { status: 500 });
  }
}
