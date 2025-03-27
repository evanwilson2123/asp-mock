import { connectDB } from '@/lib/db';
import TagFolder from '@/models/tagFolder';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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

    const { folderName } = await req.json();
    if (!folderName) {
      console.log('Missing folder name');
      return NextResponse.json(
        { error: 'Missing folder name in body' },
        { status: 400 }
      );
    }
    const folder = new TagFolder({
      name: folderName,
    });

    await folder.save();
    return NextResponse.json({ folder }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
