import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

  const athleteId = context.params.athleteId;

  if (!athleteId) {
    return NextResponse.json(
      { error: "Athlete ID is missing" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const athlete = await Athlete.findById(athleteId);

    if (!athlete) {
      return NextResponse.json({ error: "Athlete Not Found" }, { status: 404 });
    }
    if (!athlete.trackman) {
      athlete.trackman = [];
    }

    const sessionId = crypto.randomUUID();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "'file' is invalid or missing" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    const trackmanRows = [];
    const parseStream = fileStream.pipe(
      csvParser({
        headers: [
          "pitchReleaseSpeed",
          "pitchType",
          "pitcherName",
          "releaseHeight",
          "releaseSide",
          "extension",
          "tilt",
          "measuredTilt",
          "gyro",
          "spinEfficiency",
          "inducedVerticalBreak",
          "horizontalBreak",
          "verticalApproachAngle",
          "horizontalApproachAngle",
          "locationHeight",
          "locationSide",
          "zoneLocation",
          "spinRate",
        ],
        skipLines: 0,
      })
    );

    for await (const row of parseStream) {
      const pitchReleaseSpeed = parseFloat(row["pitchReleaseSpeed"]) || 0;

      // Skip rows with invalid pitchReleaseSpeed
      if (pitchReleaseSpeed === 0) {
        continue;
      }

      trackmanRows.push({
        sessionId,
        athleteId,
        pitchReleaseSpeed,
        pitchType: row["pitchType"]?.trim() || null,
        pitcherName: row["pitcherName"]?.trim() || null,
        releaseHeight: parseFloat(row["releaseHeight"]) || null,
        releaseSide: parseFloat(row["releaseSide"]) || null,
        extension: parseFloat(row["extension"]) || null,
        tilt: row["tilt"]?.trim() || null,
        measuredTilt: row["measuredTilt"]?.trim() || null,
        gyro: parseFloat(row["gyro"]) || null,
        spinEfficiency: parseFloat(row["spinEfficiency"]) || null,
        inducedVerticalBreak: parseFloat(row["inducedVerticalBreak"]) || null,
        horizontalBreak: parseFloat(row["horizontalBreak"]) || null,
        verticalApproachAngle: parseFloat(row["verticalApproachAngle"]) || null,
        horizontalApproachAngle:
          parseFloat(row["horizontalApproachAngle"]) || null,
        locationHeight: parseFloat(row["locationHeight"]) || null,
        locationSide: parseFloat(row["locationSide"]) || null,
        zoneLocation: row["zoneLocation"]?.trim() || null,
        spinRate: parseFloat(row["spinRate"]) || null,
      });
    }

    // Save rows to Prisma
    const savedData = await prisma.trackman.createMany({
      data: trackmanRows,
    });

    athlete.trackman.push(sessionId);
    await athlete.save();

    return NextResponse.json({
      message: "Trackman data uploaded successfully",
      savedRecords: savedData.count,
    });
  } catch (error: any) {
    console.error("Error uploading Trackman data:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: error.message },
      { status: 500 }
    );
  }
}
