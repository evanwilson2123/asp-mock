import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest, context: any) {
  const athleteId = context.params.athleteId;

  try {
    // Fetch all Trackman data for the athlete
    const sessions = await prisma.trackman.findMany({
      where: { athleteId },
      orderBy: { createdAt: "asc" },
    });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: "No data found for this athlete." },
        { status: 404 }
      );
    }

    // Prepare peak velocity by pitch type
    const pitchStats: { [key: string]: number } = {};

    // Prepare average velocity over time by pitch type
    const avgPitchSpeedsByType: {
      [date: string]: { [pitchType: string]: number[] };
    } = {};

    // Collect sessions for navigation
    const sessionMap: Record<string, { sessionId: string; date: string }> = {};

    sessions.forEach((session) => {
      const { sessionId, pitchType, pitchReleaseSpeed, createdAt } = session;

      // Add sessionId and date for clickable sessions
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          sessionId,
          date: new Date(createdAt).toISOString().split("T")[0],
        };
      }

      if (pitchType && pitchReleaseSpeed) {
        const speed = pitchReleaseSpeed;

        // Calculate peak velocity for each pitch type
        if (!pitchStats[pitchType] || pitchStats[pitchType] < speed) {
          pitchStats[pitchType] = speed;
        }

        // Prepare average velocity over time by pitch type
        const date = new Date(createdAt).toISOString().split("T")[0];

        if (!avgPitchSpeedsByType[date]) {
          avgPitchSpeedsByType[date] = {};
        }

        if (!avgPitchSpeedsByType[date][pitchType]) {
          avgPitchSpeedsByType[date][pitchType] = [];
        }

        avgPitchSpeedsByType[date][pitchType].push(speed);
      }
    });

    // Format average pitch speeds data
    const avgPitchSpeeds = Object.entries(avgPitchSpeedsByType).flatMap(
      ([date, pitches]) =>
        Object.entries(pitches).map(([pitchType, speeds]) => ({
          date,
          pitchType,
          avgSpeed:
            speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length,
        }))
    );

    // Format pitch stats
    const formattedPitchStats = Object.entries(pitchStats).map(
      ([pitchType, peakSpeed]) => ({
        pitchType,
        peakSpeed,
      })
    );

    // Convert session map to array for clickable sessions
    const clickableSessions = Object.values(sessionMap);

    return NextResponse.json({
      pitchStats: formattedPitchStats,
      avgPitchSpeeds,
      sessions: clickableSessions, // List of clickable sessions
    });
  } catch (error: any) {
    console.error("Error fetching Trackman data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
