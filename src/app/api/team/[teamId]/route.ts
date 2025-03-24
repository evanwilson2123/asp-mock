import { connectDB } from '@/lib/db';
import Team from '@/models/team';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const teamId = await context.params.teamId;
  if (!teamId) {
    console.log('Missing parameter');
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
  }
  try {
    await connectDB();

    await Team.findByIdAndDelete(teamId).exec();

    // if (team._id !== teamId) {
    //   await team.save();
    //   console.log('ID ERROR VERY BAD NOOOO');
    //   return NextResponse.json({ error: 'ID error' }, { status: 400 });
    // }

    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
