import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
    const { firstName, lastName, email, level, u } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create an athlete Object:
    const athlete = new Athlete({
      firstName,
      lastName,
      email,
      u,
      level,
    });

    await athlete.save();

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
