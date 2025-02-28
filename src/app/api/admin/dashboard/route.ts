import { NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismaDb';

interface Response {
  athleteCount: number;
  athletePCount: number;
  athleteHCount: number;
  athletePHCount: number;
  athleteSCCount: number;
  athleteTACount: number;
  pitchCount: number;
  blastCount: number;
  hitCount: number;
  armCount: number;
}

/**
 * GET /api/dashboard
 *
 * This API endpoint retrieves aggregated statistics related to athletes and performance data.
 * It provides counts for different athlete program types and various performance metrics collected from **Trackman**, **BlastMotion**, **HitTrax**, and **ArmCare** systems.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** This endpoint requires the user to be authenticated via Clerk.
 * - Returns **401 Unauthorized** if the user is not authenticated.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the counts of athletes and performance data across different categories.
 *   ```json
 *   {
 *     "athleteCount": 150,
 *     "athletePCount": 60,
 *     "athleteHCount": 50,
 *     "athletePHCount": 30,
 *     "athleteSCCount": 10,
 *     "pitchCount": 500,
 *     "blastCount": 300,
 *     "hitCount": 200,
 *     "armCount": 100
 *   }
 *   ```
 *
 *   - **athleteCount:** Total number of athletes.
 *   - **athletePCount:** Number of athletes in the **Pitching** program.
 *   - **athleteHCount:** Number of athletes in the **Hitting** program.
 *   - **athletePHCount:** Number of athletes in **Pitching + Hitting** programs.
 *   - **athleteSCCount:** Number of athletes in **Strength & Conditioning (S + C)** programs.
 *   - **pitchCount:** Total number of pitches tracked via **Trackman**.
 *   - **blastCount:** Total number of swings tracked via **BlastMotion**.
 *   - **hitCount:** Total number of hits tracked via **HitTrax**.
 *   - **armCount:** Total number of **ArmCare** exams conducted.
 *
 * - **Error (401):**
 *   Occurs when the request is unauthorized.
 *   ```json
 *   { "error": "Unauthorized" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors while fetching data.
 *   ```json
 *   { "error": "Internal Server Error" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to fetch dashboard stats
 * GET /api/dashboard
 *
 * @errorHandling
 * - Returns **401** if the user is not authenticated.
 * - Returns **500** for any internal server/database issues.
 */

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectDB();
    const pitchCount = await prisma.trackman.count();
    const blastCount = await prisma.blastMotion.count();
    const hitCount = await prisma.hitTrax.count();
    const armCount = await prisma.armCare.count();
    const athleteCount = await Athlete.countDocuments(
      {},
      { hint: '_id_' }
    ).exec();
    const athletePCount = await Athlete.countDocuments({
      programType: 'Pitching',
    }).exec();
    const athleteHCount = await Athlete.countDocuments({
      programType: 'Hitting',
    }).exec();
    const athletePHCount = await Athlete.countDocuments({
      programType: 'Pitching + Hitting',
    }).exec();
    const athleteSCCount = await Athlete.countDocuments({
      programType: 'S + C',
    }).exec();
    const athleteTACount = await Athlete.countDocuments({
      programType: 'Team Athlete',
    });
    const response: Response = {
      athleteCount,
      athletePCount,
      athleteHCount,
      athletePHCount,
      athleteSCCount,
      athleteTACount,
      pitchCount,
      blastCount,
      hitCount,
      armCount,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
