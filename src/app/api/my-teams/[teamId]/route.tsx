import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/team";
import Athlete from "@/models/athlete";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }
  try {
    await connectDB();

    const teamId = context.params.teamId; // Access params without strict typing

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Fetch the team to get the players array
    const team = await Team.findById(teamId).exec();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch all athletes based on the players array
    const athletes = await Athlete.find({ _id: { $in: team.players } }).exec();

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching athletes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
