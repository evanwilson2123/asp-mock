import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import AthleteTag, { IAthleteTag } from '@/models/athleteTag';
import Goal from '@/models/goal';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

function getStartDate(range: string | null): Date | null {
  if (!range || range.toUpperCase() === 'ALL') return null;
  const now = new Date();
  switch (range) {
    case 'Past Week':
      now.setDate(now.getDate() - 7);
      break;
    case 'Past Month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'Past 3 Months':
      now.setMonth(now.getMonth() - 3);
      break;
    case 'Past 6 Months':
      now.setMonth(now.getMonth() - 6);
      break;
    case 'Past Year':
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }
  return now;
}

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
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range');
    const startDate = getStartDate(range);
    await connectDB();
    // initially get the athlete
    const athlete = await Athlete.findById(athleteId).exec();

    // fetch the swing count
    const swingCountBlast = await prisma.blastMotion.count({
      where: {
        athlete: athleteId,
        ...(startDate && { date: { gte: startDate } }),
      },
    });
    const swingCountHit = await prisma.hitTrax.count({
      where: {
        athlete: athleteId,
        ...(startDate && { date: { gte: startDate } }),
      },
    });
    // total swing count
    const swingCount = swingCountBlast + swingCountHit;

    // fetch the pitch count
    const pitchCountTrack = await prisma.trackman.count({
      where: {
        athleteId: athleteId,
        ...(startDate && { createdAt: { gte: startDate } }),
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

    const blastNotes = athlete.coachesNotes.filter(
      (n: any) => n.isAthlete && n.section === 'blast'
    );
    const hittraxNotes = athlete.coachesNotes.filter(
      (n: any) => n.isAthlete && n.section === 'hittrax'
    );
    const trackmanNotes = athlete.coachesNotes.filter(
      (n: any) => n.isAthlete && n.section === 'trackman'
    );

    const profileNotes = athlete.coachesNotes.filter(
      (n: any) => n.isAthlete && n.section === 'profile'
    );

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
        blastNotes: blastNotes,
        hittraxNotes: hittraxNotes,
        trackmanNotes: trackmanNotes,
        profileNotes: profileNotes,
        height: athlete.height,
        weight: athlete.weight,
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
