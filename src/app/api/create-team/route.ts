import { connectDB } from "@/lib/db";
import Team from "@/models/team";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }
  try {
    await connectDB();

    const { name, coach, assistants, players, u } = await req.json();

    if (!name || !coach || !players || !u) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const newTeam = new Team({
      name,
      coach,
      assistants: assistants || [],
      players,
      u,
    });

    await newTeam.save();

    return NextResponse.json(
      { message: "Team created successfully", team: newTeam },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the team" },
      { status: 500 }
    );
  }
}
