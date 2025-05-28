import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import TagFolder from '@/models/tagFolder';
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

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    const tags = await AthleteTag.find({}).exec();
    const folders = await TagFolder.find().exec();

    return NextResponse.json({ tags: tags, folders: folders }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

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
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name and notes are required.' },
        { status: 400 }
      );
    }

    // Create base tag data
    const tagData: any = {
      name,
      description,
      notes,
      links: links ? JSON.parse(links) : undefined,
      automatic: automatic === 'true',
      session: false,
    };

    // Add automatic tag properties if applicable
    if (automatic === 'true') {
      tagData.tech = tech;
      tagData.metric = metric;
      if (min) tagData.min = Number(min);
      if (max) tagData.max = Number(max);
      if (greaterThan) tagData.greaterThan = Number(greaterThan);
      if (lessThan) tagData.lessThan = Number(lessThan);
    }

    // Create the tag first to get its ID
    const tag = new AthleteTag(tagData);
    await tag.save();

    // Handle image uploads
    const imageFiles = formData.getAll('images') as File[];
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(file => saveUploadedFile(file, tag._id.toString()));
      const newImageUrls = await Promise.all(uploadPromises);
      tag.media = newImageUrls;
      await tag.save();
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
