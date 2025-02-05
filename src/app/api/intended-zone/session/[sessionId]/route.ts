import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauth');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }
  try {
    const { sessionId } = context.params;
    if (!sessionId) {
      console.log('No session ID');
      return NextResponse.json(
        { error: 'Missing session Id' },
        { status: 400 }
      );
    }
    const pitches = await prisma.intended.findMany({
      where: { sessionId },
    });
    if (!pitches) {
      return NextResponse.json({ error: 'No pitches found' }, { status: 404 });
    }
    return NextResponse.json({ intendedData: pitches }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' });
  }
}
