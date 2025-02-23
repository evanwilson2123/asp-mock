import { connectDB } from '@/lib/db';
import prisma from '@/lib/prismaDb';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const sessionid = await context.params.sessionId;
  if (!sessionid) {
    return NextResponse.json(
      { error: 'Missing session ID param' },
      { status: 400 }
    );
  }
  try {
    const { sessionName, techName } = await req.json();
    console.log(techName);
    switch (techName) {
      case 'blast':
        await prisma.blastMotion.updateMany({
          data: {
            sessionName: sessionName,
          },
          where: {
            sessionId: sessionid,
          },
        });
        break;
      case 'trackman':
        await prisma.trackman.updateMany({
          data: {
            sessionName: sessionName,
          },
          where: {
            sessionId: sessionid,
          },
        });
        break;
      case 'hittrax':
        await prisma.hitTrax.updateMany({
          data: {
            sessionName: sessionName,
          },
          where: {
            sessionId: sessionid,
          },
        });
        break;
      case 'intended':
        await prisma.intended.updateMany({
          data: {
            sessionName: sessionName,
          },
          where: {
            sessionId: sessionid,
          },
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid Technology Name' },
          { status: 400 }
        );
    }
    return NextResponse.json(
      { message: 'session name updated' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  console.log(userId);
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const sessionId = await context.params.sessionId;
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionID param' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const data = await req.json();
    const techName = data.techName;
    const athleteId = data.athleteId;
    if (!techName || !athleteId) {
      console.log(`Athlete ID ${athleteId}`);
      return NextResponse.json(
        { error: 'Missing tech name or athlete ID' },
        { status: 400 }
      );
    }
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json(
        { error: "Couldn't find athlete" },
        { status: 404 }
      );
    }
    switch (techName) {
      case 'blast':
        await prisma.blastMotion.deleteMany({
          where: {
            sessionId: sessionId,
          },
        });
        athlete.blastMotion = athlete.blastMotion.filter(
          (s: string) => s !== sessionId
        );
        await athlete.save();
        break;
      case 'hittrax':
        await prisma.hitTrax.deleteMany({
          where: {
            sessionId: sessionId,
          },
        });
        athlete.hitTrax = athlete.hitTrax.filter(
          (s: string) => s !== sessionId
        );
        await athlete.save();
        break;
      case 'trackman':
        await prisma.trackman.deleteMany({
          where: {
            sessionId: sessionId,
          },
        });
        athlete.trackman = athlete.trackman.filter(
          (s: string) => s !== sessionId
        );
        await athlete.save();
        break;
      case 'intended':
        await prisma.intended.deleteMany({
          where: {
            sessionId: sessionId,
          },
        });
        athlete.intended = athlete.intended.filter(
          (s: string) => s !== sessionId
        );
        await athlete.save();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid tech name' },
          { status: 400 }
        );
    }
    return NextResponse.json(
      { message: 'Session successfully deleted' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
