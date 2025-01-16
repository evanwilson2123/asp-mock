import { NextRequest, NextResponse } from "next/server";
import Trackman from "@/models/trackman";
import { connectDB } from "@/lib/db";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { auth } from "@clerk/nextjs/server";

// When querying for this data, filter rows where pitchReleaseSpeed !== 0
export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }
  const athleteId = context.params.athleteId;
  console.log("Athlete ID:", athleteId);

  // Validate input
  if (!athleteId) {
    console.error("Athlete ID is missing");
    return NextResponse.json(
      { error: "Athlete ID is missing" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    console.log("Connected to the database.");

    const aggregatedData = {
      athlete: athleteId,
      pitchReleaseSpeed: [] as number[],
      pitchType: [] as string[],
      pitcherName: [] as string[],
      releaseHeight: [] as number[],
      releaseSide: [] as number[],
      extension: [] as number[],
      tilt: [] as string[],
      measuredTilt: [] as string[],
      gyro: [] as number[],
      spinEfficiency: [] as number[],
      inducedVerticalBreak: [] as number[],
      horizontalBreak: [] as number[],
      verticalApproachAngle: [] as number[],
      horizontalApproachAngle: [] as number[],
      locationHeight: [] as number[],
      locationSide: [] as number[],
      zoneLocation: [] as string[],
      spinRate: [] as number[],
    };

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileStream = Readable.from(buffer);

    console.log("Starting CSV parsing...");
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
      // Skip invalid rows where pitchReleaseSpeed is 0 or missing
      const pitchReleaseSpeed = parseFloat(row["pitchReleaseSpeed"]) || 0;
      if (pitchReleaseSpeed === 0) {
        console.log("Skipping invalid row:", row);
        continue;
      }

      // Add valid data to the aggregated object
      aggregatedData.pitchReleaseSpeed.push(pitchReleaseSpeed);
      aggregatedData.pitchType.push(row["pitchType"]?.trim() || "Unknown");
      aggregatedData.pitcherName.push(row["pitcherName"]?.trim() || "Unknown");
      aggregatedData.releaseHeight.push(parseFloat(row["releaseHeight"]) || 0);
      aggregatedData.releaseSide.push(parseFloat(row["releaseSide"]) || 0);
      aggregatedData.extension.push(parseFloat(row["extension"]) || 0);
      aggregatedData.tilt.push(row["tilt"]?.trim() || "N/A");
      aggregatedData.measuredTilt.push(row["measuredTilt"]?.trim() || null);
      aggregatedData.gyro.push(parseFloat(row["gyro"]) || 0);
      aggregatedData.spinEfficiency.push(
        parseFloat(row["spinEfficiency"]) || 0
      );
      aggregatedData.inducedVerticalBreak.push(
        parseFloat(row["inducedVerticalBreak"]) || 0
      );
      aggregatedData.horizontalBreak.push(
        parseFloat(row["horizontalBreak"]) || 0
      );
      aggregatedData.verticalApproachAngle.push(
        parseFloat(row["verticalApproachAngle"]) || 0
      );
      aggregatedData.horizontalApproachAngle.push(
        parseFloat(row["horizontalApproachAngle"]) || 0
      );
      aggregatedData.locationHeight.push(
        parseFloat(row["locationHeight"]) || 0
      );
      aggregatedData.locationSide.push(parseFloat(row["locationSide"]) || 0);
      aggregatedData.zoneLocation.push(
        row["zoneLocation"]?.trim() || "Unknown"
      );
      aggregatedData.spinRate.push(parseFloat(row["spinRate"]) || 0);
    }

    console.log("CSV parsing completed. Saving aggregated data...");

    // Save the aggregated data to the database
    await Trackman.create(aggregatedData);
    console.log("Aggregated data saved successfully.");

    return NextResponse.json({
      message: "Trackman session uploaded successfully",
    });
  } catch (error: any) {
    console.error("Error during data upload:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: error.message },
      { status: 500 }
    );
  }
}
