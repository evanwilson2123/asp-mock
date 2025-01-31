import { NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismaDb';

interface Response {
  athleteCount: number;
  athletePCount: number;
  athleteHCount: number;
  athletePHCount: number;
  athleteSCCount: number;
  pitchCount: number;
  blastCount: number;
  hitCount: number;
  armCount: number;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const pitchCount = await prisma.trackman.count();
    const blastCount = await prisma.blastMotion.count();
    const hitCount = await prisma.hitTrax.count();
    const armCount = await prisma.armCare.count();
    const athleteCount = await Athlete.countDocuments(
      {},
      { hint: '_id_' }
    ).exec();
    const athletePCount = await Athlete.countDocuments({
      programType: 'Pitching',
    }).exec();
    const athleteHCount = await Athlete.countDocuments({
      programType: 'Hitting',
    }).exec();
    const athletePHCount = await Athlete.countDocuments({
      programType: 'Pitching + Hitting',
    }).exec();
    const athleteSCCount = await Athlete.countDocuments({
      programType: 'S + C',
    }).exec();
    const response: Response = {
      athleteCount,
      athletePCount,
      athleteHCount,
      athletePHCount,
      athleteSCCount,
      pitchCount,
      blastCount,
      hitCount,
      armCount,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
