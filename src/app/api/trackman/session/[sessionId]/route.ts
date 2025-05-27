import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/sessions/:sessionId/pitches
 *
 * **Fetch Pitch Data for a Specific Session**
 *
 * This endpoint retrieves all pitch-related data from the Trackman database for a given session.
 * It organizes the data by pitch type, including pitch speeds, spin rates, break metrics, and pitch locations.
 *
 * ---
 *
 * @param {NextRequest} req - The HTTP request object.
 * @param {object} context - The request context containing parameters.
 * @param {string} context.params.sessionId - The unique identifier for the session.
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "dataByPitchType": {
 *       "Fastball": {
 *         "speeds": [90, 92, 88],
 *         "spinRates": [2200, 2300, 2150],
 *         "horizontalBreaks": [3.5, 4.0, 2.8],
 *         "verticalBreaks": [10.2, 11.1, 9.8],
 *         "locations": [
 *           { "x": 0.5, "y": 2.8 },
 *           { "x": -0.3, "y": 2.5 }
 *         ]
 *       },
 *       "Slider": {
 *         "speeds": [82, 84],
 *         "spinRates": [1800, 1900],
 *         "horizontalBreaks": [8.0, 7.5],
 *         "verticalBreaks": [4.2, 3.8],
 *         "locations": [
 *           { "x": -1.0, "y": 2.2 }
 *         ]
 *       }
 *     }
 *   }
 *   ```
 *
 * - **Error Responses:**
 *   - **Not Found (404):** If no pitches are found for the session:
 *     ```json
 *     {
 *       "error": "No pitches found for this session."
 *     }
 *     ```
 *   - **Internal Server Error (500):** For unexpected server issues:
 *     ```json
 *     {
 *       "error": "Failed to fetch session data",
 *       "details": "Database connection error"
 *     }
 *     ```
 *
 * ---
 *
 * **Logic Flow:**
 * 1. Extracts the `sessionId` from the request parameters.
 * 2. Queries the `Trackman` database to find all pitches for the given session.
 * 3. Organizes the retrieved data by pitch type:
 *    - **speeds:** List of pitch release speeds.
 *    - **spinRates:** List of spin rates (if available).
 *    - **horizontalBreaks:** Horizontal movement data.
 *    - **verticalBreaks:** Induced vertical break data.
 *    - **locations:** Array of objects with `x` (locationSide) and `y` (locationHeight).
 * 4. Returns the organized data in the response.
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/sessions/123/pitches', {
 *   method: 'GET'
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error:', error));
 *
 * ---
 *
 * @notes
 * - Data is grouped dynamically based on pitch type (e.g., Fastball, Slider).
 * - Handles missing data gracefully (e.g., if spin rate is null).
 * - Logs errors to the server console for debugging purposes.
 */

// TODO: add tilt, verticalApproachAngle, and releaseHeight to the response
export async function GET(req: NextRequest, context: any) {
  const { sessionId } = context.params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }

  try {
    const pitches = await prisma.trackman.findMany({
      where: { sessionId },
      select: {
        pitchReleaseSpeed: true,
        pitchType: true,
        spinRate: true,
        horizontalBreak: true,
        inducedVerticalBreak: true,
        locationHeight: true,
        locationSide: true,
        stuffPlus: true,
        tilt: true,
        verticalApproachAngle: true,
        releaseHeight: true,
        releaseSide: true,
      },
    });

    if (!pitches || pitches.length === 0) {
      return NextResponse.json(
        { error: 'No pitches found for this session.' },
        { status: 404 }
      );
    }

    const dataByPitchType: Record<
      string,
      {
        speeds: number[];
        spinRates: number[];
        horizontalBreaks: number[];
        verticalBreaks: number[];
        locations: { x: number; y: number }[];
        stuffPlus: number[];
        tilts: string[];
        verticalApproachAngles: number[];
        releaseHeights: number[];
        releaseSides: number[];
      }
    > = {};

    pitches.forEach((pitch) => {
      const pitchType = pitch.pitchType || 'Unknown';

      if (!dataByPitchType[pitchType]) {
        dataByPitchType[pitchType] = {
          speeds: [],
          spinRates: [],
          horizontalBreaks: [],
          verticalBreaks: [],
          locations: [],
          stuffPlus: [],
          tilts: [],
          verticalApproachAngles: [],
          releaseHeights: [],
          releaseSides: [],
        };
      }

      if (pitch.pitchReleaseSpeed !== null) {
        dataByPitchType[pitchType].speeds.push(pitch.pitchReleaseSpeed);
      }

      if (pitch.spinRate !== null) {
        dataByPitchType[pitchType].spinRates.push(pitch.spinRate);
      }

      if (pitch.horizontalBreak !== null) {
        dataByPitchType[pitchType].horizontalBreaks.push(pitch.horizontalBreak);
      }

      if (pitch.inducedVerticalBreak !== null) {
        dataByPitchType[pitchType].verticalBreaks.push(
          pitch.inducedVerticalBreak
        );
      }

      if (pitch.locationHeight !== null && pitch.locationSide !== null) {
        dataByPitchType[pitchType].locations.push({
          x: pitch.locationSide,
          y: pitch.locationHeight,
        });
      }

      if (pitch.stuffPlus !== null && pitch.stuffPlus !== undefined) {
        dataByPitchType[pitchType].stuffPlus.push(pitch.stuffPlus);
      }

      if (pitch.tilt !== null && pitch.tilt !== undefined) {
        dataByPitchType[pitchType].tilts.push(pitch.tilt);
      }

      if (pitch.verticalApproachAngle !== null && pitch.verticalApproachAngle !== undefined) {
        dataByPitchType[pitchType].verticalApproachAngles.push(pitch.verticalApproachAngle);
      }

      if (pitch.releaseHeight !== null && pitch.releaseHeight !== undefined) {
        dataByPitchType[pitchType].releaseHeights.push(pitch.releaseHeight);
      }

      if (pitch.releaseSide !== null && pitch.releaseSide !== undefined) {
        dataByPitchType[pitchType].releaseSides.push(pitch.releaseSide);
      }
    });

    return NextResponse.json({ dataByPitchType });
  } catch (error: any) {
    console.error('Error fetching session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
