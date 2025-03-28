import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import TagFolder from '@/models/tagFolder';

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

    const { tagId, folderId } = await req.json();
    if (!tagId || !folderId) {
      console.log('Missing body field');
      return NextResponse.json(
        { error: 'Missing body field' },
        { status: 400 }
      );
    }
    const folder = await TagFolder.findById(folderId).exec();
    if (!folder) {
      console.log('Folder not found for ID');
      return NextResponse.json({ error: 'Folder not foun' }, { status: 404 });
    }
    const folders = await TagFolder.find({ tags: { $in: tagId } });
    for (const folder of folders) {
      folder.tags = folder.tags.filter((id: any) => id.toString() !== tagId);
      await folder.save();
    }
    folder.tags.push(tagId);
    await folder.save();
    console.log('Folder updated!');
    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
