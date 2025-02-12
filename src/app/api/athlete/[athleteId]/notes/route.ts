import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { ICoachNote } from '@/models/coachesNote';

export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('No auth');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athlete id');
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  try {
    await connectDB();
    const { note } = await req.json();
    if (!note) {
      console.log('Misisng note');
      return NextResponse.json(
        { error: 'Missing Coaches Note' },
        { status: 400 }
      );
    }
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    athlete.coachesNotes.push(note);
    await athlete.save();

    console.log('Note saved successfully');

    return NextResponse.json({ message: 'Note saved!' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    console.log('Missing athleteId');
    return NextResponse.json({ error: 'Missing athlete ID' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');

  try {
    await connectDB();
    if (!noteId) {
      console.log('No note ID');
      return NextResponse.json({ error: 'Missing noteId' }, { status: 400 });
    }
    console.log(`Note ID: ${noteId}`);
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    console.log('\n\n', athlete.coachesNotes);
    athlete.coachesNotes = athlete.coachesNotes.filter(
      (note: ICoachNote) => note._id?.toString() !== noteId
    );
    console.log(`After filter: ${athlete.coachesNote}`);
    await athlete.save();
    console.log('Deleted Note Successfully');
    return NextResponse.json(
      { message: 'Deleted Successfullt' },
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
