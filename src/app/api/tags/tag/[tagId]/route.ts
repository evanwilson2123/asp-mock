import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

export async function GET(
  req: NextRequest,
  context: any 
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const tagId = await context.params.tagId;
  if (!tagId) {
    return NextResponse.json({ error: 'Missing tag ID' }, { status: 400 });
  }
  try {
    await connectDB();
    const tag = await AthleteTag.findById(tagId).exec();
    if (!tag) {
      return NextResponse.json(
        { error: 'Could not find tag' },
        { status: 404 }
      );
    }
    return NextResponse.json({ tag }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: any
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const tagId = await context.params.tagId;
  if (!tagId) {
    return NextResponse.json({ error: 'Missing tag ID' }, { status: 400 });
  }
  try {
    await connectDB();
    const tag = await AthleteTag.findById(tagId).exec();
    if (!tag) {
      return NextResponse.json(
        { error: 'Could not find tag' },
        { status: 404 }
      );
    }

    // Handle multipart form data
    const formData = await req.formData();
    
    // Get basic fields
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const notes = formData.get('notes') as string;
    const links = formData.get('links') as string;
    const automatic = formData.get('automatic') as string;
    const tech = formData.get('tech') as string;
    const metric = formData.get('metric') as string;
    const min = formData.get('min') as string;
    const max = formData.get('max') as string;
    const greaterThan = formData.get('greaterThan') as string;
    const lessThan = formData.get('lessThan') as string;

    // Check required fields
    if (!name || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: name and notes are required.' },
        { status: 400 }
      );
    }

    // Update basic fields
    tag.name = name;
    tag.description = description;
    tag.notes = notes;
    tag.links = links ? JSON.parse(links) : undefined;
    tag.automatic = automatic === 'true';

    // Update automatic tag properties if applicable
    if (automatic === 'true') {
      tag.tech = tech;
      tag.metric = metric;
      if (min) tag.min = Number(min);
      if (max) tag.max = Number(max);
      if (greaterThan) tag.greaterThan = Number(greaterThan);
      if (lessThan) tag.lessThan = Number(lessThan);
    } else {
      // Clear automatic properties if switching to standard tag
      tag.tech = undefined;
      tag.metric = undefined;
      tag.min = undefined;
      tag.max = undefined;
      tag.greaterThan = undefined;
      tag.lessThan = undefined;
    }

    // Handle images to delete
    const imagesToDelete = formData.get('imagesToDelete') as string;
    if (imagesToDelete) {
      const urlsToDelete = JSON.parse(imagesToDelete) as string[];
      // Delete images from Vercel Blob storage
      await Promise.all(
        urlsToDelete.map(async (url) => {
          try {
            await del(url);
          } catch (error) {
            console.error(`Error deleting blob: ${url}`, error);
          }
        })
      );
      // Update tag's media array to remove deleted images
      tag.media = tag.media.filter((url: string) => !urlsToDelete.includes(url));
    }

    // Handle new image uploads
    const imageFiles = formData.getAll('images') as File[];
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file, index) => {
        const blob = await put(`tags/${tagId}/image_${Date.now()}_${index}`, file, {
          access: 'public',
        });
        return blob.url;
      });
      
      const newImageUrls = await Promise.all(uploadPromises);
      tag.media = [...(tag.media || []), ...newImageUrls];
    }

    await tag.save();
    return NextResponse.json({ tag }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: any 
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const tagId = await context.params.tagId;
  if (!tagId) {
    return NextResponse.json({ error: 'Missing tag ID' }, { status: 400 });
  }
  try {
    await connectDB();
    const tag = await AthleteTag.findById(tagId).exec();
    if (!tag) {
      return NextResponse.json(
        { error: 'Could not find tag' },
        { status: 404 }
      );
    }

    // Delete all images from Vercel Blob storage
    if (tag.media && tag.media.length > 0) {
      await Promise.all(
        tag.media.map(async (url: string) => {
          try {
            await del(url);
          } catch (error) {
            console.error(`Error deleting blob: ${url}`, error);
          }
        })
      );
    }

    await AthleteTag.findByIdAndDelete(tagId).exec();
    return NextResponse.json({ message: 'Tag deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
