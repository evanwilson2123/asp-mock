import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
/**
 * This endpoint is intended for the retrieval of athlete media used for
 * mechanical analysis
 * @param req
 * @param context
 * @returns { images: IMedia, videos: IMedia }
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId');
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  try {
    await connectDB();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      console.log('Could not find athlete by ID');
      return NextResponse.json(
        { error: 'Could not find athlete by athleteId' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { images: athlete.images, videos: athlete.videos },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
/**
 * This endpoint is for uploading media for the athlete
 * This media will include:
 *  - Photos of mechanical analysis
 *  - Videos of mechanical analysis used for side by side comparisons
 * @param req
 * @param context
 * @returns
 */
export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId');
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  try {
    await connectDB();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      console.log('Could not find athlete by ID');
      return NextResponse.json(
        { error: 'Could not find athlete by ID' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const media = formData.get('media');
    if (!media) {
      console.log('Missing media');
      return NextResponse.json(
        { error: 'Missing media in upload' },
        { status: 400 }
      );
    }
    const mediaType = formData.get('mediaType');
    if (!mediaType) {
      console.log('Missing media type specification');
      return NextResponse.json(
        { error: 'Missing media type specification' },
        { status: 400 }
      );
    }
    try {
      let blob: any;
      if (mediaType === 'photo') {
        blob = await put(athlete._id + '_imageMedia', media, {
          access: 'public',
        });
        athlete.images.push(blob.url);
      } else if (mediaType === 'video') {
        blob = await put(athlete._id + '_videoMedia', media, {
          access: 'public',
        });
        athlete.videos.push(blob.url);
      } else {
        console.log('Invalid media type');
        return NextResponse.json(
          { error: 'Invalid media type' },
          { status: 400 }
        );
      }
      await athlete.save();
      return NextResponse.json({ url: blob.url }, { status: 200 });
    } catch (error: any) {
      console.error(error);
      console.log('Error uploading media');
      return NextResponse.json(
        { error: 'Error uploading media to blob' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
