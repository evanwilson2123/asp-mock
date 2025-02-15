import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Athlete ID is missing' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    if (!athlete.hitTrax) {
      athlete.hitTrax = [];
    }

    const sessionId = randomUUID(); // Generate unique session ID
    const rows: any[] = [];

    // Parse the CSV file
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing file field' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    console.log('Starting CSV Parsing...');

    const parseStream = fileStream.pipe(
      csvParser({
        mapHeaders: ({ header }) => header.trim(), // Normalize header names
      })
    );

    for await (const row of parseStream) {
      console.log('Raw Row:', row); // Log the raw row for debugging

      if (!row['Date'] || !row['Time Stamp']) {
        console.log('Skipping invalid row:', row);
        continue;
      }

      // Parse the CSV date (e.g., "1/6/2025 17:45:43.941")
      let parsedDate: Date;
      try {
        parsedDate = new Date(row['Date'].trim());
        if (isNaN(parsedDate.getTime())) {
          console.log('Skipping row due to invalid Date:', row);
          continue;
        }
      } catch (error) {
        console.error(error);
        console.log('Skipping row due to error parsing Date:', row);
        continue;
      }

      const parsedRow = {
        sessionId,
        athlete: athleteId,
        // Convert the parsed date to an ISO string for storage
        date: parsedDate.toISOString(),
        playLevel: athlete.level,
        AB: row['AB'] ? parseInt(row['AB'], 10) || null : null,
        timestamp: row['Time Stamp']?.trim() || null,
        pitch: row['Pitch'] ? parseFloat(row['Pitch']) || null : null,
        strikeZone: row['Strike Zone']?.trim() || null,
        pType: row['P. Type']?.trim() || null,
        velo: row['Velo'] ? parseFloat(row['Velo']) || null : null,
        LA: row['LA'] ? parseFloat(row['LA']) || null : null,
        dist: row['Dist'] ? parseFloat(row['Dist']) || null : null,
        res: row['Res']?.trim() || null,
        type: row['Type']?.trim() || null,
        horizAngle: row['Horiz. Angle']
          ? parseFloat(row['Horiz. Angle']) || null
          : null,
        pts: row['Pts'] ? parseFloat(row['Pts']) || null : null,
        strikeZoneBottom: row['Strike Zone Bottom']
          ? parseFloat(row['Strike Zone Bottom']) || null
          : null,
        strikeZoneTop: row['Strike Zone Top']
          ? parseFloat(row['Strike Zone Top']) || null
          : null,
        strikeZoneWidth: row['Strike Zone Width']
          ? parseFloat(row['Strike Zone Width']) || null
          : null,
        verticalDistance: row['Vertical Distance']
          ? parseFloat(row['Vertical Distance']) || null
          : null,
        horizontalDistance: row['Horizontal Distance']
          ? parseFloat(row['Horizontal Distance']) || null
          : null,
        POIX: row['POI X'] ? parseFloat(row['POI X']) || null : null,
        POIY: row['POI Y'] ? parseFloat(row['POI Y']) || null : null,
        POIZ: row['POI Z'] ? parseFloat(row['POI Z']) || null : null,
        sprayChartX: row['Spray Chart X']
          ? parseFloat(row['Spray Chart X']) || null
          : null,
        sprayChartZ: row['Spray Chart Z']
          ? parseFloat(row['Spray Chart Z']) || null
          : null,
        fieldedX: row['Fielded X']
          ? parseFloat(row['Fielded X']) || null
          : null,
        fieldedZ: row['Fielded Z']
          ? parseFloat(row['Fielded Z']) || null
          : null,
        batMaterial: row['Bat Material']?.trim() || null,
        user: row['User']?.trim() || null,
        pitchAngle: row['Pitch Angle']
          ? parseFloat(row['Pitch Angle']) || null
          : null,
        batting: row['Batting']?.trim() || null,
        level: row['Level']?.trim() || null,
        opposingPlayer: row['Opposing Player']?.trim() || null,
        tag: row['Tag']?.trim() || null,
      };

      console.log('Parsed Row:', parsedRow); // Log each parsed row
      rows.push(parsedRow);
    }

    console.log('Finished Parsing. Total Rows Parsed:', rows.length);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    console.log('Inserting data into database...');
    await prisma.hitTrax.createMany({
      data: rows,
    });

    athlete.hitTrax.push(sessionId);
    await athlete.save();

    console.log('Data insertion successful.');
    return NextResponse.json({
      message: 'HitTrax session uploaded successfully',
      sessionId,
    });
  } catch (error: any) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload data', details: error.message },
      { status: 500 }
    );
  }
}
