import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import AthleteTag, { IAthleteTag } from '@/models/athleteTag';
import { auth } from '@clerk/nextjs/server';
import { Types } from 'mongoose';
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

    let tagIds: Types.ObjectId[] = [];

    const athlete = await Athlete.findById(athleteId).exec();

    switch (tech) {
      case 'blast':
        tagIds = athlete.blastTags;
        break;
      case 'hittrax':
        tagIds = athlete.hitTags;
        break;
      case 'trackman':
        tagIds = athlete.trackTags;
        break;
      case 'armcare':
        tagIds = athlete.armTags;
        break;
      case 'forceplates':
        tagIds = athlete.forceTags;
        break;
      case 'asessments':
        tagIds = athlete.assessmentTags;
        break;
      default:
        return NextResponse.json({ error: 'Invalid Tech' }, { status: 400 });
    }

    const tags: IAthleteTag[] = await AthleteTag.find({
      _id: { $in: tagIds },
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

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const { athleteId, tech } = await context.params;
  if (!athleteId || !tech) {
    return NextResponse.json({ error: 'Missing param' }, { status: 400 });
  }
  try {
    await connectDB();

    const { tagId } = await req.json();
    if (!tagId) {
      return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });
    }

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    switch (tech) {
      case 'blast':
        athlete.blastTags.push(tagId);
        break;
      case 'hittrax':
        athlete.hitTags.push(tagId);
        break;
      case 'trackman':
        athlete.trackTags.push(tagId);
        break;
      case 'armcare':
        athlete.armTags.push(tagId);
        break;
      case 'forceplates':
        athlete.forceTags.push(tagId);
        break;
      case 'asessments':
        athlete.assessmentTags.push(tagId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid tech' }, { status: 400 });
    }

    await athlete.save();

    return NextResponse.json(
      { message: 'Tag saved successfully' },
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
