import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import Team from '@/models/team';
import Coach from '@/models/coach';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/teams
 *
 * **Fetch All Teams with Coach Information**
 *
 * This endpoint retrieves all teams from the database, along with their respective coach information.
 * It authenticates the request using Clerk and ensures the user is authorized before accessing the data.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "teams": [
 *       {
 *         "_id": "team1",
 *         "name": "Team A",
 *         "coach": { "_id": "coach1", "firstName": "John", "lastName": "Doe" },
 *         "assistants": ["assistant1", "assistant2"],
 *         "players": ["player1", "player2"]
 *       },
 *       {
 *         "_id": "team2",
 *         "name": "Team B",
 *         "coach": null, // If no coach assigned
 *         "assistants": [],
 *         "players": []
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error Responses:**
 *   - **Unauthorized (400):** When authentication fails:
 *     ```json
 *     {
 *       "error": "Auth failed"
 *     }
 *     ```
 *   - **Internal Server Error (500):** For unexpected server issues:
 *     ```json
 *     {
 *       "error": "Database connection error"
 *     }
 *     ```
 *
 * ---
 *
 * **Logic Flow:**
 * 1. Authenticates the request using Clerk to verify the user's identity.
 * 2. Connects to the MongoDB database using the `connectDB` function.
 * 3. Fetches all teams from the `Team` collection.
 * 4. For each team:
 *    - If a coach ID exists, fetches the corresponding coach from the `Coach` collection.
 *    - Attaches the coach's `firstName` and `lastName` to the team object.
 * 5. Returns the enriched list of teams with their coach information in the response.
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
 * - Requires user authentication via Clerk. Unauthenticated requests will be rejected.
 * - Handles potential database connection errors gracefully.
 * - Uses `Promise.all` to fetch coaches concurrently for better performance.
 * - The `coach` field will be `null` if no coach is assigned to the team.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }

  try {
    await connectDB();
    console.log('Connected to DB');

    // Fetch teams
    const teams = await Team.find().exec();

    // Manually fetch coaches for each team
    const teamsWithCoaches = await Promise.all(
      teams.map(async (team) => {
        const coach = team.coach
          ? await Coach.findById(team.coach).select('firstName lastName').exec()
          : null;

        return {
          ...team.toObject(), // Convert Mongoose document to plain JS object
          coach, // Attach the coach data
        };
      })
    );

    return NextResponse.json({ teams: teamsWithCoaches }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
