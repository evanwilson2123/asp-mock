import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/athletes
 *
 * **Fetch Athletes by User Identifier (`u` parameter)**
 *
 * This endpoint retrieves all athletes associated with a specific user identifier (`u`).
 * It requires authentication and will return an error if the user is not authenticated.
 *
 * ---
 *
 * @auth
 * - **Authentication Required:** Only authenticated users can access this endpoint.
 * - Returns **400 Auth failed** if the user is not authenticated.
 *
 * ---
 *
 * @queryParam {string} u - The unique identifier used to fetch associated athletes.
 *
 * Example:
 * ```http
 * GET /api/athletes?u=12345
 * Authorization: Bearer <token>
 * ```
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   ```json
 *   {
 *     "athletes": [
 *       {
 *         "_id": "athlete_id_1",
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "u": "12345",
 *         ...
 *       },
 *       {
 *         "_id": "athlete_id_2",
 *         "firstName": "Jane",
 *         "lastName": "Smith",
 *         "u": "12345",
 *         ...
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - Authentication failed: `{ "error": "Auth failed" }`
 *   - Missing `u` parameter: `{ "error": "Missing 'u' parameter" }`
 *
 * - **Error (500):**
 *   - Server error during database operations:
 *   ```json
 *   {
 *     "error": "Failed to fetch athletes"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/athletes?u=12345', {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Bearer <token>'
 *   }
 * })
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching athletes:', error));
 *
 * ---
 *
 * @notes
 * - Ensure that the `u` parameter is provided in the query string.
 * - The endpoint requires a valid authentication token for access.
 * - Errors are logged to the server console for debugging purposes.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u');

  if (!userId) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }

  if (!u) {
    return NextResponse.json(
      { error: "Missing 'u' parameter" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const athletes = await Athlete.find({ u });
    return NextResponse.json({ athletes });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}
