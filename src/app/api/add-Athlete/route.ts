import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication Failed" },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    // Parse the request body
    const { firstName, lastName, email, password, level, u } = await req.json();

    // Check for null values
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
    });

    // Create an athlete Object:
    const athlete = new Athlete({
      firstName,
      lastName,
      email,
      u,
      level,
    });

    await athlete.save();

    // add role and objectId metadata
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: "ATHLETE",
        objectId: athlete._id,
      },
    });

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
