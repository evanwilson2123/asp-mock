import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";
import { auth } from "@clerk/nextjs/server";

/**
 * GET handler:
 * - Fetches `HitTrax` records for the given athlete.
 * - Groups data by `sessionId` and calculates stats (Max Exit Velo, Max Distance, etc.).
 * - Returns a list of clickable sessions along with aggregated stats.
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "AUTH FAILED" }, { status: 400 });
  }

  const athleteId = context.params.athleteId;

  try {
    const records = await prisma.hitTrax.findMany({
      where: { athlete: athleteId },
      orderBy: { date: "desc" }, // Sort by session date (latest first)
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "No HitTrax data found for this athlete" },
        { status: 404 }
      );
    }

    // Group records by sessionId
    const sessions: Record<
      string,
      { velocities: number[]; distances: number[]; date: string }
    > = {};

    for (const record of records) {
      const { sessionId, velo, dist, date } = record;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          velocities: [],
          distances: [],
          date: date ? new Date(date).toISOString().split("T")[0] : "No Date",
        };
      }

      if (velo) sessions[sessionId].velocities.push(velo);
      if (dist) sessions[sessionId].distances.push(dist);
    }

    // Calculate stats
    let maxExitVelo = 0;
    let maxDistance = 0;
    let totalHardHits = 0;
    let totalEntries = 0;

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const { velocities, distances, date } = sessions[sessionId];

      if (velocities.length > 0) {
        maxExitVelo = Math.max(maxExitVelo, ...velocities);
        const sessionTotal = velocities.reduce((sum, velo) => sum + velo, 0);
        totalEntries += velocities.length;
        totalHardHits += velocities.filter((velo) => velo >= 95).length;
        const avgExitVelo = sessionTotal / velocities.length;

        if (distances.length > 0) {
          maxDistance = Math.max(maxDistance, ...distances);
        }

        return { sessionId, date, avgExitVelo };
      }

      return { sessionId, date, avgExitVelo: 0 };
    });

    // Hard Hit Average
    const hardHitAverage = totalEntries > 0 ? totalHardHits / totalEntries : 0;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitAverage,
      sessionAverages,
      sessions: sessionAverages.map(({ sessionId, date }) => ({
        sessionId,
        date,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching HitTrax data:", error);
    return NextResponse.json(
      { error: "Failed to fetch HitTrax data", details: error.message },
      { status: 500 }
    );
  }
}
