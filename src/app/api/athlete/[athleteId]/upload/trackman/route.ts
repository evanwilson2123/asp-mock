import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";
import crypto from "crypto";

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
          "pitch_release_speed_imp",
          "Pitch Type",
          "Pitcher Name",
          "Release Height (ft)",
          "Release Side (ft)",
          "Extension (ft)",
          "Tilt",
          "Measured Tilt",
          "Gyro (°)",
          "Spin Efficiency (%)",
          "Induced Vertical Break (in)",
          "Horizontal Break (in)",
          "Vertical Approach Angle (°)",
          "Horizontal Approach Angle (°)",
          "Location Height (ft)",
          "Location Side (ft)",
          "Zone Location",
          "session_id",
          "Spin rate (rpm)",
        ],
        skipLines: 0,
      })
    );

    for await (const row of parseStream) {
      const pitchReleaseSpeed = parseFloat(row["pitch_release_speed_imp"]) || 0;

      // Skip rows with invalid pitchReleaseSpeed
      if (pitchReleaseSpeed === 0) {
        continue;
      }

      // Parse spinRate and log for debugging
      const spinRateRaw = row["Spin rate (rpm)"];
      const spinRate = spinRateRaw
        ? parseFloat(spinRateRaw.replace(/,/g, "").trim()) || null
        : null;

      console.log("Row data:", row); // Log the full row for debugging
      console.log("Parsed Spin Rate:", spinRate); // Log parsed spin rate

      trackmanRows.push({
        sessionId,
        athleteId,
        pitchReleaseSpeed,
        pitchType: row["Pitch Type"]?.trim() || null,
        pitcherName: row["Pitcher Name"]?.trim() || null,
        releaseHeight: parseFloat(row["Release Height (ft)"]) || null,
        releaseSide: parseFloat(row["Release Side (ft)"]) || null,
        extension: parseFloat(row["Extension (ft)"]) || null,
        tilt: row["Tilt"]?.trim() || null,
        measuredTilt: row["Measured Tilt"]?.trim() || null,
        gyro: parseFloat(row["Gyro (°)"]) || null,
        spinEfficiency: parseFloat(row["Spin Efficiency (%)"]) || null,
        inducedVerticalBreak:
          parseFloat(row["Induced Vertical Break (in)"]) || null,
        horizontalBreak: parseFloat(row["Horizontal Break (in)"]) || null,
        verticalApproachAngle:
          parseFloat(row["Vertical Approach Angle (°)"]) || null,
        horizontalApproachAngle:
          parseFloat(row["Horizontal Approach Angle (°)"]) || null,
        locationHeight: parseFloat(row["Location Height (ft)"]) || null,
        locationSide: parseFloat(row["Location Side (ft)"]) || null,
        zoneLocation: row["Zone Location"]?.trim() || null,
        spinRate,
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
