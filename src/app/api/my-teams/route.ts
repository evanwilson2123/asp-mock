import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Group from '@/models/group';

/**
 * GET /api/teams
 *
 * **Fetch Teams for a Coach or Assistant Coach**
 *
 * This endpoint retrieves all teams where the authenticated user is either a coach or an assistant coach.
 * It validates the user's authentication status and ensures proper role-based access.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request (authentication is required).
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "teams": [
 *       { "_id": "team1", "name": "Team A", "coach": "coachId", "assistants": ["assistant1"] },
 *       { "_id": "team2", "name": "Team B", "coach": "coachId", "assistants": ["assistant2"] }
 *     ]
 *   }
 *   ```
 *
 * - **Error Responses:**
 *   - **Unauthorized (400):** When authentication fails:
 *     ```json
 *     {
 *       "error": "Auth Failed"
 *     }
 *     ```
 *   - **Missing Coach ID (400):** When the authenticated user does not have a Coach ID:
 *     ```json
 *     {
 *       "error": "missing Coach ID"
 *     }
 *     ```
 *   - **Internal Server Error (500):** For unexpected server issues:
 *     ```json
 *     {
 *       "error": "Internal Server Error"
 *     }
 *     ```
 *
 * ---
 *
 * **Logic Flow:**
 * 1. Authenticates the request using Clerk.
 * 2. Retrieves the authenticated user's metadata to extract the `objectId` (Coach ID).
 * 3. Validates the existence of the Coach ID.
 * 4. Fetches all teams from the database where the user is listed as either:
 *    - The head coach (`coach` field), or
 *    - An assistant coach (`assistants` array).
 * 5. Returns the list of teams in the JSON response.
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/teams', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer <token>' }
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error:', error));
 *
 * ---
 *
 * @notes
 * - Requires authentication via Clerk. Only authenticated users can access their associated teams.
 * - Handles both missing metadata and database connection issues gracefully.
 * - Supports fetching teams for both head coaches and assistant coaches.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }
  try {
    await connectDB();

    const client = await clerkClient();
    const user = await client.users?.getUser(userId);
    const coachId = user.publicMetadata?.objectId;
    if (!coachId) {
      return NextResponse.json({ error: 'missing Coach ID' }, { status: 400 });
    }

    const teams = await Group.find({
      $or: [{ headCoach: coachId }, { assistants: coachId }],
    }).exec();

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
