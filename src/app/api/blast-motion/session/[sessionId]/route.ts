import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    // Fetch all records for the given sessionId
    const swings = await prisma.blastMotion.findMany({
      where: { sessionId },
      select: {
        batSpeed: true,
        peakHandSpeed: true, // Fetch the correct field name from the database
      },
      orderBy: { createdAt: "asc" }, // Sort swings chronologically
    });

    if (!swings || swings.length === 0) {
      return NextResponse.json(
        { error: "No swings found for the given sessionId" },
        { status: 404 }
      );
    }

    // Rename `peakHandSpeed` to `handSpeed` in the response
    const transformedSwings = swings.map((s) => ({
      batSpeed: s.batSpeed,
      handSpeed: s.peakHandSpeed, // Map the correct field
    }));

    // Extract bat speeds and hand speeds for max calculations
    const batSpeeds = transformedSwings
      .map((s) => s.batSpeed)
      .filter((s): s is number => s !== null);
    const handSpeeds = transformedSwings
      .map((s) => s.handSpeed)
      .filter((s): s is number => s !== null);

    // Calculate max values
    const maxBatSpeed = batSpeeds.length > 0 ? Math.max(...batSpeeds) : 0;
    const maxHandSpeed = handSpeeds.length > 0 ? Math.max(...handSpeeds) : 0;

    return NextResponse.json({
      swings: transformedSwings,
      maxBatSpeed,
      maxHandSpeed,
    });
  } catch (error: any) {
    console.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data", details: error.message },
      { status: 500 }
    );
  }
}
