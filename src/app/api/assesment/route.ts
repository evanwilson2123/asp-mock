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

    /* 
      Expected payload structure:
      {
        title: string,               // Assessment title
        athleteId: string,
        templateId: string,
        sections: [
          {
            title: string,
            responses: {
              // Each key here MUST be the ephemeral field ID (clientId)
              // For example: "clientId-of-Number1": "5", "clientId-of-Number2": "10"
            }
          },
          ...
        ]
      }
    */
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

    // (Optional) If you need to transform the responses to ensure keys are strings,
    // you can do so here. For example:
    // const transformedSections = sections.map((section: any) => ({
    //   title: section.title,
    //   responses: Object.entries(section.responses).reduce((acc, [key, value]) => {
    //     // Ensure key is a string (it should be the field's clientId)
    //     acc[String(key)] = value;
    //     return acc;
    //   }, {}),
    // }));
    // Then use transformedSections in the assessment creation.

    const assessment = new Assessment({
      title,
      athleteId,
      templateId,
      sections, // Ensure these responses are keyed by each field's clientId
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
