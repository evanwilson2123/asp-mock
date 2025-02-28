import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { randomUUID } from 'crypto';

const CSV_HEADERS = [
  'Date',
  'Equipment',
  'Handedness',
  'Swing Details',
  'Plane Score',
  'Connection Score',
  'Rotation Score',
  'Bat Speed (mph)',
  'Rotational Acceleration (g)',
  'On Plane Efficiency (%)',
  'Attack Angle (deg)',
  'Early Connection (deg)',
  'Connection at Impact (deg)',
  'Vertical Bat Angle (deg)',
  'Power (kW)',
  'Time to Contact (sec)',
  'Peak Hand Speed (mph)',
  'Exit Velocity (mph)',
  'Launch Angle (deg)',
  'Estimated Distance (feet)',
];

interface HittraxBlast {
  athlete: string;
  blastId: string;
  hittraxId: string;
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

/**
 * Helper function for checking if there are matching swings between blast and hittrax data.
 * If a match is found, create a new hittraxBlast entry in the database with associated swingIds
 * @param csvData
 * @param athleteId
 * @returns
 */
async function checkForComparisons(
  csvData: any[],
  athleteId: string
): Promise<void> {
  try {
    // Initialize min and max dates to establish a date range for uploaded CSV (this helps minimize hittrax query weight)
    let minDate: Date = new Date(csvData[0].date);
    let maxDate: Date = new Date(csvData[0].date);

    // Loop through and update min and max
    for (const data of csvData) {
      const currentDate = new Date(data.date);
      if (currentDate < minDate) {
        minDate = currentDate;
      }
      if (currentDate > maxDate) {
        maxDate = currentDate;
      }
    }

    console.log('Min date:', minDate);
    console.log('Max date:', maxDate);
    const oneDay = 24 * 60 * 60 * 1000;
    const adjustedMinDate = new Date(minDate.getTime() - oneDay);
    const adjustedMaxDate = new Date(maxDate.getTime() + oneDay);

    // Find hittrax swings within established time range
    const hittraxSwings = await prisma.hitTrax.findMany({
      where: {
        athlete: athleteId,
        date: {
          gte: adjustedMinDate,
          lte: adjustedMaxDate,
        },
      },
    });
    if (hittraxSwings.length === 0) {
      console.log('No overlapping timestamps');
      return;
    }
    console.log('Looking for matches!');
    // serach for a match
    for (const hitSwing of hittraxSwings) {
      for (const blastSwing of csvData) {
        if (!hitSwing.date) {
          break;
        }
        if (
          Math.abs(blastSwing.date.getTime() - hitSwing.date.getTime()) < 2000
        ) {
          console.log(
            `Found match!\nHittrax Swing: ${JSON.stringify(hitSwing)}\nBlast Swing: ${JSON.stringify(blastSwing)}`
          );

          const squaredUpResult: SquaredUpResult | void =
            calculateSquaredUpRate(
              hitSwing.pitch || 0,
              blastSwing.batSpeed,
              hitSwing.velo || 0
            );
          if (!squaredUpResult) {
            break;
          }
          const hittraxBlast: HittraxBlast = {
            athlete: athleteId,
            blastId: blastSwing.swingId,
            hittraxId: hitSwing.swingId,
            blastSessionId: blastSwing.sessionId,
            hittraxSessionId: hitSwing.sessionId,
            squaredUpRate: squaredUpResult.squaredUpRate,
            attackAngle: blastSwing.attackAngle,
            launchAngle: hitSwing.LA || 0,
            exitVelo: hitSwing.velo || 0,
            result: hitSwing.res || '',
            potentialVelo: squaredUpResult.potentialVelo,
            planeEfficiency: blastSwing.planeScore || 0,
            vertBatAngle: blastSwing.verticalBatAngle,
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
          console.log('HIttrax Blast comparison created.');
        }
      }
    }
  } catch (error: any) {
    console.error(error);
    return;
  }
}

/**
 * Helper function to parse a date/time string (e.g., "Dec 10, 2024 02:11:43 pm")
 * and treat it as a UTC time.
 */
function parseCsvDateAsUtc(dateTimeStr: string): Date {
  // Expected format: "Dec 10, 2024 02:11:43 pm"
  const regex =
    /^([A-Za-z]{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (am|pm)$/i;
  const match = dateTimeStr.trim().match(regex);
  if (!match) {
    throw new Error('Invalid date/time format: ' + dateTimeStr);
  }
  const [_, monthStr, dayStr, yearStr, hourStr, minuteStr, secondStr, ampm] =
    match;
  console.log(_);

  const monthMap: { [key: string]: number } = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  const month = monthMap[monthStr];
  if (!month) {
    throw new Error('Invalid month in date: ' + dateTimeStr);
  }

  const day = Number(dayStr);
  const year = Number(yearStr);
  let hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = Number(secondStr);

  // Convert 12-hour format to 24-hour format.
  if (ampm.toLowerCase() === 'pm' && hour < 12) {
    hour += 12;
  }
  if (ampm.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }

  // Create the date as UTC.
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
}

export async function POST(req: NextRequest, context: any) {
  const athleteId = context.params.athleteId;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }
  if (!athleteId) {
    return NextResponse.json(
      { error: 'Athlete ID is missing' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    if (!athlete.blastMotion) {
      athlete.blastMotion = [];
    }

    // We'll build a map of new session IDs (keyed by normalized date)
    const sessionMap: { [normalizedDate: string]: string } = {};
    const csvData: any[] = [];

    // Read the entire file as text.
    const arrayBuffer = await req.arrayBuffer();
    const fileText = Buffer.from(arrayBuffer).toString('utf-8');

    // Skip the first 8 lines (metadata) and rejoin the remainder.
    const csvContent = fileText.split('\n').slice(8).join('\n');
    const fileStream = Readable.from(csvContent);

    // Configure csv-parser with explicit headers and disable strict header matching.
    const parseStream = fileStream.pipe(
      csvParser({ headers: CSV_HEADERS, skipLines: 0, strict: false })
    );

    console.log('Starting CSV Parsing...');
    for await (const row of parseStream) {
      // If the row is empty, skip it.
      if (!row || Object.keys(row).length === 0) {
        continue;
      }
      // Validate required fields.
      if (!row['Equipment'] || !row['Handedness']) {
        console.log(
          'Skipping row due to missing Equipment or Handedness:',
          row
        );
        continue;
      }

      // Ensure a valid Date value exists.
      const dateStr = row['Date'] ? row['Date'].trim() : '';
      console.log(`\n\nDate String: ${dateStr}\n\n`);
      if (!dateStr) {
        console.log('Skipping row due to missing Date:', row);
        continue;
      }
      let normalizedDate: string;
      try {
        normalizedDate = new Date(dateStr).toISOString().slice(0, 10);
      } catch (error) {
        console.error(error);
        console.log('Skipping row due to invalid Date format:', row);
        continue;
      }

      // Build the candidate session ID for this date.
      const candidateSessionId = `${normalizedDate}_${athlete._id.toString()}`;
      // If this session already exists, skip all rows with this date.
      if (athlete.blastMotion.includes(candidateSessionId)) {
        console.log(
          `Skipping row because session for date ${normalizedDate} already exists:`,
          row
        );
        continue;
      }

      // If we haven't seen this new date during this upload, save it.
      if (!sessionMap[normalizedDate]) {
        sessionMap[normalizedDate] = candidateSessionId;
        console.log(
          `Generated new session id ${candidateSessionId} for date ${normalizedDate}`
        );
      }
      const sessionId = sessionMap[normalizedDate];

      const swingId = randomUUID();

      csvData.push({
        sessionId,
        athlete: athleteId,
        // Store the actual date from the CSV as an ISO string.
        date: parseCsvDateAsUtc(dateStr),
        swingId: swingId,
        playLevel: athlete.level,
        equipment: row['Equipment']?.trim() || null,
        handedness: row['Handedness']?.trim() || null,
        swingDetails: row['Swing Details']?.trim() || null,
        planeScore: parseFloat(row['Plane Score']) || null,
        connectionScore: parseFloat(row['Connection Score']) || null,
        rotationScore: parseFloat(row['Rotation Score']) || null,
        batSpeed: parseFloat(row['Bat Speed (mph)']) || null,
        rotationalAcceleration:
          parseFloat(row['Rotational Acceleration (g)']) || null,
        onPlaneEfficiency: parseFloat(row['On Plane Efficiency (%)']) || null,
        attackAngle: parseFloat(row['Attack Angle (deg)']) || null,
        earlyConnection: parseFloat(row['Early Connection (deg)']) || null,
        connectionAtImpact:
          parseFloat(row['Connection at Impact (deg)']) || null,
        verticalBatAngle: parseFloat(row['Vertical Bat Angle (deg)']) || null,
        power: parseFloat(row['Power (kW)']) || null,
        timeToContact: parseFloat(row['Time to Contact (sec)']) || null,
        peakHandSpeed: parseFloat(row['Peak Hand Speed (mph)']) || null,
      });
    }

    console.log('Finished CSV Parsing. Total Rows Parsed:', csvData.length);
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    await checkForComparisons(csvData, athleteId);

    console.log('Inserting data into database...');
    await prisma.blastMotion.createMany({ data: csvData });
    console.log('Data insertion successful.');

    // Add the new session IDs to the athlete record.
    Object.values(sessionMap).forEach((sid) => {
      if (!athlete.blastMotion.includes(sid)) {
        athlete.blastMotion.push(sid);
      }
    });
    await athlete.save();

    return NextResponse.json({
      message: 'Blast Motion session(s) uploaded successfully',
      sessionIds: Object.values(sessionMap),
    });
  } catch (error: any) {
    console.error('Error uploading data:', error);
    return NextResponse.json(
      { error: 'Failed to upload data', details: error.message },
      { status: 500 }
    );
  }
}
