import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlastMotion from "@/models/blastMotion";
import { auth } from "@clerk/nextjs/server";

/**
 * GET handler:
 * - Finds all `BlastMotion` docs for the given athlete.
 * - Flattens batSpeed & peakHandSpeed to find all-time max.
 * - Calculates average speeds for each doc (session) along with the doc's `date`.
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "AUTH FAILED" }, { status: 400 });
  }
  try {
    await connectDB();

    // Fetch all sessions for athlete
    const docs = await BlastMotion.find({ athlete: context.params.athleteId });

    // Flatten arrays for global max
    const allBatSpeeds: number[] = [];
    const allHandSpeeds: number[] = [];

    // Build an array of "session averages" to plot in a line chart
    const sessionAverages: {
      date: string; // e.g. "2023-08-12"
      avgBatSpeed: number;
      avgHandSpeed: number;
    }[] = [];

    for (const doc of docs) {
      // Flatten arrays for all-time max
      if (doc.batSpeed) {
        allBatSpeeds.push(...doc.batSpeed);
      }
      if (doc.peakHandSpeed) {
        allHandSpeeds.push(...doc.peakHandSpeed);
      }

      // Compute average for this doc
      let avgBat = 0;
      if (doc.batSpeed && doc.batSpeed.length > 0) {
        const sum = doc.batSpeed.reduce((acc: any, v: any) => acc + v, 0);
        avgBat = sum / doc.batSpeed.length;
      }
      let avgHand = 0;
      if (doc.peakHandSpeed && doc.peakHandSpeed.length > 0) {
        const sum = doc.peakHandSpeed.reduce((acc: any, v: any) => acc + v, 0);
        avgHand = sum / doc.peakHandSpeed.length;
      }

      // Convert doc.date => "YYYY-MM-DD" for easy chart labeling
      const dateStr = doc.date
        ? new Date(doc.date).toISOString().split("T")[0]
        : "NoDate";

      sessionAverages.push({
        date: dateStr,
        avgBatSpeed: avgBat,
        avgHandSpeed: avgHand,
      });
    }

    // Compute global max
    const maxBatSpeed = allBatSpeeds.length > 0 ? Math.max(...allBatSpeeds) : 0;
    const maxHandSpeed =
      allHandSpeeds.length > 0 ? Math.max(...allHandSpeeds) : 0;

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      sessionAverages, // e.g. [{ date, avgBatSpeed, avgHandSpeed }, ...]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
