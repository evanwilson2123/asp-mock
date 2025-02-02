import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
/**
 * GET /api/trackman
 *
 * This API endpoint retrieves Trackman data filtered by the specified play level (e.g., "High School", "College").
 * It calculates the **peak speed** for each pitch type and provides a list of **average pitch speeds** along with their corresponding dates.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request containing the query parameter `level` (optional).
 *
 * @queryParam {string} [level="High School"] - The play level to filter the data (e.g., "High School", "College").
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the peak pitch speed for each pitch type and average pitch speeds per record with timestamps.
 *   ```json
 *   {
 *     "pitchStats": [
 *       { "pitchType": "Fastball", "peakSpeed": 95 },
 *       { "pitchType": "Slider", "peakSpeed": 88 }
 *     ],
 *     "avgPitchSpeeds": [
 *       {
 *         "pitchType": "Fastball",
 *         "avgSpeed": 92,
 *         "date": "2024-05-01T12:34:56.789Z"
 *       },
 *       {
 *         "pitchType": "Slider",
 *         "avgSpeed": 85,
 *         "date": "2024-05-02T14:12:34.567Z"
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when no data is found for the specified level.
 *   ```json
 *   { "error": "No Trackman data found for level: High School" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during data fetching.
 *   ```json
 *   { "error": "Failed to fetch Trackman data." }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch data for College level
 * GET /api/trackman?level=College
 *
 * @errorHandling
 * - Returns **404** if no Trackman data exists for the specified level.
 * - Returns **500** for any internal server/database issues.
 */

export async function GET(req: NextRequest) {
  // 1) Parse the query param (?level=)
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || 'High School';

  try {
    // 2) Fetch all Trackman rows matching that level
    //    sorted from newest to oldest
    const data = await prisma.trackman.findMany({
      where: { playLevel: level },
      orderBy: { createdAt: 'desc' },
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No Trackman data found for level: ${level}` },
        { status: 404 }
      );
    }

    // 3) Build pitchStats (peak speed by pitchType)
    //    Example: "Fastball" -> highest pitchReleaseSpeed
    const pitchStats: Record<string, number> = {};

    // 4) We'll store each record as its own data point
    //    with pitchType, avgSpeed, date (from createdAt)
    //    (Though it won't be a real "average" if each row is a single pitch;
    //    if you want to group by day or session, see the grouping example.)
    const allDataPoints: {
      pitchType: string;
      avgSpeed: number;
      date: string; // we'll store ISO string
    }[] = [];

    // 5) Iterate each row
    data.forEach((record) => {
      const pitchType = record.pitchType || 'Unknown';
      const pitchSpeed = record.pitchReleaseSpeed || 0;

      // Calculate peak speed
      if (pitchStats[pitchType] == null) {
        pitchStats[pitchType] = pitchSpeed;
      } else {
        pitchStats[pitchType] = Math.max(pitchStats[pitchType], pitchSpeed);
      }

      // Create one data point per row
      allDataPoints.push({
        pitchType,
        avgSpeed: pitchSpeed,
        // Convert createdAt from Date to an ISO string
        date: record.createdAt.toISOString(),
      });
    });

    // 6) Format pitchStats for the response
    const formattedPitchStats = Object.entries(pitchStats).map(
      ([pitchType, peakSpeed]) => ({ pitchType, peakSpeed })
    );

    // 7) Return JSON with "avgPitchSpeeds" containing .date
    return NextResponse.json({
      pitchStats: formattedPitchStats,
      // Each record => { pitchType, avgSpeed, date }
      avgPitchSpeeds: allDataPoints,
    });
  } catch (error: any) {
    console.error('Error fetching Trackman data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Trackman data.' },
      { status: 500 }
    );
  }
}
