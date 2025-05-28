import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Helper function to save uploaded files
async function saveUploadedFile(file: File, tagId: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tags', tagId);
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const uniqueFilename = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // Save the file
  await writeFile(filePath, buffer);
  
  // Return the public URL path
  return `/uploads/tags/${tagId}/${uniqueFilename}`;
}

// Helper function to delete files
async function deleteFile(filePath: string) {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  if (existsSync(fullPath)) {
    await writeFile(fullPath, ''); // Clear the file
  }
}

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Reques');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const tagId = await context.params.tagId;
  if (!tagId) {
    console.log('Missing a parameter');
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
  }
  try {
    await connectDB();

    const tag = await AthleteTag.findOne({ _id: tagId }).exec();
    if (!tag) {
      console.log('Tag not found');
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
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

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const tagId = await context.params.tagId;
  if (!tagId) {
    return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });
  }
  try {
    await connectDB();

    await AthleteTag.findByIdAndDelete(tagId).exec();

    return NextResponse.json({ message: 'Tag deleted' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json({ error: "Unauthorized Request" }, { status: 401 });
  }
  const tagId = await context.params.tagId as string;
  if (!tagId) {
    console.log('Missing tagId');
    return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });
  }
  try {
    await connectDB();

    const tag = await AthleteTag.findById(tagId);
    if (!tag) {
      console.log('Tag to edit not found');
      return NextResponse.json({ error: 'Tag to edit not found' }, { status: 404 });
    }

    // Handle multipart form data
    const formData = await req.formData();
    
    // Update basic fields
    const name = formData.get('name');
    const description = formData.get('description');
    const notes = formData.get('notes');
    const links = formData.get('links');
    const automatic = formData.get('automatic');
    const tech = formData.get('tech');
    const metric = formData.get('metric');
    const min = formData.get('min');
    const max = formData.get('max');
    const greaterThan = formData.get('greaterThan');
    const lessThan = formData.get('lessThan');

    if (name) tag.name = name as string;
    if (description) tag.description = description as string;
    if (notes) tag.notes = notes as string;
    if (links) tag.links = JSON.parse(links as string);
    if (automatic) tag.automatic = automatic === 'true';
    if (tech) tag.tech = tech as string;
    if (metric) tag.metric = metric as string;
    if (min) tag.min = Number(min);
    if (max) tag.max = Number(max);
    if (greaterThan) tag.greaterThan = Number(greaterThan);
    if (lessThan) tag.lessThan = Number(lessThan);

    // Handle image deletions
    const imagesToDelete = formData.get('imagesToDelete');
    if (imagesToDelete) {
      const urlsToDelete = JSON.parse(imagesToDelete as string) as string[];
      for (const url of urlsToDelete) {
        await deleteFile(url);
      }
      tag.media = tag.media.filter((url: string) => !urlsToDelete.includes(url));
    }

    // Handle new image uploads
    const imageFiles = formData.getAll('images') as File[];
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(file => saveUploadedFile(file, tagId));
      const newImageUrls = await Promise.all(uploadPromises);
      tag.media = [...tag.media, ...newImageUrls];
    }

    await tag.save();

    return NextResponse.json({ tag }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
