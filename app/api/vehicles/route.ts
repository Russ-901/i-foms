import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Vehicle from '@/models/Vehicle';
import Report from '@/models/Report';
import { requireUser } from '@/lib/api-auth';

// GET all vehicles (any logged-in user)
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  await connectDB();
  const vehicles = await Vehicle.find().populate('staffId', 'name email position');
  return NextResponse.json(vehicles);
}

// POST: Add new vehicle by a staff
export async function POST(req: Request) {
  try {
    await connectDB();
    const { session, error } = await requireUser();
    if (error) return error;

    const staffId = session!.user.staffId; // Staff record linked to this user
    const { manufacturer, modelName, year, plateNumber, mileage, fuelType } = await req.json();

    const newVehicle = await Vehicle.create({
      manufacturer,
      modelName,
      year,
      plateNumber,
      mileage,
      fuelType,
      staffId,
    });

    // Log the action in Report model
    await Report.create({
      staffId,
      actionType: 'CREATE_VEHICLE',
      description: `New vehicle ${manufacturer} ${modelName} (${plateNumber}) registered by ${session!.user.username}`,
      targetId: newVehicle._id,
      targetModel: 'Vehicle',
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    const detail = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ message: 'Error creating vehicle', ...(detail && { detail }) }, { status: 500 });
  }
}
