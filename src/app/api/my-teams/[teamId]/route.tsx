import { connectDB } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import Team from '@/models/team';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/teams/:teamId/athletes
 *
 * **Fetch Athletes for a Specific Team**
 *
 * This endpoint retrieves a list of athletes associated with a given team ID.
 * It ensures secure access through authentication and validates the existence of both the user and the team.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request. Authentication is required.
 * @param {Object} context - Context object containing URL parameters.
 * @param {string} context.params.teamId - The unique identifier of the team.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "athletes": [
 *       { "_id": "123", "firstName": "John", "lastName": "Doe" },
 *       { "_id": "456", "firstName": "Jane", "lastName": "Smith" }
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
 *   - **Missing Team ID (400):** If the `teamId` parameter is not provided:
 *     ```json
 *     {
 *       "error": "Team ID is required"
 *     }
 *     ```
 *   - **Team Not Found (404):** If no team matches the provided ID:
 *     ```json
 *     {
 *       "error": "Team not found"
 *     }
 *     ```
 *   - **Internal Server Error (500):** For unexpected server issues:
 *     ```json
 *     {
 *       "error": "Error fetching athletes"
 *     }
 *     ```
 *
 * ---
 *
 * **Logic Flow:**
 * 1. Authenticates the request using Clerk.
 * 2. Validates the presence of the `teamId` parameter.
 * 3. Fetches the team document from the database using `teamId`.
 * 4. Retrieves all athletes whose IDs are listed in the team's `players` array.
 * 5. Returns the athlete data in the response.
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/teams/123/athletes', {
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
 * - Requires authentication via Clerk. Only authenticated users can access athlete data.
 * - Handles both missing parameters and non-existent teams gracefully.
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }
  try {
    await connectDB();

    const teamId = context.params.teamId; // Access params without strict typing

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Fetch the team to get the players array
    const team = await Team.findById(teamId).exec();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fetch all athletes based on the players array
    const athletes = await Athlete.find({ _id: { $in: team.players } }).exec();

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
