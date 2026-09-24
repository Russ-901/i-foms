import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const anyUser = await User.findOne({});
    return NextResponse.json({ hasUser: !!anyUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ hasUser: false });
  }
}
