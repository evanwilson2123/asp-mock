import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";

export async function GET(req: NextRequest, context: any) {
  const { sessionId } = context.params;

  try {
    const pitches = await prisma.trackman.findMany({
      where: { sessionId },
      select: {
        pitchReleaseSpeed: true,
        pitchType: true,
        spinRate: true,
        horizontalBreak: true,
        inducedVerticalBreak: true,
        locationHeight: true,
        locationSide: true,
      },
    });

    if (!pitches || pitches.length === 0) {
      return NextResponse.json(
        { error: "No pitches found for this session." },
        { status: 404 }
      );
    }

    const dataByPitchType: Record<
      string,
      {
        speeds: number[];
        spinRates: number[];
        horizontalBreaks: number[];
        verticalBreaks: number[];
        locations: { x: number; y: number }[];
      }
    > = {};

    pitches.forEach((pitch) => {
      const pitchType = pitch.pitchType || "Unknown";

      if (!dataByPitchType[pitchType]) {
        dataByPitchType[pitchType] = {
          speeds: [],
          spinRates: [],
          horizontalBreaks: [],
          verticalBreaks: [],
          locations: [],
        };
      }

      if (pitch.pitchReleaseSpeed !== null) {
        dataByPitchType[pitchType].speeds.push(pitch.pitchReleaseSpeed);
      }

      if (pitch.spinRate !== null) {
        dataByPitchType[pitchType].spinRates.push(pitch.spinRate);
      }

      if (pitch.horizontalBreak !== null) {
        dataByPitchType[pitchType].horizontalBreaks.push(pitch.horizontalBreak);
      }

      if (pitch.inducedVerticalBreak !== null) {
        dataByPitchType[pitchType].verticalBreaks.push(
          pitch.inducedVerticalBreak
        );
      }

      if (pitch.locationHeight !== null && pitch.locationSide !== null) {
        dataByPitchType[pitchType].locations.push({
          x: pitch.locationSide,
          y: pitch.locationHeight,
        });
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
