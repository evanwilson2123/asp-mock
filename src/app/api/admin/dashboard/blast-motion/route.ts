import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

/**
 * GET /api/blast-motion
 *
 * This API endpoint retrieves BlastMotion data filtered by the specified play level (e.g., "High School", "College", "Pro").
 * It calculates the maximum bat speed, maximum hand speed, and session averages for the provided level.
 *
 * @param {NextRequest} req - The incoming request object. The query parameter `level` can be provided (defaults to "High School").
 *
 * @queryParam {string} [level="High School"] - The play level to filter the data (e.g., "High School", "College").
 *
 * @returns {Promise<NextResponse>} JSON response containing either:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "maxBatSpeed": number,
 *     "maxHandSpeed": number,
 *     "sessionAverages": [
 *       {
 *         "sessionId": string,
 *         "date": string,
 *         "avgBatSpeed": number,
 *         "avgHandSpeed": number
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (404):**
 *   ```json
 *   { "error": "No BlastMotion data found for this level" }
 *   ```
 *
 * - **Error (500):**
 *   ```json
 *   { "error": "Failed to fetch BlastMotion data" }
 *   ```
 *
 * @example
 * // Fetching data for College level
 * GET /api/blast-motion?level=College
 *
 * @errorHandling
 * - Returns 404 if no data is found for the specified level.
 * - Returns 500 for internal server errors.
 */
export async function GET(req: NextRequest): Promise<
  | NextResponse<{ error: string }>
  | NextResponse<{
      maxBatSpeed: number;
      maxHandSpeed: number;
      sessionAverages: {
        sessionId: string;
        date: string;
        avgBatSpeed: number;
        avgHandSpeed: number;
      }[];
    }>
> {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School'; // Default to "High School"

  try {
    const data = await prisma.blastMotion.findMany({
      where: { playLevel: level },
      orderBy: { date: 'desc' }, // Sort by date
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No BlastMotion data found for this level' },
        { status: 404 }
      );
    }

    // Group by session and calculate averages
    const sessions: Record<
      string,
      { batSpeeds: number[]; handSpeeds: number[]; date: string }
    > = {};

    data.forEach((record) => {
      const sessionId = record.sessionId;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          batSpeeds: [],
          handSpeeds: [],
          date: record.date.toISOString().split('T')[0],
        };
      }
      if (record.batSpeed) sessions[sessionId].batSpeeds.push(record.batSpeed);
      if (record.peakHandSpeed)
        sessions[sessionId].handSpeeds.push(record.peakHandSpeed);
    });

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const session = sessions[sessionId];
      return {
        sessionId,
        date: session.date,
        avgBatSpeed:
          session.batSpeeds.length > 0
            ? session.batSpeeds.reduce((a, b) => a + b, 0) /
              session.batSpeeds.length
            : 0,
        avgHandSpeed:
          session.handSpeeds.length > 0
            ? session.handSpeeds.reduce((a, b) => a + b, 0) /
              session.handSpeeds.length
            : 0,
      };
    });

    const maxBatSpeed = Math.max(...data.map((record) => record.batSpeed || 0));
    const maxHandSpeed = Math.max(
      ...data.map((record) => record.peakHandSpeed || 0)
    );

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      sessionAverages,
    });
  } catch (error: any) {
    console.error('Error fetching BlastMotion data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BlastMotion data' },
      { status: 500 }
    );
  }
}
