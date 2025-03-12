// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prismaDb';
// import csvParser from 'csv-parser';
// import { Readable } from 'stream';
// import { auth } from '@clerk/nextjs/server';
// import { connectDB } from '@/lib/db';
// import Athlete from '@/models/athlete';
// import crypto from 'crypto';
// import Goal from '@/models/goal';

// /**
//  * POST /api/athlete/:athleteId/trackman/upload
//  *
//  * **Trackman CSV Upload API**
//  *
//  * This endpoint allows authenticated users to upload a Trackman CSV file
//  * containing pitching performance data for a specific athlete.
//  * The data is parsed, validated, and stored in the database under
//  * the athlete’s record, grouped by a unique session ID.
//  *
//  * ---
//  *
//  * @auth
//  * - **Authentication Required:** Only authenticated users can upload data.
//  * - Returns **400 Auth Failed** if the user is not authenticated.
//  *
//  * ---
//  *
//  * @pathParam {string} athleteId - The ID of the athlete whose Trackman data is being uploaded.
//  *
//  * ---
//  *
//  * @requestBody {FormData}
//  * - The request must include a `file` field containing the CSV file.
//  *
//  * Example:
//  * ```http
//  * POST /api/athlete/1234/trackman/upload
//  * Content-Type: multipart/form-data
//  *
//  * file: trackman_data.csv
//  * ```
//  *
//  * ---
//  *
//  * @returns {Promise<NextResponse>} JSON response:
//  *
//  * - **Success (200):**
//  *   ```json
//  *   {
//  *     "message": "Trackman data uploaded successfully",
//  *     "savedRecords": 25
//  *   }
//  *   ```
//  *
//  * - **Error (400):**
//  *   - Missing athlete ID: `{ "error": "Athlete ID is missing" }`
//  *   - Authentication failed: `{ "error": "Auth Failed" }`
//  *   - Invalid or missing file: `{ "error": "'file' is invalid or missing" }`
//  *
//  * - **Error (404):**
//  *   - Athlete not found: `{ "error": "Athlete Not Found" }`
//  *
//  * - **Error (500):**
//  *   - Server error during file parsing or database operations:
//  *   ```json
//  *   {
//  *     "error": "Failed to upload data",
//  *     "details": "Detailed error message"
//  *   }
//  *   ```
//  *
//  * ---
//  *
//  * @example
//  * // Example request using fetch:
//  * const formData = new FormData();
//  * formData.append('file', fileInput.files[0]);
//  *
//  * fetch('/api/athlete/1234/trackman/upload', {
//  *   method: 'POST',
//  *   body: formData
//  * })
//  *   .then(response => response.json())
//  *   .then(data => console.log(data))
//  *   .catch(error => console.error('Upload failed:', error));
//  *
//  * ---
//  *
//  * @notes
//  * - The uploaded CSV must contain headers such as `Pitch Type`, `Spin rate (rpm)`, `Pitcher Name`, etc.
//  * - Each record is linked to the athlete and a unique `sessionId` generated for the upload session.
//  * - Invalid rows with missing or incorrect `pitch_release_speed_imp` values are skipped.
//  * - The endpoint logs parsing progress and errors for debugging purposes.
//  */
// export async function POST(req: NextRequest, context: any) {
//   const { userId } = await auth();
//   if (!userId) {
//     return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
//   }

//   const athleteId = context.params.athleteId;

//   if (!athleteId) {
//     return NextResponse.json(
//       { error: 'Athlete ID is missing' },
//       { status: 400 }
//     );
//   }

//   try {
//     await connectDB();
//     const athlete = await Athlete.findById(athleteId);

//     if (!athlete) {
//       return NextResponse.json({ error: 'Athlete Not Found' }, { status: 404 });
//     }
//     if (!athlete.trackman) {
//       athlete.trackman = [];
//     }

//     const sessionId = crypto.randomUUID();
//     const formData = await req.formData();
//     const file = formData.get('file');

//     if (!file || typeof file === 'string') {
//       return NextResponse.json(
//         { error: "'file' is invalid or missing" },
//         { status: 400 }
//       );
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const fileStream = Readable.from(buffer);

//     const trackmanRows = [];
//     const parseStream = fileStream.pipe(
//       csvParser({
//         headers: [
//           'pitch_release_speed_imp',
//           'Pitch Type',
//           'Pitcher Name',
//           'Release Height (ft)',
//           'Release Side (ft)',
//           'Extension (ft)',
//           'Tilt',
//           'Measured Tilt',
//           'Gyro (°)',
//           'Spin Efficiency (%)',
//           'Induced Vertical Break (in)',
//           'Horizontal Break (in)',
//           'Vertical Approach Angle (°)',
//           'Horizontal Approach Angle (°)',
//           'Location Height (ft)',
//           'Location Side (ft)',
//           'Zone Location',
//           'session_id',
//           'Spin rate (rpm)',
//         ],
//         skipLines: 0,
//       })
//     );

//     for await (const row of parseStream) {
//       const pitchReleaseSpeed = parseFloat(row['pitch_release_speed_imp']) || 0;

//       // Skip rows with invalid pitchReleaseSpeed
//       if (pitchReleaseSpeed === 0) {
//         continue;
//       }

//       // Parse spinRate and log for debugging
//       const spinRateRaw = row['Spin rate (rpm)'];
//       const spinRate = spinRateRaw
//         ? parseFloat(spinRateRaw.replace(/,/g, '').trim()) || null
//         : null;

//       console.log('Row data:', row); // Log the full row for debugging
//       console.log('Parsed Spin Rate:', spinRate); // Log parsed spin rate

//       trackmanRows.push({
//         sessionId,
//         athleteId,
//         playLevel: athlete.level,
//         pitchReleaseSpeed,
//         pitchType: row['Pitch Type']?.trim() || null,
//         pitcherName: row['Pitcher Name']?.trim() || null,
//         releaseHeight: parseFloat(row['Release Height (ft)']) || null,
//         releaseSide: parseFloat(row['Release Side (ft)']) || null,
//         extension: parseFloat(row['Extension (ft)']) || null,
//         tilt: row['Tilt']?.trim() || null,
//         measuredTilt: row['Measured Tilt']?.trim() || null,
//         gyro: parseFloat(row['Gyro (°)']) || null,
//         spinEfficiency: parseFloat(row['Spin Efficiency (%)']) || null,
//         inducedVerticalBreak:
//           parseFloat(row['Induced Vertical Break (in)']) || null,
//         horizontalBreak: parseFloat(row['Horizontal Break (in)']) || null,
//         verticalApproachAngle:
//           parseFloat(row['Vertical Approach Angle (°)']) || null,
//         horizontalApproachAngle:
//           parseFloat(row['Horizontal Approach Angle (°)']) || null,
//         locationHeight: parseFloat(row['Location Height (ft)']) || null,
//         locationSide: parseFloat(row['Location Side (ft)']) || null,
//         zoneLocation: row['Zone Location']?.trim() || null,
//         spinRate,
//       });
//     }

//     if (trackmanRows.length === 0) {
//       return NextResponse.json(
//         { error: 'No valid data found in the uploaded file' },
//         { status: 400 }
//       );
//     }

//     console.log('Fetching Trackman goals...');
//     const goals = await Goal.find({
//       athlete: athleteId,
//       tech: 'Trackman',
//     });

//     if (goals.length !== 0) {
//       console.log('Updating goals based on new Trackman data...');

//       // Define the mapping between metric names and object keys
//       const metricMapping: { [key: string]: string } = {
//         'Pitch Release Speed': 'pitchReleaseSpeed',
//         'Spin Efficiency': 'spinEfficiency',
//         'Induced Vertical Break': 'inducedVerticalBreak',
//         'Horizontal Break': 'horizontalBreak',
//         'Spin Rate': 'spinRate',
//       };

//       for (const goal of goals) {
//         const key = metricMapping[
//           goal.metricToTrack
//         ] as keyof (typeof trackmanRows)[0];

//         if (!key) {
//           console.log(
//             `No matching field found for metric: ${goal.metricToTrack}`
//           );
//           continue;
//         }

//         // Extract relevant values from CSV data for this metric
//         const relevantData = trackmanRows
//           .map((record) => record[key])
//           .filter(
//             (value): value is number =>
//               typeof value === 'number' && !isNaN(value)
//           );

//         if (relevantData.length === 0) {
//           console.log(`No valid data found for metric: ${goal.metricToTrack}`);
//           continue;
//         }

//         let updatedValue: number;
//         let sum = goal.sum || 0;
//         let length = goal.length || 0;

//         if (goal.avgMax === 'avg') {
//           sum += relevantData.reduce((acc, val) => acc + val, 0);
//           length += relevantData.length;
//           updatedValue = sum / length;
//         } else {
//           updatedValue = Math.max(goal.currentValue || 0, ...relevantData);
//         }

//         await Goal.findByIdAndUpdate(goal._id, {
//           currentValue: updatedValue,
//           sum: goal.avgMax === 'avg' ? sum : 0,
//           length: goal.avgMax === 'avg' ? length : 0,
//         });

//         console.log(
//           `Updated goal: ${goal.goalName} - New Value: ${updatedValue}`
//         );
//       }

//       console.log('Goal updates complete.');
//     }

//     console.log('Inserting data into database...');

//     // Save rows to Prisma
//     const savedData = await prisma.trackman.createMany({
//       data: trackmanRows,
//     });

//     athlete.trackman.push(sessionId);
//     await athlete.save();

//     return NextResponse.json({
//       message: 'Trackman data uploaded successfully',
//       savedRecords: savedData.count,
//     });
//   } catch (error: any) {
//     console.error('Error uploading Trackman data:', error);
//     return NextResponse.json(
//       { error: 'Failed to upload data', details: error.message },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import crypto from 'crypto';
import Goal from '@/models/goal';

const CALCULATE_STUFF_PLUS_URL =
  process.env.CALCULATE_STUFF_PLUS_URL ||
  'http://localhost:3000/api/calculate-stuff';

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
