import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import AssesmentTemplate from '@/models/assesmentTemplate';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthorized Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    // Parse the request body and include graphs configuration
    const { name, desc, sections, graphs } = await req.json();

    // Validate the request payload
    if (!name || !sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (graphs && !Array.isArray(graphs)) {
      return NextResponse.json(
        { error: 'Invalid graphs payload' },
        { status: 400 }
      );
    }

    // Create a new template instance including the graphs configuration (no conversion needed)
    const newTemplate = new AssesmentTemplate({
      name,
      desc,
      sections,
      graphs, // This is now an array of objects with string fieldIds
    });

    // Save the new template to the database
    await newTemplate.save();

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const templates = await AssesmentTemplate.find({ available: true }).exec();
    console.log(templates);
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
