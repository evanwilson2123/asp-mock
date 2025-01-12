import { NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
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
    const user = await client.users?.getUser(userId);
    const coachId = user.publicMetadata?.objectId;
    if (!coachId) {
      return NextResponse.json({ error: "missing Coach ID" }, { status: 400 });
    }

    const teams = await Team.find({
      $or: [{ coach: coachId }, { assistants: coachId }],
    }).exec();

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
