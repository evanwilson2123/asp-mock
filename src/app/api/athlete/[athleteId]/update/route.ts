import { NextRequest, NextResponse } from "next/server";
import Athlete from "@/models/athlete";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

  const athleteId = await context.params.athleteId;

  try {
    await connectDB();

    const body = await req.json();
    const updates = Object.entries(body);

    // Ensure the athlete exists
    const athlete = await Athlete.findById(athleteId).exec();
    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    // Update the athletes document
    updates.forEach(([key, value]) => {
      athlete[key] = value;
    });
    await athlete.save();

    return NextResponse.json({ success: true, athlete }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating athlete:", error);
    return NextResponse.json(
      { error: "Failed to updated athlete" },
      { status: 500 }
    );
  }
}
