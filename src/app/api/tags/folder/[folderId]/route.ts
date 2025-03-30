import { connectDB } from '@/lib/db';
import TagFolder from '@/models/tagFolder';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const folderId = await context.params.folderId;
  if (!folderId) {
    console.log('Missing parameter');
    return NextResponse.json(
      { error: 'Missing folderId parameter' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    await TagFolder.findByIdAndDelete(folderId).exec();

    console.log('Folder deleted successfully');
    return NextResponse.json(
      { message: 'Folder deleted successfully' },
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
