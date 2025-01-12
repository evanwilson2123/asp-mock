import { NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import Athlete from "@/models/athlete";
import Team from "@/models/team";
import { connectDB } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

  try {
    await connectDB();

    const client = await clerkClient();
    const user = await client.users?.getUser(userId); // Clerk client
    const role = user.publicMetadata?.role;
    console.log(role);

    let athletes = [];

    switch (role) {
      case "ADMIN":
        // Fetch all athletes for ADMIN
        athletes = await Athlete.find().exec();
        break;

      case "COACH":
        // Fetch teams where the coach's objectId matches
        const teams = await Team.find({
          coach: user.publicMetadata?.objectId,
        }).exec();

        // Collect all athlete IDs (players) from the teams
        const athleteIds = teams.reduce((ids: string[], team) => {
          return ids.concat(team.players || []);
        }, []);

        // Fetch all athletes whose IDs match the collected athlete IDs
        athletes = await Athlete.find({ _id: { $in: athleteIds } }).exec();
        break;

      default:
        return NextResponse.json({ error: "No Role found" }, { status: 400 });
    }

    return NextResponse.json({ athletes }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
