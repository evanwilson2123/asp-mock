import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u");

  if (!userId) {
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
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
      { error: "Failed to fetch athletes" },
      { status: 500 }
    );
  }
}
