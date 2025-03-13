import { connectDB } from '@/lib/db';
import Assessment from '@/models/assesment';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthorized Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    // Expecting a payload with athleteId, templateId, and sections.
    // Each section should look something like:
    // { title: "Section Title", responses: { fieldId1: "Answer", fieldId2: true } }
    const { title, athleteId, templateId, sections } = await req.json();

    if (!athleteId) {
      console.log('Missing athleteId');
      return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
    }
    if (!templateId) {
      console.log('Missing templateId');
      return NextResponse.json(
        { error: 'Missing templateId' },
        { status: 400 }
      );
    }
    if (!sections || !Array.isArray(sections)) {
      console.log('Missing or invalid sections');
      return NextResponse.json(
        { error: 'Missing or invalid sections' },
        { status: 400 }
      );
    }

    // Create a new assessment using the organized sections payload.
    const assessment = new Assessment({
      title: title,
      athleteId,
      templateId,
      sections,
    });

    await assessment.save();

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
