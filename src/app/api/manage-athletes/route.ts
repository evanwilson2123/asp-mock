import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';
import Athlete from '@/models/athlete';
import Team from '@/models/team';
import { connectDB } from '@/lib/db';

/**
 * GET /api/athletes
 *
 * **Fetch Athletes Based on User Role**
 *
 * This endpoint retrieves athlete data based on the role of the authenticated user:
 * - **ADMIN**: Returns all athletes.
 * - **COACH**: Returns athletes associated with the teams the coach manages.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request. Authentication is required.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   - For ADMIN:
 *   ```json
 *   {
 *     "athletes": [
 *       { "_id": "123", "firstName": "John", "lastName": "Doe" },
 *       { "_id": "456", "firstName": "Jane", "lastName": "Smith" }
 *     ]
 *   }
 *   ```
 *   - For COACH:
 *   ```json
 *   {
 *     "athletes": [
 *       { "_id": "789", "firstName": "Alex", "lastName": "Johnson" }
 *     ]
 *   }
 *   ```
 *
 * - **Error Responses:**
 *   - **Unauthorized (400):** When authentication fails:
 *   ```json
 *   {
 *     "error": "Auth Failed"
 *   }
 *   ```
 *   - **Role Not Found (400):** If the user has no role assigned:
 *   ```json
 *   {
 *     "error": "No Role found"
 *   }
 *   ```
 *   - **Internal Server Error (500):** For unexpected server issues:
 *   ```json
 *   {
 *     "error": "Internal Server Error"
 *   }
 *   ```
 *
 * ---
 *
 * **Role-Based Access Logic:**
 * - **ADMIN:** Retrieves all athlete records from the database.
 * - **COACH:** Retrieves teams where the coach's `objectId` matches the coach field in the team.
 *   - Then collects all athlete IDs from these teams' player lists.
 *   - Finally, fetches athlete records that match these IDs.
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/athletes', {
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
 * - Requires authentication via Clerk. Only authenticated users with valid roles will get data.
 * - Coaches only see athletes from the teams they manage, ensuring data privacy.
 * - Admins have access to all athletes without restrictions.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  try {
    await connectDB();

    const client = await clerkClient();
    const user = await client.users?.getUser(userId); // Clerk client
    const role = user.publicMetadata?.role;
    console.log(role);

    let athletes = [];

    switch (role) {
      case 'ADMIN':
        // Fetch all athletes for ADMIN
        athletes = await Athlete.find().exec();
        break;

      case 'COACH':
        // Fetch teams where the coach's objectId matches
        const teams = await Team.find({
          coach: user.publicMetadata?.objectId,
        }).exec();

        // Collect all athlete IDs (players) from the teams
        const athleteIds = teams.reduce((ids: string[], team) => {
          return ids.concat(team.players || []);
        }, []);

        // Fetch all athletes whose IDs match the collected athlete IDs
        athletes = await Athlete.find({ _id: { $in: athleteIds } }).exec();
        break;

      default:
        return NextResponse.json({ error: 'No Role found' }, { status: 400 });
    }

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
