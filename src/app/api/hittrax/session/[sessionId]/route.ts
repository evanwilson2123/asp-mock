import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    // Fetch all records for the given sessionId
    const hits = await prisma.hitTrax.findMany({
      where: { sessionId },
      select: {
        velo: true,
        dist: true,
        LA: true, // Include Launch Angle (LA)
      },
      orderBy: { createdAt: "asc" },
    });

    if (!hits || hits.length === 0) {
      return NextResponse.json(
        { error: "No hits found for the given sessionId" },
        { status: 404 }
      );
    }

    // Filter out hits where velo or dist is 0
    const filteredHits = hits.filter(
      (h) => h.velo !== 0 && h.dist !== 0 && h.velo !== null && h.dist !== null
    );

    if (filteredHits.length === 0) {
      return NextResponse.json(
        { error: "No valid hits found for the given sessionId" },
        { status: 404 }
      );
    }

    // Extract exit velocities, distances, and launch angles for calculations
    const exitVelocities = filteredHits
      .map((h) => h.velo)
      .filter((v): v is number => v !== null);
    const distances = filteredHits
      .map((h) => h.dist)
      .filter((d): d is number => d !== null);
    const launchAngles = filteredHits
      .map((h) => h.LA)
      .filter((la): la is number => la !== null);

    // Calculate max values
    const maxExitVelo =
      exitVelocities.length > 0 ? Math.max(...exitVelocities) : 0;
    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
    let laCount = 0;
    let laTotal = 0;
    for (let i = 0; i < launchAngles.length; i++) {
      laCount++;
      laTotal += launchAngles[i];
    }
    const avgLaunchAngle = laTotal / laCount;
    // const avgLaunchAngle =
    //   launchAngles.length > 0 ? Math.max(...launchAngles) : 0;

    return NextResponse.json({
      hits: filteredHits,
      maxExitVelo,
      maxDistance,
      avgLaunchAngle,
    });
  } catch (error: any) {
    console.error("Error fetching HitTrax session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data", details: error.message },
      { status: 500 }
    );
  }
}
