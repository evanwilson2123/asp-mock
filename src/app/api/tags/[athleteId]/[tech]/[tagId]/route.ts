import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const { athleteId, tech, tagId } = await context.params;
  if (!athleteId || !tech || !tagId) {
    return NextResponse.json(
      { error: 'Missing parameter(s)' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    switch (tech) {
      case 'blast':
        athlete.blastTags = athlete.blastTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      case 'hittrax':
        athlete.hitTags = athlete.hitTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      case 'trackman':
        athlete.trackTags = athlete.trackTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      case 'armcare':
        athlete.armTags = athlete.armTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      case 'forceplates':
        athlete.forceTags = athlete.forceTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      case 'assessments':
        athlete.assessmentTags = athlete.assessmentTags.filter(
          (id: any) => id.toString() !== tagId
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid tech' }, { status: 400 });
    }
    await athlete.save();

    console.log('Deleted tag');
    return NextResponse.json(
      { message: 'Deleted successfully' },
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
