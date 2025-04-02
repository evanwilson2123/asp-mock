import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import AthleteTag, { IAthleteTag } from '@/models/athleteTag';
import Goal from '@/models/goal';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const { athleteId } = await context.params;
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Missing athleteId param' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    // initially get the athlete
    const athlete = await Athlete.findById(athleteId).exec();

    // fetch the swing count
    const swingCountBlast = await prisma.blastMotion.count({
      where: {
        athlete: athleteId,
      },
    });
    const swingCountHit = await prisma.hitTrax.count({
      where: {
        athlete: athleteId,
      },
    });
    // total swing count
    const swingCount = swingCountBlast + swingCountHit;

    // fetch the pitch count
    const pitchCountTrack = await prisma.trackman.count({
      where: {
        athleteId: athleteId,
      },
    });
    const pitchCountIntended = await prisma.trackman.count({
      where: {
        athleteId: athleteId,
      },
    });
    // total pitch count
    const pitchCount = pitchCountTrack + pitchCountIntended;

    // fetch the tags for all of the different locations
    const hitTags: IAthleteTag[] = [];
    for (const tagId of athlete.hitTags) {
      const tag = await AthleteTag.findById(tagId);
      hitTags.push(tag);
    }
    const blastTags: IAthleteTag[] = [];
    for (const tagId of athlete.blastTags) {
      const tag = await AthleteTag.findById(tagId);
      blastTags.push(tag);
    }
    const trackTags: IAthleteTag[] = [];
    for (const tagId of athlete.trackTags) {
      const tag = await AthleteTag.findById(tagId);
      trackTags.push(tag);
    }
    const armTags: IAthleteTag[] = [];
    for (const tagId of athlete.armTags) {
      const tag = await AthleteTag.findById(tagId);
      armTags.push(tag);
    }
    const forceTags: IAthleteTag[] = [];
    for (const tagId of athlete.forceTags) {
      const tag = await AthleteTag.findById(tagId);
      forceTags.push(tag);
    }
    const assessmentTags: IAthleteTag[] = [];
    for (const tagId of athlete.assessmentTags) {
      const tag = await AthleteTag.findById(tagId);
      assessmentTags.push(tag);
    }

    // fetch the goals
    const goals = await Goal.find({ athlete: athleteId }).exec();
    return NextResponse.json(
      {
        swingCount,
        pitchCount,
        hitTags,
        blastTags,
        trackTags,
        armTags,
        forceTags,
        assessmentTags,
        goals,
      },
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
