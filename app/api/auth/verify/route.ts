import { NextResponse } from 'next/server';
import connectDB from '@/lib/connection';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token)
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 });

    const mongoose = await connectDB();
    // verificationToken/verified aren't on the User schema (this flow isn't
    // wired up to actually send tokens yet), so this reaches into the raw
    // collection via the shared connection instead of the typed model.
    const users = mongoose.connection.db!.collection('users');

    const user = await users.findOne({ verificationToken: token });
    if (!user)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });

    await users.updateOne(
      { _id: user._id },
      { $set: { verified: true }, $unset: { verificationToken: '' } }
    );

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verified`);
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
