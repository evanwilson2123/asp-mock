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

    const tags = await AthleteTag.find({}).exec();

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

    const {
      name,
      description,
      notes,
      links,
      automatic, // boolean flag indicating Automatic vs Standard tag
      tech, // expected to be one of 'blast', 'hittrax', 'trackman', 'armcare', 'forceplates'
      session, // boolean flag: true if the tag is for a session, false if for an overview
      metric,
      min,
      max,
      greaterThan,
      lessThan,
    } = await req.json();

    // Check required fields for both Standard and Automatic
    if (!name || !notes) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name and notes are required.' },
        { status: 400 }
      );
    }

    // Base tag data common to both forms
    const tagData: any = {
      name,
      description,
      notes,
      links,
      automatic: Boolean(automatic),
      session: Boolean(session),
    };

    // If the tag is created using the Automatic form,
    // add additional properties.
    if (automatic) {
      tagData.tech = tech; // Make sure the frontend sends the mapped enum (e.g. "blast")
      tagData.metric = metric;

      // Convert to numbers if provided
      if (min !== undefined && min !== '') tagData.min = Number(min);
      if (max !== undefined && max !== '') tagData.max = Number(max);
      if (greaterThan !== undefined && greaterThan !== '')
        tagData.greaterThan = Number(greaterThan);
      if (lessThan !== undefined && lessThan !== '')
        tagData.lessThan = Number(lessThan);
    }

    const tag = new AthleteTag(tagData);
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
