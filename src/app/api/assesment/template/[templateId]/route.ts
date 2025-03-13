import { connectDB } from '@/lib/db';
import AssesmentTemplate from '@/models/assesmentTemplate';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const templateId = await context.params.templateId;
  if (!templateId) {
    console.log('Missing templateId');
    return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
  }
  try {
    await connectDB();

    const template = await AssesmentTemplate.findById(templateId);
    if (!template) {
      console.log('No template found');
      return NextResponse.json({ error: 'No template found' }, { status: 404 });
    }
    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
