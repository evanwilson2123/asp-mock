import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
/**
 * POST /api/athlete
 *
 * This API endpoint allows an authenticated user to create a new athlete account.
 * It handles the creation of the user in **Clerk** and the corresponding **Athlete** record in the MongoDB database.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request containing athlete details in the request body.
 *
 * @requestBody
 * - **firstName** (string, required) - The athlete's first name.
 * - **lastName** (string, required) - The athlete's last name.
 * - **email** (string, required) - The athlete's email address (used for login).
 * - **password** (string, required) - The password for the athlete's account.
 * - **level** (string, required) - The athlete's competition level (e.g., "High School", "College").
 * - **u** (string, optional) - Unique identifier (if applicable).
 * - **age** (number, optional) - The athlete's age.
 * - **height** (number, optional) - The athlete's height.
 * - **weight** (number, optional) - The athlete's weight.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (200):**
 *   ```json
 *   { "message": "success" }
 *   ```
 *
 * - **Error (400):**
 *   Occurs when authentication fails or required fields are missing.
 *   ```json
 *   { "error": "Authentication Failed" }
 *   ```
 *   OR
 *   ```json
 *   { "error": "Missing fields" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during user creation.
 *   ```json
 *   { "error": "Internal Server Error" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to create a new athlete
 * POST /api/athlete
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "firstName": "Jane",
 *   "lastName": "Doe",
 *   "email": "janedoe@example.com",
 *   "password": "securePassword123",
 *   "level": "College",
 *   "age": 20,
 *   "height": 170,
 *   "weight": 65
 * }
 *
 * @errorHandling
 * - Returns **400** if the user is not authenticated or if required fields are missing.
 * - Returns **500** for any internal server/database issues.
 */

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication Failed' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    // Parse the request body
    const {
      firstName,
      lastName,
      email,
      password,
      level,
      u,
      age,
      height,
      weight,
    } = await req.json();

    // Check for null values
    if (!firstName || !lastName || !email || !password || !level) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
    });

    console.log(user.id);

    // Create an athlete Object:
    const athlete = new Athlete({
      clerkId: user.id,
      firstName,
      lastName,
      email,
      u,
      level,
      age: age,
      height: height,
      weight: weight,
    });

    await athlete.save();

    // add role and objectId metadata
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: 'ATHLETE',
        objectId: athlete._id,
      },
    });

    return NextResponse.json({ message: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
