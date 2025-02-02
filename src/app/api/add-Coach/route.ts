import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import Coach from '@/models/coach';
/**
 * POST /api/coach
 *
 * This API endpoint allows an authenticated user to create a new coach account.
 * It handles both the creation of a user in **Clerk** and a corresponding **Coach** record in the MongoDB database.
 *
 * ---
 *
 * @param {NextRequest} req - The incoming request object containing the coach details in the request body.
 *
 * @requestBody
 * - **firstName** (string) - The coach's first name. (Optional but recommended)
 * - **lastName** (string) - The coach's last name. (Optional but recommended)
 * - **email** (string, required) - The coach's email address (used for login).
 * - **password** (string, required) - The password for the coach's account.
 *
 * ---
 *
 * @returns {Promise<NextResponse>} JSON response containing:
 *
 * - **Success (201):**
 *   Returns a success message along with the created user details.
 *   ```json
 *   {
 *     "message": "User created successfully",
 *     "user": {
 *       "id": "user_123",
 *       "emailAddress": "coach@example.com",
 *       "publicMetadata": {
 *         "role": "COACH",
 *         "objectId": "64c9f8e0b3d6e7b9"
 *       }
 *     }
 *   }
 *   ```
 *
 * - **Error (400):**
 *   Occurs when authentication fails or required fields are missing.
 *   ```json
 *   { "error": "Auth failed" }
 *   ```
 *   OR
 *   ```json
 *   { "error": "Email and password are required" }
 *   ```
 *
 * - **Error (500):**
 *   Occurs due to server/database errors during user creation.
 *   ```json
 *   { "error": "Internal server error", "details": "Specific error message" }
 *   ```
 *
 * ---
 *
 * @example
 * // Example request to create a new coach
 * POST /api/coach
 * Content-Type: application/json
 *
 * Request Body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "johndoe@example.com",
 *   "password": "securePassword123"
 * }
 *
 * @errorHandling
 * - Returns **400** if the user is not authenticated or required fields are missing.
 * - Returns **500** for any internal server/database issues.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }
  try {
    await connectDB();
    // Parse the request body
    const { firstName, lastName, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create a user in Clerk
    const client = await clerkClient();
    const user = await client.users.createUser({
      emailAddress: [email], // Correct field structure
      password,
    });

    const coach = new Coach({
      firstName,
      lastName,
      email,
    });

    await coach.save();
    console.log('Coach Object ID: ', coach._id);

    // add role and objectId metadata
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: 'COACH',
        objectId: coach._id,
      },
    });

    // Return success response
    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Return error response
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
