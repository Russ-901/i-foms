import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import Vehicle from '@/models/Vehicle';
import { requireUser, requireAdmin } from '@/lib/api-auth';

// GET a single vehicle (any logged-in user) — powers the vehicle details page.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const vehicle = await Vehicle.findById(id).populate('staffId', 'name email position');
    if (!vehicle) return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json({ message: 'Error fetching vehicle' }, { status: 500 });
  }
}

// PATCH: admin-only, and limited to the fields the details page actually
// lets an admin change (availability status and a manual mileage correction).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const updates: { status?: string; mileage?: number } = {};
    if (typeof data.status === 'string') updates.status = data.status;
    if (typeof data.mileage === 'number') updates.mileage = data.mileage;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await Vehicle.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ message: 'Error updating vehicle' }, { status: 500 });
  }
}
