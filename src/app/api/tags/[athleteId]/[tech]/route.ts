import { connectDB } from '@/lib/db';
import AthleteTag from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 *
 * @param req { }
 * @param context { athleteId, tech }
 * @returns { tags: IAthleteTag[] }
 *
 * This Get Request is built with the intention of gathering all athleteTags
 * for the specified technology, derived from the request paramaters
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
  const { athleteId, tech } = await context.params;
  if (!athleteId || !tech) {
    console.log('Missing a request parameter');
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
  }
  try {
    await connectDB();

    const tags = await AthleteTag.find({
      athleteId: athleteId,
      tech: tech,
    }).exec();

    if (!tags) {
      console.log(
        `No tags found for athleteId: ${athleteId} and tech: ${tech}`
      );
      return NextResponse.json({ error: 'No tags found' }, { status: 404 });
    }

    return NextResponse.json({ tags }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 *
 * @param req { name, description?, notes, links? }
 * @param context { athleteId, tech }
 * @returns { tag: IAthleteTag }
 *
 * This POST request is built with the intention of creating a new tag,
 * these tags will be used to reference athletes to both automatically
 * and coach selected exercises based on their tech recorded statistics
 */
export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const { athleteId, tech } = await context.params;

  // if required parameters are missing, return an error
  if (!athleteId || !tech) {
    console.log(`Missing parameter\n athleteId: ${athleteId} tech: ${tech}`);
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
  }

  try {
    await connectDB();

    const { name, description, notes, links } = await req.json();
    // Check and verify the existence of the required body components
    if (!name || !notes) {
      return NextResponse.json(
        { error: 'Missing name or notes' },
        { status: 400 }
      );
    }

    // Create the new tag
    const tag = new AthleteTag({
      athleteId: athleteId,
      tech: tech,
      name: name,
      description: description,
      notes: notes,
      links: links,
    });

    await tag.save();

    console.log('Tag created');
    return NextResponse.json({ tag }, { status: 200 });

    // Catch any uncaught errors and log
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
