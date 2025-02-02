import { connectDB } from '@/lib/db';
import Coach from '@/models/coach';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/coaches
 *
 * **Fetch All Coaches**
 *
 * This endpoint retrieves a list of all coaches from the database.
 * Authentication is required to access this endpoint.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response:
 *
 * - **Success (200):**
 *   Returns an array of coach objects:
 *   ```json
 *   {
 *     "coaches": [
 *       {
 *         "_id": "12345",
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "email": "john.doe@example.com"
 *       },
 *       {
 *         "_id": "67890",
 *         "firstName": "Jane",
 *         "lastName": "Smith",
 *         "email": "jane.smith@example.com"
 *       }
 *     ]
 *   }
 *   ```
 *
 * - **Error (400):**
 *   - If the authentication fails:
 *   ```json
 *   {
 *     "error": "Auth failed"
 *   }
 *   ```
 *
 * - **Error (500):**
 *   - If there's an internal server error during the data fetch process:
 *   ```json
 *   {
 *     "error": "Failed to fetch coaches"
 *   }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request using fetch:
 * fetch('/api/coaches')
 *   .then(response => response.json())
 *   .then(data => console.log(data))
 *   .catch(error => console.error('Error fetching coaches:', error));
 *
 * ---
 *
 * @notes
 * - Authentication is required to access this endpoint.
 * - Make sure the user is logged in to receive the `userId` from Clerk.
 * - The data is fetched from the `Coach` collection in the database.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }
  try {
    await connectDB();
    const coaches = await Coach.find();
    return NextResponse.json({ coaches });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}
