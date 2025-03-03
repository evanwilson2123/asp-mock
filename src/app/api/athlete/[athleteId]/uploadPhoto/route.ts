import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: 'Missing athlete ID' }, { status: 400 });
  }
  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json(
        { error: 'Could not find athlete' },
        { status: 404 }
      );
    }
    const formData = await req.formData();
    const photo = formData.get('photo');
    if (!photo) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }
    try {
      const blob = await put(athlete._id + '_profilePhoto', photo, {
        access: 'public',
      });
      athlete.pPhotoUrl = blob.url;
      await athlete.save();
      return NextResponse.json({ profilePhotoUrl: blob.url }, { status: 200 });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { error: 'Error uploading image' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
