import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Coach from "@/models/coach";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
  }
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

    const coach = new Coach({
      firstName,
      lastName,
      email,
    });

    await coach.save();
    console.log("Coach Object ID: ", coach._id);

    // add role and objectId metadata
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: "COACH",
        objectId: coach._id,
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
