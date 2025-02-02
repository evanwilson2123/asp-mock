import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';

/**
 * POST /api/athlete/:athleteId/hittrax/upload
 *
 * **HitTrax CSV Upload API**
 *
 * This endpoint allows authenticated users to upload a HitTrax CSV file
 * containing detailed hitting performance data for a specific athlete.
 * The CSV is parsed, validated, and the data is stored in the database
 * under the athlete’s record, grouped by a unique session ID.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** Only authenticated users can upload data.
 * - Returns **400 Auth Failed** if the user is not authenticated.
 *
 * ---
 *
 * @pathParam {string} athleteId - The ID of the athlete whose HitTrax data is being uploaded.
 *
 * ---
 *
 * @requestBody {FormData}
 * - The request must include a `file` field containing the CSV file.
 *
 * Example:
 * ```http
 * POST /api/athlete/1234/hittrax/upload
 * Content-Type: multipart/form-data
 *
 * file: hittrax_data.csv
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "message": "HitTrax session uploaded successfully",
 *     "sessionId": "unique-session-id"
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - Missing athlete ID: `{ "error": "Athlete ID is missing" }`
 *   - Authentication failed: `{ "error": "Auth Failed" }`
 *   - Invalid or missing file: `{ "error": "Invalid or missing file field" }`
 *   - No valid data: `{ "error": "No valid data found in the uploaded file" }`
 *
 * - **Error (404):**
 *   - Athlete not found: `{ "error": "Athlete not found" }`
 *
 * - **Error (500):**
 *   - Server error during file parsing or database operations:
 *   ```json
 *   {
 *     "error": "Failed to upload data",
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
 * fetch('/api/athlete/1234/hittrax/upload', {
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
 * - The uploaded CSV must have headers matching database fields (e.g., `Date`, `Velo`, `Pitch`, etc.).
 * - Each record is linked to the athlete and a unique `sessionId` generated for the upload session.
 * - The endpoint logs parsing progress and errors for debugging purposes.
 * - Invalid or incomplete rows are skipped during processing.
 */
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

      const parsedRow = {
        sessionId,
        athlete: athleteId,
        AB: row['AB'] ? parseInt(row['AB'], 10) || null : null,
        date: row['Date']?.trim() || null,
        playLevel: athlete.level,
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

    // Insert rows into the database
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
