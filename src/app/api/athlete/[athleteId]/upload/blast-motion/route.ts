import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto'; // For generating the unique session ID
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';

/**
 * POST /api/athlete/:athleteId/blastmotion/upload
 *
 * **Blast Motion CSV Upload API**
 *
 * This endpoint allows authenticated users to upload a Blast Motion CSV file
 * containing athlete swing data. The uploaded data is parsed, validated, and
 * stored in the database, with all records linked to the specified athlete
 * and a unique session ID for tracking.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** Only authenticated users can upload data.
 * - Returns **400 Auth Failed** if the user is not authenticated.
 *
 * ---
 *
 * @pathParam {string} athleteId - The ID of the athlete whose Blast Motion data is being uploaded.
 *
 * ---
 *
 * @requestBody {FormData}
 * - The request must include a `file` field containing the CSV file.
 *
 * Example:
 * ```http
 * POST /api/athlete/1234/blastmotion/upload
 * Content-Type: multipart/form-data
 *
 * file: blastmotion_data.csv
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "message": "Blast Motion session uploaded successfully",
 *     "sessionId": "unique-session-id"
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - Missing athlete ID: `{ "error": "Athlete ID is missing" }`
 *   - Authentication failed: `{ "error": "Auth Failed" }`
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
 * fetch('/api/athlete/1234/blastmotion/upload', {
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
 * - Rows without required fields or with invalid data are skipped.
 * - Logs parsing progress and errors to the console for debugging.
 */
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

    const csvData: any[] = [];
    const sessionId = randomUUID(); // Generate a unique session ID
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileStream = Readable.from(buffer);
    const parseStream = fileStream.pipe(csvParser());

    console.log('Starting CSV Parsing...');

    for await (const row of parseStream) {
      // Skip rows that are headers, invalid, or where "Handedness" is null
      if (!row['_1'] || row['_1'] === 'Equipment' || !row['_2']) {
        console.log('Skipping invalid or header row:', row);
        continue;
      }

      csvData.push({
        sessionId, // Associate each row with the same session ID
        athlete: athleteId,
        date: new Date(), // Replace with a valid column if the date is in the CSV
        playLevel: athlete.level,
        equipment: row['_1']?.trim() || null,
        handedness: row['_2']?.trim() || null,
        swingDetails: row['_3']?.trim() || null,
        planeScore: parseFloat(row['_4']) || null,
        connectionScore: parseFloat(row['_5']) || null,
        rotationScore: parseFloat(row['_6']) || null,
        batSpeed: parseFloat(row['_7']) || null,
        rotationalAcceleration: parseFloat(row['_8']) || null,
        onPlaneEfficiency: parseFloat(row['_9']) || null,
        attackAngle: parseFloat(row['_10']) || null,
        earlyConnection: parseFloat(row['_11']) || null,
        connectionAtImpact: parseFloat(row['_12']) || null,
        verticalBatAngle: parseFloat(row['_13']) || null,
        power: parseFloat(row['_14']) || null,
        timeToContact: parseFloat(row['_15']) || null,
        peakHandSpeed: parseFloat(row['_16']) || null,
      });
    }

    console.log('Finished CSV Parsing. Total Rows Parsed:', csvData.length);

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in the uploaded file' },
        { status: 400 }
      );
    }

    console.log('Inserting data into database...');
    await prisma.blastMotion.createMany({
      data: csvData,
    });

    console.log('Data insertion successful.');

    athlete.blastMotion.push(sessionId);

    await athlete.save();

    return NextResponse.json({
      message: 'Blast Motion session uploaded successfully',
      sessionId, // Return the session ID for reference
    });
  } catch (error: any) {
    console.error('Error uploading data:', error);
    return NextResponse.json(
      { error: 'Failed to upload data', details: error.message },
      { status: 500 }
    );
  }
}
