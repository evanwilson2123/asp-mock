import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HitTrax from "@/models/hittrax";
import { auth } from "@clerk/nextjs/server";

/**
 * GET handler:
 * - Finds all `HitTrax` docs for the given athlete.
 * - Calculates Max Exit Velo, Max Distance, Average Exit Velo (Running Average), and Hard Hit Average.
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "AUTH FAILED" }, { status: 400 });
  }
  try {
    await connectDB();

    // Fetch all sessions for athlete
    const docs = await HitTrax.find({ athlete: context.params.athleteId });

    // Initialize stats
    let maxExitVelo = 0;
    let maxDistance = 0;
    // let totalExitVelo = 0;
    let totalHardHits = 0;
    let totalEntries = 0;

    const sessionAverages: {
      date: string; // e.g. "2023-08-12"
      avgExitVelo: number;
    }[] = [];

    // Loop through each session to calculate stats
    for (const doc of docs) {
      const sessionVelo = doc.velo || [];
      const sessionDist = doc.dist || [];

      if (sessionVelo.length > 0) {
        // Update Max Exit Velo
        maxExitVelo = Math.max(maxExitVelo, ...sessionVelo);

        // Update Total Exit Velo and Entries
        const sessionTotal = sessionVelo.reduce(
          (sum: any, velo: any) => sum + velo,
          0
        );
        // totalExitVelo += sessionTotal;
        totalEntries += sessionVelo.length;

        // Count Hard Hits (e.g., >95 mph)
        totalHardHits += sessionVelo.filter((velo: any) => velo >= 95).length;

        // Calculate and store session average
        const sessionAvg = sessionTotal / sessionVelo.length;
        const dateStr = doc.date
          ? new Date(doc.date[0]).toISOString().split("T")[0]
          : "NoDate";

        sessionAverages.push({ date: dateStr, avgExitVelo: sessionAvg });
      }

      if (sessionDist.length > 0) {
        // Update Max Distance
        maxDistance = Math.max(maxDistance, ...sessionDist);
      }
    }

    // Calculate Hard Hit Average
    const hardHitAverage = totalEntries > 0 ? totalHardHits / totalEntries : 0;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitAverage,
      sessionAverages, // e.g. [{ date, avgExitVelo }]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
