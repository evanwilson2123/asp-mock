import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismaDb';
import { put } from '@vercel/blob';

interface FormData {
  firstName: string;
  lastName: string;
  height: string;
  weight: number;
  age: number;
  primarySport: string;
  currentTrainingReg: string;
  goals: string;
  primaryPosition: string;
  hopeToGain: string;
  injuryHistory: string;
  coachingStyle: string;
  daysTraining: number;
  priorSC: boolean;

  // Mobility Assessment
  overHeadSquat: number;
  trunkStability: number;
  sidePlank: number;
  spinalFlexion: number;
  activeLegRaise: number;
  goodMorning: number;
  lungeOverhead: number;
  lateralTrunkTilt: number;

  // Hitting Mechanics Breakdown
  weighShift: number;
  torsoRot: number;
  pelvisLoad: number;
  forwardMove: number;
  hipShoulder: number;
  upperRot: number;
  lowerRot: number;
  frontArm: number;
  shoulderConn: number;
  barrelExt: number;
  batShoulderAng: number;
}

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }

  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Missing athleteId from Request' },
      { status: 400 }
    );
  }

  try {
    const formData: FormData = await req.json();
    if (!formData) {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    const { firstName, lastName, ...assesmentData } = formData;
    console.log(firstName + ' ' + lastName);

    // Step 1: Fetch PDF from FastAPI
    const res = await fetch('https://asp-py.vercel.app/gen-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      console.log('Error generating PDF');
      return NextResponse.json(
        { error: 'Error generating PDF' },
        { status: 500 }
      );
    }

    // Step 2: Convert Response to Blob
    const pdfBuffer = await res.arrayBuffer();

    // Step 3: Upload the PDF to Vercel Blob Storage
    const blob = await put(
      `athlete-reports/${athleteId}.pdf`,
      Buffer.from(pdfBuffer),
      {
        contentType: 'application/pdf',
        access: 'public', // 👈 This fixes the error
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    const url = blob.url;

    // Save data to Prisma DB
    await prisma.assessment.create({
      data: {
        athleteId,
        blobUrl: url,
        ...assesmentData,
      },
    });

    // Step 4: Return the Blob URL
    return NextResponse.json(
      { message: 'Assessment Created', pdfUrl: blob.url },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error creating assessment: ${error}`);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  const athleteId = await context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  try {
    const assesments = await prisma.assessment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        athleteId: athleteId,
      },
      select: {
        id: true,
        blobUrl: true,
        createdAt: true,
      },
    });
    if (!assesments) {
      return NextResponse.json(
        { error: 'No assesments found' },
        { status: 404 }
      );
    }
    console.log('Assesments:', assesments);
    return NextResponse.json(assesments, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
