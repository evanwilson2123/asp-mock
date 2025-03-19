import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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

    const tags = await AthleteTag.find().exec();

    return NextResponse.json({ tags }, { status: 200 });
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

    const { name, description, notes, links } = await req.json();
    if (!name || !notes) {
      console.log('Missing body field');
      return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    }

    const tag = new AthleteTag({
      athleteIds: [],
      name: name,
      description: description,
      notes: notes,
      links: links,
    });

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
