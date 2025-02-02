import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/armcare/:athleteId
 *
 * This API endpoint retrieves **ArmCare data** for a specific athlete. It provides:
 * - **Body weight** from the latest record
 * - **Global max strength and ROM (Range of Motion)** values
 * - **Latest strength and ROM** measurements
 * - **Session averages** for arm scores
 * - **Session metadata** for charting and navigation
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** This endpoint requires the user to be authenticated via Clerk.
 * - Returns **400 AUTH FAILED** if authentication is unsuccessful.
 *
 * ---
 *
 * @pathParam {string} athleteId - The unique ID of the athlete whose ArmCare data is being requested.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the latest body weight, global max metrics, latest metrics, and session data.
 *   ```json
 *   {
 *     "bodyWeight": 180,
 *     "maxInternal": 95,
 *     "maxExternal": 88,
 *     "maxScaption": 90,
 *     "internalRom": 80,
 *     "externalRom": 75,
 *     "maxShoulderFlexion": 150,
 *     "latestInternal": 93,
 *     "latestExternal": 87,
 *     "latestScaption": 89,
 *     "latestInternalRom": 78,
 *     "latestExternalRom": 74,
 *     "latestShoulderFlexion": 148,
 *     "sessionAverages": [
 *       {
 *         "sessionId": "sess_123",
 *         "date": "2024-05-01",
 *         "armScore": 85
 *       },
 *       {
 *         "sessionId": "sess_124",
 *         "date": "2024-06-01",
 *         "armScore": 90
 *       }
 *     ],
 *     "sessions": [
 *       { "sessionId": "sess_123", "date": "2024-05-01" },
 *       { "sessionId": "sess_124", "date": "2024-06-01" }
 *     ]
 *   }
 *   ```
 *
 * - **Error (400):**
 *   Occurs when authentication fails or the athlete ID is missing.
 *   ```json
 *   { "error": "AUTH FAILED" }
 *   ```
 *   OR
 *   ```json
 *   { "error": "Missing athleteId" }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when no ArmCare data is found for the specified athlete.
 *   ```json
 *   { "error": "No arm care data found for this athlete" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during data fetching.
 *   ```json
 *   { "error": "Failed to fetch ArmCare data", "details": "Internal server error details" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch ArmCare data for an athlete
 * GET /api/armcare/athlete_12345
 *
 * @errorHandling
 * - Returns **400** if authentication fails or `athleteId` is missing.
 * - Returns **404** if no ArmCare data exists for the athlete.
 * - Returns **500** for internal server/database errors.
 */

export async function GET(req: NextRequest, context: any) {
  // 1) Validate auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'AUTH FAILED' }, { status: 400 });
  }

  // 2) athleteId from params
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }

  try {
    // 3) Get ArmCare records
    const records = await prisma.armCare.findMany({
      where: { athlete: athleteId },
      orderBy: { examDate: 'desc' },
    });
    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No arm care data found for this athlete' },
        { status: 404 }
      );
    }

    // The newest (latest) record
    const latestRecord = records[0];

    // 4) We'll use the latest record's weightLbs as the bodyWeight
    const bodyWeight = latestRecord.weightLbs ?? 0;

    // 5) Prepare to compute session averages
    const sessionsMap: Record<
      string,
      {
        sessionId: string;
        date: string;
        armScores: number[];
      }
    > = {};

    // Arrays to track global max
    const allIrStrength: number[] = [];
    const allErStrength: number[] = [];
    const allScapStrength: number[] = [];
    const allIrRom: number[] = [];
    const allErRom: number[] = [];
    const allShoulderFlexion: number[] = [];

    for (const record of records) {
      const { sessionId } = record;
      const dateString = record.examDate
        ? record.examDate.toISOString().split('T')[0]
        : 'N/A';

      // Group by session
      if (!sessionsMap[sessionId]) {
        sessionsMap[sessionId] = {
          sessionId,
          date: dateString,
          armScores: [],
        };
      }
      if (record.armScore != null) {
        sessionsMap[sessionId].armScores.push(record.armScore);
      }

      // Strength
      if (record.irtarmStrength != null) {
        allIrStrength.push(record.irtarmStrength);
      }
      if (record.ertarmStrength != null) {
        allErStrength.push(record.ertarmStrength);
      }
      if (record.starmStrength != null) {
        allScapStrength.push(record.starmStrength);
      }

      // ROM
      if (record.irtarmRom != null) {
        allIrRom.push(record.irtarmRom);
      }
      if (record.ertarmRom != null) {
        allErRom.push(record.ertarmRom);
      }
      if (record.ftarmRom != null) {
        allShoulderFlexion.push(record.ftarmRom);
      }
    }

    // 6) Session Averages
    const sessionAverages = Object.values(sessionsMap).map((session) => {
      const { sessionId, date, armScores } = session;
      const avgArmScore =
        armScores.reduce((acc, v) => acc + v, 0) / (armScores.length || 1);

      return { sessionId, date, armScore: avgArmScore };
    });

    // 7) Global max
    const maxInternal = allIrStrength.length ? Math.max(...allIrStrength) : 0;
    const maxExternal = allErStrength.length ? Math.max(...allErStrength) : 0;
    const maxScaption = allScapStrength.length
      ? Math.max(...allScapStrength)
      : 0;

    const internalRom = allIrRom.length ? Math.max(...allIrRom) : 0;
    const externalRom = allErRom.length ? Math.max(...allErRom) : 0;
    const maxShoulderFlexion = allShoulderFlexion.length
      ? Math.max(...allShoulderFlexion)
      : 0;

    // 8) Latest
    const latestInternal = latestRecord.irtarmStrength ?? 0;
    const latestExternal = latestRecord.ertarmStrength ?? 0;
    const latestScaption = latestRecord.starmStrength ?? 0;

    const latestInternalRom = latestRecord.irtarmRom ?? 0;
    const latestExternalRom = latestRecord.ertarmRom ?? 0;
    const latestShoulderFlexion = latestRecord.ftarmRom ?? 0;

    // Return everything
    return NextResponse.json({
      // Body weight from the latest record
      bodyWeight,

      // Global max
      maxInternal,
      maxExternal,
      maxScaption,
      internalRom,
      externalRom,
      maxShoulderFlexion,

      // Latest
      latestInternal,
      latestExternal,
      latestScaption,
      latestInternalRom,
      latestExternalRom,
      latestShoulderFlexion,

      // Chart data
      sessionAverages,
      sessions: sessionAverages.map(({ sessionId, date }) => ({
        sessionId,
        date,
      })),
    });
  } catch (error: any) {
    console.error('[ArmCare GET]: Error fetching ArmCare data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ArmCare data', details: error.message },
      { status: 500 }
    );
  }
}
