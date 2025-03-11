import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import Goal from '@/models/goal';

interface HittraxBlast {
  athlete: string;
  blastId: string;
  hittraxId: string;
  blastSessionId: string;
  hittraxSessionId: string;
  squaredUpRate: number;
  attackAngle: number;
  launchAngle: number;
  exitVelo: number;
  result: string;
  potentialVelo: number;
  planeEfficiency: number;
  vertBatAngle: number;
  date: Date;
}

interface SquaredUpResult {
  squaredUpRate: number;
  potentialVelo: number;
}

/**
 * Helper function to calculate the squared up rate for the swing
 */
function calculateSquaredUpRate(
  pitchVelo: number,
  batSpeed: number,
  exitVelo: number
): SquaredUpResult | void {
  if (pitchVelo === 0 || batSpeed === 0 || exitVelo === 0) {
    return;
  }
  const potentialVelo = 1.23 * batSpeed + 0.23 * (0.92 * pitchVelo);
  const squaredUpRate = (exitVelo / potentialVelo) * 100;
  return {
    squaredUpRate: squaredUpRate,
    potentialVelo: potentialVelo,
  };
}

async function checkForComparisons(
  csvData: any[],
  athleteId: string
): Promise<void> {
  try {
    let minDate: Date = csvData[0].date;
    let maxDate: Date = csvData[0].date;
    for (const data of csvData) {
      if (minDate > data.date) {
        minDate = data.date;
      }
      if (maxDate < data.date) {
        maxDate = data.date;
      }
    }
    console.log(`Min Date: ${minDate}`);
    console.log(`Max Date: ${maxDate}`);

    const oneDay = 24 * 60 * 60 * 1000;
    const adjustedMinDate = new Date(minDate.getTime() - oneDay);
    const adjustedMaxDate = new Date(maxDate.getTime() + oneDay);

    const blastSwings = await prisma.blastMotion.findMany({
      where: {
        athlete: athleteId,
        date: {
          gte: adjustedMinDate,
          lte: adjustedMaxDate,
        },
      },
    });
    if (blastSwings.length === 0) {
      console.log('No blast swings found in range');
      return;
    }
    console.log(blastSwings);
    // Look for a match
    for (const blastSwing of blastSwings) {
      for (const hitSwing of csvData) {
        if (
          Math.abs(blastSwing.date.getTime() - hitSwing.date.getTime()) < 2000
        ) {
          console.log(
            `Found match!\nBlastSwing: ${JSON.stringify(blastSwing)}\nHittraxSwing: ${JSON.stringify(hitSwing)}`
          );
          const squaredUpResult: SquaredUpResult | void =
            calculateSquaredUpRate(
              hitSwing.pitch || 0,
              blastSwing.batSpeed || 0,
              hitSwing.velo
            );
          if (!squaredUpResult) {
            console.log('Squared up rate not calculated');
            break;
          }
          const hittraxBlast: HittraxBlast = {
            athlete: athleteId,
            blastId: blastSwing.swingId,
            hittraxId: blastSwing.swingId,
            blastSessionId: blastSwing.sessionId,
            hittraxSessionId: hitSwing.sessionId,
            squaredUpRate: squaredUpResult.squaredUpRate,
            attackAngle: blastSwing.attackAngle || 0,
            launchAngle: hitSwing.LA || 0,
            exitVelo: hitSwing.velo || 0,
            result: hitSwing.res || '',
            potentialVelo: squaredUpResult.potentialVelo,
            planeEfficiency: blastSwing.planeScore || 0,
            vertBatAngle: blastSwing.verticalBatAngle || 0,
            date: hitSwing.date,
          };
          const record = await prisma.hittraxBlast.findFirst({
            where: {
              OR: [
                { blastId: blastSwing.swingId },
                { hittraxId: hitSwing.swingId },
              ],
            },
          });
          if (record) {
            console.log('Comparison already exists');
            break;
          }
          await prisma.hittraxBlast.create({
            data: hittraxBlast,
          });
          console.log('Comparison created!');
        }
      }
    }
  } catch (error: any) {
    console.error(error);
    return;
  }
}

/**
 * Helper function to parse a date/time string (e.g., "1/6/2025 09:00:00.000")
 * and treat it as a UTC time rather than local time.
 */
function parseCsvDateAsUtc(dateTimeStr: string): Date {
  // Split the string into date and time parts
  const [datePart, timePart] = dateTimeStr.split(' ');
  if (!datePart || !timePart) {
    throw new Error('Invalid date/time format: ' + dateTimeStr);
  }

  // Expected datePart format: "M/D/YYYY"
  const [month, day, year] = datePart.split('/').map(Number);

  // Expected timePart format: "HH:mm:ss.mmm"
  const [hour, minute, secMilli] = timePart.split(':');
  let second = 0;
  let millisecond = 0;
  if (secMilli.includes('.')) {
    const [sec, ms] = secMilli.split('.');
    second = Number(sec);
    millisecond = Number(ms);
  } else {
    second = Number(secMilli);
  }

  // Use Date.UTC to interpret the provided components as UTC time.
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      Number(hour),
      Number(minute),
      second,
      millisecond
    )
  );
}

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
      // console.log('Raw Row:', row); // Log the raw row for debugging

      if (!row['Date'] || !row['Time Stamp']) {
        console.log('Skipping invalid row:', row);
        continue;
      }

      // Use our helper function to parse the CSV date as local time
      let parsedDate: Date;
      try {
        parsedDate = parseCsvDateAsUtc(row['Date'].trim());
        if (isNaN(parsedDate.getTime())) {
          console.log('Skipping row due to invalid Date:', row);
          continue;
        }
      } catch (error) {
        console.error(error);
        console.log('Skipping row due to error parsing Date:', row);
        continue;
      }

      console.log('Parsed Date:', parsedDate);

      const swingId = randomUUID();

      const parsedRow = {
        sessionId,
        athlete: athleteId,
        // Save the parsed date (interpreted as local time)
        date: parsedDate,
        swingId: swingId,
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

      // console.log('Parsed Row:', parsedRow); // Log each parsed row
      rows.push(parsedRow);
    }

    console.log('Finished Parsing. Total Rows Parsed:', rows.length);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    await checkForComparisons(rows, athleteId);

    console.log('Fetching Hittrax Goals...');
    const goals = await Goal.find({
      athlete: athleteId,
      tech: 'Hittrax',
    });

    if (goals.length !== 0) {
      console.log('Updating goals based on new HitTrax data...');

      // Define the mapping between metric names and object keys
      const metricMapping: { [key: string]: string } = {
        'Exit Velocity': 'velo',
        'Launch Angle': 'LA',
        Distance: 'dist',
      };

      for (const goal of goals) {
        const key = metricMapping[goal.metricToTrack];

        if (!key) {
          console.log(
            `No matching field found for metric: ${goal.metricToTrack}`
          );
          continue;
        }

        // Extract relevant values from CSV data for this metric
        const relevantData = rows
          .map((record) => record[key])
          .filter((value) => typeof value === 'number' && !isNaN(value));

        if (relevantData.length === 0) {
          console.log(`No valid data found for metric: ${goal.metricToTrack}`);
          continue;
        }

        let updatedValue: number;
        let sum = goal.sum || 0;
        let length = goal.length || 0;

        if (goal.avgMax === 'avg') {
          sum += relevantData.reduce((acc, val) => acc + val, 0);
          length += relevantData.length;
          updatedValue = sum / length;
        } else {
          updatedValue = Math.max(goal.currentValue || 0, ...relevantData);
        }

        await Goal.findByIdAndUpdate(goal._id, {
          currentValue: updatedValue,
          sum: goal.avgMax === 'avg' ? sum : 0,
          length: goal.avgMax === 'avg' ? length : 0,
        });

        console.log(
          `Updated goal: ${goal.goalName} - New Value: ${updatedValue}`
        );
      }

      console.log('Goal updates complete.');
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
