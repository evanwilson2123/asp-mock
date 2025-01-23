import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") || "High School"; // Default to "High School"

  try {
    const data = await prisma.blastMotion.findMany({
      where: { playLevel: level },
      orderBy: { date: "desc" }, // Sort by date
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No BlastMotion data found for this level" },
        { status: 404 }
      );
    }

    // Group by session and calculate averages
    const sessions: Record<
      string,
      { batSpeeds: number[]; handSpeeds: number[]; date: string }
    > = {};

    data.forEach((record) => {
      const sessionId = record.sessionId;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          batSpeeds: [],
          handSpeeds: [],
          date: record.date.toISOString().split("T")[0],
        };
      }
      if (record.batSpeed) sessions[sessionId].batSpeeds.push(record.batSpeed);
      if (record.peakHandSpeed)
        sessions[sessionId].handSpeeds.push(record.peakHandSpeed);
    });

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const session = sessions[sessionId];
      return {
        sessionId,
        date: session.date,
        avgBatSpeed:
          session.batSpeeds.length > 0
            ? session.batSpeeds.reduce((a, b) => a + b, 0) /
              session.batSpeeds.length
            : 0,
        avgHandSpeed:
          session.handSpeeds.length > 0
            ? session.handSpeeds.reduce((a, b) => a + b, 0) /
              session.handSpeeds.length
            : 0,
      };
    });

    const maxBatSpeed = Math.max(...data.map((record) => record.batSpeed || 0));
    const maxHandSpeed = Math.max(
      ...data.map((record) => record.peakHandSpeed || 0)
    );

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      sessionAverages,
    });
  } catch (error: any) {
    console.error("Error fetching BlastMotion data:", error);
    return NextResponse.json(
      { error: "Failed to fetch BlastMotion data" },
      { status: 500 }
    );
  }
}
