import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import Team from "@/models/team";
import Coach from "@/models/coach";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
  }

  try {
    await connectDB();
    console.log("Connected to DB");

    // Fetch teams
    const teams = await Team.find().exec();

    // Manually fetch coaches for each team
    const teamsWithCoaches = await Promise.all(
      teams.map(async (team) => {
        const coach = team.coach
          ? await Coach.findById(team.coach).select("firstName lastName").exec()
          : null;

        return {
          ...team.toObject(), // Convert Mongoose document to plain JS object
          coach, // Attach the coach data
        };
      })
    );

    return NextResponse.json({ teams: teamsWithCoaches }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
