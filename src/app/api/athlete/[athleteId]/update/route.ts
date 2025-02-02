import { NextRequest, NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

/**
 * PUT /api/athlete/:athleteId
 *
 * This API endpoint **updates an athlete's information** based on the provided data.
 * It allows modifying any field in the athlete's document by sending a JSON payload with key-value pairs of the fields to update.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** This endpoint requires the user to be authenticated via Clerk.
 * - Returns **400 Auth Failed** if authentication is unsuccessful.
 *
 * ---
 *
 * @pathParam {string} athleteId - The unique ID of the athlete whose information is being updated.
 *
 * ---
 *
 * @requestBody {JSON} - The request body should contain the fields to update:
 * ```json
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "age": 25,
 *   "level": "College",
 *   "height": 180,
 *   "weight": 75
 * }
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   Returns the updated athlete information.
 *   ```json
 *   {
 *     "success": true,
 *     "athlete": {
 *       "_id": "athlete_12345",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "age": 25,
 *       "level": "College",
 *       "height": 180,
 *       "weight": 75
 *     }
 *   }
 *   ```
 *
 * - **Error (400):**
 *   Occurs when authentication fails.
 *   ```json
 *   { "error": "Auth Failed" }
 *   ```
 *
 * - **Error (404):**
 *   Occurs when the athlete with the provided ID is not found.
 *   ```json
 *   { "error": "Athlete not found" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during the update process.
 *   ```json
 *   { "error": "Failed to update athlete" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to update an athlete's profile
 * PUT /api/athlete/athlete_12345
 *
 * Request Body:
 * {
 *   "firstName": "Michael",
 *   "level": "Pro"
 * }
 *
 * @errorHandling
 * - Returns **400** if authentication fails.
 * - Returns **404** if the athlete does not exist.
 * - Returns **500** for internal server/database errors.
 */
export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  const athleteId = await context.params.athleteId;

  try {
    await connectDB();

    const body = await req.json();
    const updates = Object.entries(body);

    // Ensure the athlete exists
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Update the athletes document
    updates.forEach(([key, value]) => {
      athlete[key] = value;
    });
    await athlete.save();

    return NextResponse.json({ success: true, athlete }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating athlete:', error);
    return NextResponse.json(
      { error: 'Failed to updated athlete' },
      { status: 500 }
    );
  }
}
