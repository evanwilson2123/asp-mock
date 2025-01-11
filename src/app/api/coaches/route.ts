import { connectDB } from "@/lib/db";
import Coach from "@/models/coach";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth failed" }, { status: 400 });
  }
  try {
    await connectDB();
    const coaches = await Coach.find();
    return NextResponse.json({ coaches });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}
