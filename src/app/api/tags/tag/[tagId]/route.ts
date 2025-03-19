import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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
