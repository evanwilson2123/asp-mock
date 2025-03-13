// /app/api/templates/route.ts (or adjust the folder structure as needed)
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

    // Parse the request body
    const { name, fields } = await req.json();

    // Validate the request payload (you can add more robust validation here)
    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Create a new template instance
    const newTemplate = new AssesmentTemplate({
      name,
      fields,
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

    const templates = await AssesmentTemplate.find().exec();
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
