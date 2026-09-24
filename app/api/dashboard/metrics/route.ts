import { NextResponse } from 'next/server';
import dbConnect from '@/lib/connection';
import Trip from '@/models/Trip';
import Vehicle from '@/models/Vehicle';
import Fuel from '@/models/Fuel';
import Report from '@/models/Report';
import User from '@/models/User';
import Staff, { IStaff } from '@/models/Staff';
import { requireUser } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    await dbConnect();

    const [trips, vehicles, fuelRequests, reports, users, staff] = await Promise.all([
      Trip.countDocuments(),
      Vehicle.countDocuments(),
      Fuel.countDocuments({ status: 'Pending' }),
      Report.countDocuments(),
      User.countDocuments(),
      Staff.countDocuments(),
    ]);

    const recentActivity = await Report.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate<{ staffId: IStaff | null }>('staffId', 'name email position')
      .lean();

    return NextResponse.json({
      trips,
      vehicles,
      fuelRequests,
      reports,
      users,
      staff,
      recentActivity: recentActivity.map((r) => {
        // ✅ Safely narrow the type
        const staff =
          r.staffId && typeof r.staffId === 'object' && !('toHexString' in r.staffId)
            ? (r.staffId as IStaff)
            : null;

        return {
          action: r.description,
          user: staff?.name ?? 'Unknown Staff',
          position: staff?.position ?? 'N/A',
          model: r.targetModel,
          timestamp: r.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ message: 'Error loading metrics' }, { status: 500 });
  }
}