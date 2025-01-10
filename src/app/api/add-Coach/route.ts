import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Coach from "@/models/coach";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // Parse the request body
    const { firstName, lastName, email, password } = await req.json();

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

    const coach = new Coach({
      firstName,
      lastName,
      email,
    });

    await coach.save();

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
