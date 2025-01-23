import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") || "High School"; // Default to "High School"

  try {
    const data = await prisma.hitTrax.findMany({
      where: { playLevel: level },
      orderBy: { date: "desc" },
    });

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No HitTrax data found for this level" },
        { status: 404 }
      );
    }

    const sessions: Record<
      string,
      { velocities: number[]; distances: number[]; date: string }
    > = {};

    data.forEach((record) => {
      const sessionId = record.sessionId;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          velocities: [],
          distances: [],
          date: record.date || "No Date",
        };
      }
      if (record.velo) sessions[sessionId].velocities.push(record.velo);
      if (record.dist) sessions[sessionId].distances.push(record.dist);
    });

    const sessionAverages = Object.keys(sessions).map((sessionId) => {
      const session = sessions[sessionId];
      const avgExitVelo =
        session.velocities.reduce((a, b) => a + b, 0) /
        session.velocities.length;
      return {
        sessionId,
        date: session.date,
        avgExitVelo,
      };
    });

    const maxExitVelo = Math.max(...data.map((record) => record.velo || 0));
    const maxDistance = Math.max(...data.map((record) => record.dist || 0));
    const hardHitRate =
      data.filter((record) => (record.velo || 0) >= 95).length / data.length;

    return NextResponse.json({
      maxExitVelo,
      maxDistance,
      hardHitRate,
      sessionAverages,
    });
  } catch (error: any) {
    console.error("Error fetching HitTrax data:", error);
    return NextResponse.json(
      { error: "Failed to fetch HitTrax data" },
      { status: 500 }
    );
  }
}
