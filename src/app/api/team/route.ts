import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import Coach from '@/models/coach';
import { auth } from '@clerk/nextjs/server';
import Group from '@/models/group';

/**
 * GET /api/teams
 *
 * **Fetch All Teams with Head Coach Information**
 *
 * This endpoint retrieves all teams (groups) from the database along with their associated head coach information.
 * Each team now stores its head coaches in an array, so for each team the endpoint fetches all the coaches in that array.
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
 *         "headCoaches": [
 *           { "_id": "coach1", "firstName": "John", "lastName": "Doe" },
 *           { "_id": "coach2", "firstName": "Jane", "lastName": "Smith" }
 *         ],
 *         "assistants": ["assistant1", "assistant2"],
 *         "athletes": ["player1", "player2"],
 *         "level": "youth"
 *       },
 *       {
 *         "_id": "team2",
 *         "name": "Team B",
 *         "headCoaches": [],
 *         "assistants": [],
 *         "athletes": [],
 *         "level": "college"
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error Responses:**
 *   - **Unauthorized (400):**
 *     ```json
 *     {
 *       "error": "Auth failed"
 *     }
 *     ```
 *   - **Internal Server Error (500):**
 *     ```json
 *     {
 *       "error": "Database connection error"
 *     }
 *     ```
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }

  try {
    await connectDB();
    console.log('Connected to DB');

    // Fetch all teams (groups)
    const teams = await Group.find().exec();

    // For each team, fetch all head coaches from the array
    const teamsWithCoaches = await Promise.all(
      teams.map(async (team) => {
        const headCoaches =
          team.headCoach && team.headCoach.length > 0
            ? await Promise.all(
                team.headCoach.map(async (coachId: any) => {
                  return await Coach.findById(coachId)
                    .select('firstName lastName')
                    .exec();
                })
              )
            : [];

        return {
          ...team.toObject(), // Convert Mongoose document to plain JS object
          headCoaches, // Attach the fetched head coaches data
        };
      })
    );

    return NextResponse.json({ teams: teamsWithCoaches }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
