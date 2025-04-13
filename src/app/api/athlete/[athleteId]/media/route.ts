import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET endpoint to retrieve athlete media used for mechanical analysis.
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
  const athleteId = context.params.athleteId; // access directly
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
 * POST endpoint for uploading media for the athlete.
 *
 * For photos: Expects a multipart/form-data request and uploads via server (using put()).
 * For videos: Expects an application/json request containing { media, mediaType, mediaName }
 *            where "media" is the Vercel Blob URL (obtained via a client upload).
 */
export async function POST(req: NextRequest, context: any) {
  console.log('Endpoint hit');
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = context.params.athleteId; // access directly
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

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // Client upload for videos sends a JSON payload.
      const json = await req.json();
      const { media, mediaType, mediaName } = json;
      if (mediaType !== 'video') {
        return NextResponse.json(
          { error: 'Invalid media type for this flow.' },
          { status: 400 }
        );
      }
      const mediaData = {
        name: mediaName || 'Uploaded Video',
        link: media,
        date: new Date(),
        // Optionally, add blobName if you want to support deletion via blob key.
      };
      athlete.videos.push(mediaData);
      await athlete.save();
      return NextResponse.json({ media: mediaData }, { status: 200 });
    } else {
      // Otherwise, assume multipart form (for photos).
      const formData = await req.formData();
      const mediaFile = formData.get('media');
      if (!mediaFile) {
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
      // New field for media name
      const mediaName = formData.get('mediaName');

      let blob: any;
      let mediaData: {
        name: string;
        link: string;
        date: Date;
        blobName?: string;
      };

      if (mediaType === 'photo') {
        // Generate a unique blob key if desired
        const blobKey =
          athlete._id.toString() + '_' + Date.now() + '_imageMedia';
        blob = await put(blobKey, mediaFile, { access: 'public' });
        mediaData = {
          name:
            (mediaName as string) ||
            (mediaFile as File).name ||
            'Uploaded Image',
          link: blob.url,
          date: new Date(),
          blobName: blobKey,
        };
        athlete.images.push(mediaData);
      } else {
        // For videos in this branch, you do nothing—videos should be uploaded via the client.
        return NextResponse.json(
          { error: 'For videos, please use the client upload flow.' },
          { status: 400 }
        );
      }
      await athlete.save();
      return NextResponse.json({ media: mediaData }, { status: 200 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  const { searchParams } = req.nextUrl;
  const mediaId = searchParams.get('mediaId');
  const mediaType = searchParams.get('mediaType');
  if (!mediaId || !mediaType || !athleteId) {
    console.log('Missing search params or athleteId');
    return NextResponse.json(
      { error: 'Missing Search Params' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      console.log('Could not find athlete by ID');
      return NextResponse.json(
        { error: 'could not find athlete by ID' },
        { status: 404 }
      );
    }
    switch (mediaType) {
      case 'photo':
        for (const image of athlete.images) {
          if (image._id.toString() === mediaId) {
            await del(image.link);
          }
        }
        athlete.images = athlete.images.filter(
          (i: any) => i._id.toString() !== mediaId
        );
        break;
      case 'video':
        for (const video of athlete.videos) {
          if (video._id.toString() === mediaId) {
            await del(video.link);
          }
        }
        athlete.videos = athlete.videos.filter(
          (i: any) => i._id.toString() !== mediaId
        );
        break;
      default:
        console.log('Invalid media type');
        return NextResponse.json(
          { error: 'Invalid mediaType' },
          { status: 400 }
        );
    }
    await athlete.save();

    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
