import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/team";
import Athlete from "@/models/athlete";

export async function GET(
  req: NextRequest,
  context: { params: { teamId: string } }
) {
  const { teamId } = await context.params; // Await the params object

  try {
    await connectDB();

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is missing" },
        { status: 400 }
      );
    }

    // Fetch the team document to get the players array
    const team = await Team.findById(teamId).exec();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch the athletes based on the players array
    const athletes = await Athlete.find({ _id: { $in: team.players } }).exec();

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching athletes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
