import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId from req params');
    return NextResponse.json(
      { error: 'Missing request parameter' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    const { weight } = await req.json();

    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      console.log('Athlete not found with ID');
      return NextResponse.json(
        { error: 'Athlete not found by ID' },
        { status: 404 }
      );
    }
    athlete.weight = weight;
    await athlete.save();

    await prisma.weightLog.create({
      data: {
        athlete: athleteId,
        weight: weight,
        date: new Date(),
      },
    });

    return NextResponse.json({ weight: athlete.weight }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
