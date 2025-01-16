import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Trackman from "@/models/trackman";

export async function GET(req: NextRequest, context: any) {
  try {
    await connectDB();

    const athleteId = context.params.athleteId;

    // Fetch all Trackman data for the athlete
    const sessions = await Trackman.find({ athlete: athleteId });

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

    sessions.forEach((session) => {
      if (session.pitchType && session.pitchReleaseSpeed) {
        session.pitchType.forEach((type: string, idx: number) => {
          const speed = session.pitchReleaseSpeed[idx] || 0;

          // Calculate peak velocity for each pitch type
          if (!pitchStats[type] || pitchStats[type] < speed) {
            pitchStats[type] = speed;
          }

          // Prepare average velocity over time by pitch type
          const date = new Date(session.sessionId || Date.now())
            .toISOString()
            .split("T")[0]; // Replace with actual session date if available

          if (!avgPitchSpeedsByType[date]) {
            avgPitchSpeedsByType[date] = {};
          }

          if (!avgPitchSpeedsByType[date][type]) {
            avgPitchSpeedsByType[date][type] = [];
          }

          avgPitchSpeedsByType[date][type].push(speed);
        });
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

    return NextResponse.json({
      pitchStats: formattedPitchStats,
      avgPitchSpeeds,
    });
  } catch (error: any) {
    console.error("Error fetching Trackman data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
