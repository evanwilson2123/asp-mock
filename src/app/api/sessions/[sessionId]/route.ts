import prisma from '@/lib/prismaDb';
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
