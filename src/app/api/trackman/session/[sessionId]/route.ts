import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest, context: any) {
  const { sessionId } = context.params;

  try {
    // Fetch pitches for the given session ID
    const pitches = await prisma.trackman.findMany({
      where: { sessionId },
      select: {
        pitchReleaseSpeed: true,
        pitchType: true,
        spinRate: true,
        horizontalBreak: true,
        verticalApproachAngle: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!pitches || pitches.length === 0) {
      return NextResponse.json(
        { error: "No pitches found for this session." },
        { status: 404 }
      );
    }

    // Group data by pitch type
    const dataByPitchType: Record<
      string,
      {
        speeds: number[];
        spinRates: number[];
        horizontalBreaks: number[];
        verticalAngles: number[];
        timestamps: string[];
      }
    > = {};

    pitches.forEach((pitch) => {
      const pitchType = pitch.pitchType || "Unknown";

      if (!dataByPitchType[pitchType]) {
        dataByPitchType[pitchType] = {
          speeds: [],
          spinRates: [],
          horizontalBreaks: [],
          verticalAngles: [],
          timestamps: [],
        };
      }

      if (pitch.pitchReleaseSpeed) {
        dataByPitchType[pitchType].speeds.push(pitch.pitchReleaseSpeed);
      }

      if (pitch.spinRate) {
        dataByPitchType[pitchType].spinRates.push(pitch.spinRate);
      }

      if (pitch.horizontalBreak) {
        dataByPitchType[pitchType].horizontalBreaks.push(pitch.horizontalBreak);
      }

      if (pitch.verticalApproachAngle) {
        dataByPitchType[pitchType].verticalAngles.push(
          pitch.verticalApproachAngle
        );
      }

      if (pitch.createdAt) {
        dataByPitchType[pitchType].timestamps.push(
          new Date(pitch.createdAt).toISOString()
        );
      }
    });

    return NextResponse.json({ dataByPitchType });
  } catch (error: any) {
    console.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data", details: error.message },
      { status: 500 }
    );
  }
}
