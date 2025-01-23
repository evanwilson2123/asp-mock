import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest) {
  // 1) Parse the query param (?level=)
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") || "High School";

  try {
    // 2) Fetch all Trackman rows matching that level
    //    sorted from newest to oldest
    const data = await prisma.trackman.findMany({
      where: { playLevel: level },
      orderBy: { createdAt: "desc" },
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No Trackman data found for level: ${level}` },
        { status: 404 }
      );
    }

    // 3) Build pitchStats (peak speed by pitchType)
    //    Example: "Fastball" -> highest pitchReleaseSpeed
    const pitchStats: Record<string, number> = {};

    // 4) We'll store each record as its own data point
    //    with pitchType, avgSpeed, date (from createdAt)
    //    (Though it won't be a real "average" if each row is a single pitch;
    //    if you want to group by day or session, see the grouping example.)
    const allDataPoints: {
      pitchType: string;
      avgSpeed: number;
      date: string; // we'll store ISO string
    }[] = [];

    // 5) Iterate each row
    data.forEach((record) => {
      const pitchType = record.pitchType || "Unknown";
      const pitchSpeed = record.pitchReleaseSpeed || 0;

      // Calculate peak speed
      if (pitchStats[pitchType] == null) {
        pitchStats[pitchType] = pitchSpeed;
      } else {
        pitchStats[pitchType] = Math.max(pitchStats[pitchType], pitchSpeed);
      }

      // Create one data point per row
      allDataPoints.push({
        pitchType,
        avgSpeed: pitchSpeed,
        // Convert createdAt from Date to an ISO string
        date: record.createdAt.toISOString(),
      });
    });

    // 6) Format pitchStats for the response
    const formattedPitchStats = Object.entries(pitchStats).map(
      ([pitchType, peakSpeed]) => ({ pitchType, peakSpeed })
    );

    // 7) Return JSON with "avgPitchSpeeds" containing .date
    return NextResponse.json({
      pitchStats: formattedPitchStats,
      // Each record => { pitchType, avgSpeed, date }
      avgPitchSpeeds: allDataPoints,
    });
  } catch (error: any) {
    console.error("Error fetching Trackman data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Trackman data." },
      { status: 500 }
    );
  }
}
