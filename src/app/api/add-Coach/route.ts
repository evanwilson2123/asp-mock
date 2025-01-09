import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create a user in Clerk
    const client = await clerkClient();
    const user = await client.users.createUser({
      emailAddress: [email], // Correct field structure
      password,
    });

    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: "COACH",
      },
    });

    // Return success response
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Return error response
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
