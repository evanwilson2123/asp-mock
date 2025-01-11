import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/team";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
  }
  try {
    await connectDB();
    const teams = await Team.find()
      .populate("coach", "firstName lastName")
      .exec();
    return NextResponse.json({ teams }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
