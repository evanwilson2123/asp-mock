import { NextRequest, NextResponse } from 'next/server';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';

/**
 * parseDate: If invalid or blank, returns null.
 */
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d;
}

/**
 * parseNum: If invalid or blank, returns null.
 */
function parseNum(value: string | undefined): number | null {
  if (!value) return null;
  const n = parseFloat(value.trim());
  return isNaN(n) ? null : n;
}

/**
 * parseStr: If blank or missing, returns null.
 */
function parseStr(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/**
 * POST /api/athlete/:athleteId/armcare/upload
 *
 * **ArmCare CSV Upload API**
 *
 * This endpoint allows authenticated users to upload an ArmCare CSV file
 * containing athlete performance data. The uploaded data is parsed and
 * saved into the database, with each record linked to the specified athlete.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** Only authenticated users can upload data.
 * - Returns **400 Auth Failed** if the user is not authenticated.
 *
 * ---
 *
 * @pathParam {string} athleteId - The ID of the athlete whose ArmCare data is being uploaded.
 *
 * ---
 *
 * @requestBody {FormData}
 * - The request must include a `file` field containing the CSV file.
 *
 * Example:
 * ```http
 * POST /api/athlete/1234/armcare/upload
 * Content-Type: multipart/form-data
 *
 * file: armcare_data.csv
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "message": "ArmCare CSV uploaded successfully.",
 *     "sessionId": "unique-session-id"
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - Missing athlete ID: `{ "error": "Athlete ID missing" }`
 *   - Authentication failed: `{ "error": "Auth Failed" }`
 *   - No file provided: `{ "error": "No 'file' field found" }`
 *
 * - **Error (404):**
 *   - Athlete not found: `{ "error": "Athlete not found for ID" }`
 *
 * - **Error (500):**
 *   - Server error during file parsing or database operations:
 *   ```json
 *   {
 *     "error": "Failed to upload ArmCare data",
 *     "details": "Detailed error message"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 *
 * fetch('/api/athlete/1234/armcare/upload', {
 *   method: 'POST',
 *   body: formData
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Upload failed:', error));
 *
 * ---
 *
 * @notes
 * - The uploaded CSV must have specific headers matching database fields.
 * - The system assigns a unique `sessionId` for each upload session.
 * - Each record in the CSV is parsed and stored individually.
 * - Handles various data types, including dates, numbers, and strings.
 * - Ignores unrecognized CSV headers during parsing.
 */

export async function POST(req: NextRequest, context: any) {
  // Auth & Athlete check
  const { userId } = await auth();
  const athleteId = context.params.athleteId;

  if (!athleteId) {
    return NextResponse.json({ error: 'Athlete ID missing' }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  try {
    // Connect to DB (Mongo) & find athlete
    await connectDB();
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found for ID' },
        { status: 404 }
      );
    }

    // Ensure `armcare` is an array
    if (!athlete.armcare) {
      athlete.armcare = [];
    }

    // Generate a unique session ID
    const sessionId = randomUUID();

    // 1) Pull the CSV File from form data
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json(
        { error: "No 'file' field found" },
        { status: 400 }
      );
    }
    if (typeof file === 'string') {
      return NextResponse.json(
        { error: "'file' is string, not a File" },
        { status: 400 }
      );
    }

    // 2) Convert file to stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    // 3) Set up csv-parser with mapHeaders to match CSV column names -> DB fields
    const parseStream = fileStream.pipe(
      csvParser({
        mapHeaders: ({ header }) => {
          switch (header.trim()) {
            case 'Athlete ID':
              return 'athlete';

            case 'Exam Date':
              return 'examDate';
            case 'Email':
              return 'email';
            case 'ArmCare ID':
              return 'armCareId';
            case 'Last Name':
              return 'lastName';
            case 'First Name':
              return 'firstName';
            case 'Gender':
              return 'gender';
            case 'DOB':
              return 'dob';
            case 'Height (ft)':
              return 'heightFt';
            case 'Height (in)':
              return 'heightIn';
            case 'Weight (lbs)':
              return 'weightLbs';
            case 'Country':
              return 'country';
            case 'State/Prov':
              return 'stateProv';
            case 'Position 1':
              return 'position1';
            case 'Position 2':
              return 'position2';
            case 'Position 3':
              return 'position3';
            case 'Position 4':
              return 'position4';
            case 'Position 5':
              return 'position5';
            case 'Playing Level':
              return 'playingLevel';
            case 'Throws':
              return 'throws';
            case 'Bats':
              return 'bats';
            case 'Surgery':
              return 'surgery';
            case 'Time':
              return 'time';
            case 'Timezone':
              return 'timezone';
            case 'Exam Type':
              return 'examType';

            case 'Arm Score':
              return 'armScore';
            case 'Total Strength':
              return 'totalStrength';
            case 'IRTARM Strength':
              return 'irtarmStrength';
            case 'IRTARM RS':
              return 'irtarmRs';
            case 'IRTARM Recovery':
              return 'irtarmRecovery';
            case 'ERTARM Strength':
              return 'ertarmStrength';
            case 'ERTARM RS':
              return 'ertarmRs';
            case 'ERTARM Recovery':
              return 'ertarmRecovery';
            case 'STARM Strength':
              return 'starmStrength';
            case 'STARM RS':
              return 'starmRs';
            case 'STARM Recovery':
              return 'starmRecovery';
            case 'GTARM Strength':
              return 'gtarmStrength';
            case 'GTARM RS':
              return 'gtarmRs';
            case 'GTARM Recovery':
              return 'gtarmRecovery';
            case 'Shoulder Balance':
              return 'shoulderBalance';
            case 'Velo':
              return 'velo';
            case 'SVR':
              return 'svr';

            // ROM fields
            case 'IRTARM ROM':
              return 'irtarmRom';
            case 'IRNTARM ROM':
              return 'irntarmRom';
            case 'ERTARM ROM':
              return 'ertarmRom';
            case 'ERNTARM ROM':
              return 'erntarmRom';
            case 'TARM TARC':
              return 'tarmTarc';
            case 'NTARM TARC':
              return 'ntarmTarc';
            case 'FTARM ROM':
              return 'ftarmRom';
            case 'FNTARM ROM':
              return 'fntarmRom';

            // Force-lbs columns (example for IRTARM)
            case 'IRTARM Peak Force-Lbs 1':
              return 'irtarmPeakForceLbs1';
            case 'IRTARM Peak Force-Lbs 2':
              return 'irtarmPeakForceLbs2';
            case 'IRTARM Peak Force-Lbs 3':
              return 'irtarmPeakForceLbs3';
            case 'IRTARM Max-Lbs':
              return 'irtarmMaxLbs';

            // (Add other columns as needed)

            default:
              return null; // Ignore unrecognized headers
          }
        },
      })
    );

    // 4) Loop over each parsed row and save to Prisma
    for await (const row of parseStream) {
      await prisma.armCare.create({
        data: {
          sessionId,
          athlete: athleteId,

          examDate: parseDate(row['examDate']),
          playLevel: athlete.level, // from your Mongoose Athlete doc
          email: parseStr(row['email']),
          armCareId: parseStr(row['armCareId']),
          lastName: parseStr(row['lastName']),
          firstName: parseStr(row['firstName']),
          gender: parseStr(row['gender']),
          dob: parseDate(row['dob']),
          heightFt: parseNum(row['heightFt']),
          heightIn: parseNum(row['heightIn']),
          weightLbs: parseNum(row['weightLbs']),
          country: parseStr(row['country']),
          stateProv: parseStr(row['stateProv']),
          position1: parseStr(row['position1']),
          position2: parseStr(row['position2']),
          position3: parseStr(row['position3']),
          position4: parseStr(row['position4']),
          position5: parseStr(row['position5']),
          playingLevel: parseStr(row['playingLevel']),
          throws: parseStr(row['throws']),
          bats: parseStr(row['bats']),
          surgery: parseStr(row['surgery']),
          time: parseStr(row['time']),
          timezone: parseStr(row['timezone']),
          examType: parseStr(row['examType']),

          armScore: parseNum(row['armScore']),
          totalStrength: parseNum(row['totalStrength']),

          // Strength
          irtarmStrength: parseNum(row['irtarmStrength']),
          irtarmRs: parseNum(row['irtarmRs']),
          irtarmRecovery: parseStr(row['irtarmRecovery']),
          ertarmStrength: parseNum(row['ertarmStrength']),
          ertarmRs: parseNum(row['ertarmRs']),
          ertarmRecovery: parseStr(row['ertarmRecovery']),
          starmStrength: parseNum(row['starmStrength']),
          starmRs: parseNum(row['starmRs']),
          starmRecovery: parseStr(row['starmRecovery']),
          gtarmStrength: parseNum(row['gtarmStrength']),
          gtarmRs: parseNum(row['gtarmRs']),
          gtarmRecovery: parseStr(row['gtarmRecovery']),

          shoulderBalance: parseNum(row['shoulderBalance']),
          velo: parseNum(row['velo']),
          svr: parseNum(row['svr']),

          // ROM
          irtarmRom: parseNum(row['irtarmRom']),
          irntarmRom: parseNum(row['irntarmRom']),
          ertarmRom: parseNum(row['ertarmRom']),
          erntarmRom: parseNum(row['erntarmRom']),
          tarmTarc: parseNum(row['tarmTarc']),
          ntarmTarc: parseNum(row['ntarmTarc']),
          ftarmRom: parseNum(row['ftarmRom']),
          fntarmRom: parseNum(row['fntarmRom']),

          // Example: IRTARM peak force
          irtarmPeakForceLbs1: parseNum(row['irtarmPeakForceLbs1']),
          irtarmPeakForceLbs2: parseNum(row['irtarmPeakForceLbs2']),
          irtarmPeakForceLbs3: parseNum(row['irtarmPeakForceLbs3']),
          irtarmMaxLbs: parseNum(row['irtarmMaxLbs']),

          // Add other "Peak Force" or "Max Force" fields similarly
        },
      });
    }

    // Store the sessionId in the Mongoose athlete doc
    athlete.armcare.push(sessionId);
    await athlete.save();

    return NextResponse.json({
      message: 'ArmCare CSV uploaded successfully.',
      sessionId,
    });
  } catch (err: any) {
    console.error('ArmCare CSV upload error:', err);
    return NextResponse.json(
      { error: 'Failed to upload ArmCare data', details: err.message },
      { status: 500 }
    );
  }
}
