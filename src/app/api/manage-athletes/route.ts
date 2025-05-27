import { NextResponse } from 'next/server';
import { clerkClient, auth } from '@clerk/nextjs/server';
import Athlete from '@/models/athlete';
import { connectDB } from '@/lib/db';
import Group from '@/models/group';

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
    const user = await client.users?.getUser(userId);
    const role = user.publicMetadata?.role;
    const coachId = user.publicMetadata?.objectId;

    if (!role) {
      return NextResponse.json({ error: 'No Role found' }, { status: 400 });
    }

    let athletes = [];

    switch (role) {
      case 'ADMIN':
        // Fetch all athletes for ADMIN
        athletes = await Athlete.find()
          .select('_id firstName lastName level email')
          .exec();
        break;

      case 'COACH':
        if (!coachId) {
          return NextResponse.json({ error: 'Coach ID not found' }, { status: 400 });
        }

        // Find all groups where the coach is either head coach or assistant
        const groups = await Group.find({
          $or: [
            { headCoach: coachId },
            { assistants: coachId }
          ]
        }).exec();

        // Get all unique athlete IDs from these groups
        const athleteIds = [...new Set(
          groups.reduce((ids: string[], group) => {
            return [...ids, ...group.athletes];
          }, [])
        )];

        // Fetch athletes that belong to these groups
        athletes = await Athlete.find({
          _id: { $in: athleteIds }
        })
        .select('_id firstName lastName level email')
        .exec();
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error('Error in manage-athletes route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
