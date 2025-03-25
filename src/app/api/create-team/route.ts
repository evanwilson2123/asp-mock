import { connectDB } from '@/lib/db';
import Group from '@/models/group';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/teams
 *
 * **Create a New Team**
 *
 * This endpoint allows an authenticated user to create a new team in the system.
 * Authentication is required to access this endpoint.
 *
 * ---
 *
 * @param {NextRequest} req - The request object containing the following JSON body:
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "Team Name",          // (string) Required - The name of the team.
 *   "coach": "Coach ID",          // (string) Required - The ID of the head coach.
 *   "assistants": ["ID1", "ID2"], // (array)  Optional - List of assistant coach IDs.
 *   "players": ["Player1", "Player2"], // (array) Required - List of player IDs.
 *   "u": "Unique Identifier"      // (string) Required - Unique identifier for the team.
 * }
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (201):**
 *   Returns the newly created team object:
 *   ```json
 *   {
 *     "message": "Team created successfully",
 *     "team": {
 *       "_id": "12345",
 *       "name": "Team Name",
 *       "coach": "Coach ID",
 *       "assistants": ["ID1", "ID2"],
 *       "players": ["Player1", "Player2"],
 *       "u": "Unique Identifier"
 *     }
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - If the authentication fails:
 *   ```json
 *   {
 *     "error": "Auth Failed"
 *   }
 *   ```
 *   - If required fields are missing:
 *   ```json
 *   {
 *     "error": "All required fields must be filled"
 *   }
 *   ```
 *
 * - **Error (500):**
 *   - If there's an internal server error during team creation:
 *   ```json
 *   {
 *     "error": "An error occurred while creating the team"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/teams', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: "Warriors",
 *     coach: "coachId123",
 *     assistants: ["assistant1", "assistant2"],
 *     players: ["player1", "player2"],
 *     u: "unique-id-456"
 *   })
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error creating team:', error));
 *
 * ---
 *
 * @notes
 * - Ensure the user is authenticated before making this request.
 * - All required fields (`name`, `coach`, `players`, `u`) must be provided in the request body.
 * - The team is saved in the `Team` collection in the database.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }
  try {
    await connectDB();

    const { name, coach, assistants, players, level } = await req.json();

    if (!name || !coach || !players || !level) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }
    let updatedLevel = '';

    switch (level) {
      case 'youth':
        updatedLevel = 'Youth';
        break;
      case 'highschool':
        updatedLevel = 'High School';
        break;
      case 'college':
        updatedLevel = 'College';
        break;
      case 'pro':
        updatedLevel = 'Pro';
        break;
      default:
        updatedLevel = 'all';
        break;
    }

    const newTeam = new Group({
      name,
      headCoach: [coach],
      assistants: assistants || [],
      athletes: players,
      level: updatedLevel,
    });

    await newTeam.save();

    return NextResponse.json(
      { message: 'Team created successfully', team: newTeam },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the team' },
      { status: 500 }
    );
  }
}
