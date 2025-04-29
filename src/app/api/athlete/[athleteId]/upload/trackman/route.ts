import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import crypto from 'crypto';
import Goal from '@/models/goal';
import AthleteTag from '@/models/athleteTag';

const CALCULATE_STUFF_PLUS_URL =
  process.env.CALCULATE_STUFF_PLUS_URL ||
  'https://asp-py-9gjt.onrender.com/calculate-stuff';

export async function POST(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
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
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete Not Found' }, { status: 404 });
    }
    if (!athlete.trackman) {
      athlete.trackman = [];
    }

    const sessionId = crypto.randomUUID();
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: "'file' is invalid or missing" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    const trackmanRows: any[] = [];
    const parseStream = fileStream.pipe(
      csvParser({
        headers: [
          'pitch_release_speed_imp',
          'Pitch Type',
          'Pitcher Name',
          'Release Height (ft)',
          'Release Side (ft)',
          'Extension (ft)',
          'Tilt',
          'Measured Tilt',
          'Gyro (°)',
          'Spin Efficiency (%)',
          'Induced Vertical Break (in)',
          'Horizontal Break (in)',
          'Vertical Approach Angle (°)',
          'Horizontal Approach Angle (°)',
          'Location Height (ft)',
          'Location Side (ft)',
          'Zone Location',
          'session_id',
          'Spin rate (rpm)',
        ],
        skipLines: 0,
      })
    );

    for await (const row of parseStream) {
      const pitchReleaseSpeed = parseFloat(row['pitch_release_speed_imp']) || 0;
      if (pitchReleaseSpeed === 0) continue;

      // Use your original parsing logic for other fields.
      const spinRateRaw = row['Spin rate (rpm)'];
      const spinRate = spinRateRaw
        ? parseFloat(spinRateRaw.replace(/,/g, '').trim()) || null
        : null;

      trackmanRows.push({
        sessionId,
        athleteId,
        playLevel: athlete.level,
        pitchReleaseSpeed,
        pitchType: row['Pitch Type']?.trim() || null,
        pitcherName: row['Pitcher Name']?.trim() || null,
        releaseHeight: parseFloat(row['Release Height (ft)']) || null,
        releaseSide: parseFloat(row['Release Side (ft)']) || null,
        extension: parseFloat(row['Extension (ft)']) || null,
        tilt: row['Tilt']?.trim() || null,
        measuredTilt: row['Measured Tilt']?.trim() || null,
        gyro: parseFloat(row['Gyro (°)']) || null,
        spinEfficiency: parseFloat(row['Spin Efficiency (%)']) || null,
        inducedVerticalBreak:
          parseFloat(row['Induced Vertical Break (in)']) || null,
        horizontalBreak: parseFloat(row['Horizontal Break (in)']) || null,
        verticalApproachAngle:
          parseFloat(row['Vertical Approach Angle (°)']) || null,
        horizontalApproachAngle:
          parseFloat(row['Horizontal Approach Angle (°)']) || null,
        locationHeight: parseFloat(row['Location Height (ft)']) || null,
        locationSide: parseFloat(row['Location Side (ft)']) || null,
        zoneLocation: row['Zone Location']?.trim() || null,
        spinRate,
      });
    }

    if (trackmanRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    // ----- START: Goal Updating Logic -----
    console.log('Fetching Trackman goals...');
    const goals = await Goal.find({
      athlete: athleteId,
      tech: 'Trackman',
    });

    if (goals.length !== 0) {
      console.log('Updating goals based on new Trackman data...');
      // Define a mapping from metric names (as used in goals) to the corresponding key in trackmanRows
      const metricMapping: { [key: string]: string } = {
        'Pitch Release Speed': 'pitchReleaseSpeed',
        'Spin Efficiency': 'spinEfficiency',
        'Induced Vertical Break': 'inducedVerticalBreak',
        'Horizontal Break': 'horizontalBreak',
        'Spin Rate': 'spinRate',
      };

      for (const goal of goals) {
        const key = metricMapping[goal.metricToTrack];
        if (!key) {
          console.log(
            `No matching field found for metric: ${goal.metricToTrack}`
          );
          continue;
        }

        // Extract the relevant values from the CSV data for this metric.
        const relevantData = trackmanRows
          .map((record) => record[key])
          .filter(
            (value): value is number =>
              typeof value === 'number' && !isNaN(value)
          );

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
          complete: updatedValue >= goal.goalValue ? true : false,
        });

        console.log(
          `Updated goal: ${goal.goalName} - New Value: ${updatedValue}`
        );
      }

      console.log('Goal updates complete.');
    }

    // For each pitch, call the calculate-stuff+ endpoint and attach the result.
    for (const pitch of trackmanRows) {
      const payload = {
        Pitch_Type: pitch.pitchType,
        RelSpeed: pitch.pitchReleaseSpeed,
        SpinRate: pitch.spinRate,
        RelHeight: pitch.releaseHeight,
        ABS_RelSide:
          pitch.releaseSide !== null ? Math.abs(pitch.releaseSide) : null,
        Extension: pitch.extension,
        ABS_Horizontal:
          pitch.horizontalBreak !== null
            ? Math.abs(pitch.horizontalBreak)
            : null,
        InducedVertBreak: pitch.inducedVerticalBreak,
      };
      if (
        payload.ABS_Horizontal !== null &&
        payload.InducedVertBreak !== null
      ) {
        (payload as any).differential_break = Math.abs(
          payload.InducedVertBreak - payload.ABS_Horizontal
        );
      }
      try {
        console.log(`\n\nPAYLOAD: ${JSON.stringify(payload)}\n\n`);
        const res = await fetch(CALCULATE_STUFF_PLUS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        pitch.stuffPlus = result.stuff_plus;
      } catch (error) {
        console.error('Error calculating Stuff+ for pitch:', error);
        pitch.stuffPlus = null;
      }
    }

    // Save the enriched trackman rows to the database.
    const savedData = await prisma.trackman.createMany({
      data: trackmanRows,
    });

    const tags = await AthleteTag.find({
      tech: 'trackman',
      automatic: true,
    });

    if (tags.length !== 0) {
      for (const tag of tags) {
        const avgMetric = await prisma.trackman.aggregate({
          _avg: {
            [tag.metric]: true,
          },
          where: {
            athleteId: athleteId,
          },
        });
        if (tag.lessThan) {
          if (tag.lessThan > avgMetric._avg[tag.metric]) {
            athlete.trackTags.push(tag._id);
          }
        } else if (tag.greaterThan) {
          if (tag.greaterThan < avgMetric._avg[tag.metric]) {
            athlete.trackTags.push(tag._id);
          }
        } else if (tag.min && tag.max) {
          if (
            tag.min < avgMetric._avg[tag.metric] &&
            avgMetric._avg[tag.metric] < tag.max
          ) {
            athlete.trackTags.push(tag._id);
          }
        }
      }
    }

    athlete.trackman.push(sessionId);
    await athlete.save();

    return NextResponse.json({
      message: 'Trackman data uploaded successfully',
      savedRecords: savedData.count,
    });
  } catch (error: any) {
    console.error('Error uploading Trackman data:', error);
    return NextResponse.json(
      { error: 'Failed to upload data', details: error.message },
      { status: 500 }
    );
  }
}
