import { NextRequest, NextResponse } from "next/server";
import BlastMotion from "@/models/blastMotion";
import { connectDB } from "@/lib/db";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest, context: any) {
  const athleteId = context.params.athleteId;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

  // Validate input
  if (!athleteId) {
    return NextResponse.json(
      { error: "Athlete ID is missing" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const csvData: any[] = [];
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileStream = Readable.from(buffer);
    const parseStream = fileStream.pipe(csvParser());

    // Parse CSV data
    for await (const row of parseStream) {
      // Filter out invalid rows for Blast Motion
      if (!row["_1"] || row["_1"] === "Equipment") continue;

      csvData.push({
        equipment: row["_1"]?.trim() || null,
        handedness: row["_2"]?.trim() || null,
        swingDetails: row["_3"]?.trim() || null,
        planeScore: parseFloat(row["_4"]) || null,
        connectionScore: parseFloat(row["_5"]) || null,
        rotationScore: parseFloat(row["_6"]) || null,
        batSpeed: parseFloat(row["_7"]) || null,
        rotationalAcceleration: parseFloat(row["_8"]) || null,
        onPlaneEfficiency: parseFloat(row["_9"]) || null,
        attackAngle: parseFloat(row["_10"]) || null,
        earlyConnection: parseFloat(row["_11"]) || null,
        connectionAtImpact: parseFloat(row["_12"]) || null,
        verticalBatAngle: parseFloat(row["_13"]) || null,
        power: parseFloat(row["_14"]) || null,
        timeToContact: parseFloat(row["_15"]) || null,
        peakHandSpeed: parseFloat(row["_16"]) || null,
      });
    }

    // If no valid data was parsed
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in the uploaded file" },
        { status: 400 }
      );
    }

    // Aggregate all rows into a single session
    const aggregatedData = {
      athlete: athleteId,
      date: new Date(),
      equipment: csvData.map((row) => row.equipment),
      handedness: csvData.map((row) => row.handedness),
      swingDetails: csvData.map((row) => row.swingDetails),
      planeScore: csvData.map((row) => row.planeScore),
      connectionScore: csvData.map((row) => row.connectionScore),
      rotationScore: csvData.map((row) => row.rotationScore),
      batSpeed: csvData.map((row) => row.batSpeed),
      rotationalAcceleration: csvData.map((row) => row.rotationalAcceleration),
      onPlaneEfficiency: csvData.map((row) => row.onPlaneEfficiency),
      attackAngle: csvData.map((row) => row.attackAngle),
      earlyConnection: csvData.map((row) => row.earlyConnection),
      connectionAtImpact: csvData.map((row) => row.connectionAtImpact),
      verticalBatAngle: csvData.map((row) => row.verticalBatAngle),
      power: csvData.map((row) => row.power),
      timeToContact: csvData.map((row) => row.timeToContact),
      peakHandSpeed: csvData.map((row) => row.peakHandSpeed),
    };

    // Save to database
    await BlastMotion.create(aggregatedData);

    return NextResponse.json({
      message: "Blast Motion session uploaded successfully",
    });
  } catch (error: any) {
    console.error("Error uploading data:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: error.message },
      { status: 500 }
    );
  }
}
