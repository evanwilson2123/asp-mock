import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto"; // For generating the unique session ID
import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";

export async function POST(req: NextRequest, context: any) {
  const athleteId = context.params.athleteId;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

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
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    if (!athlete.blastMotion) {
      athlete.blastMotion = [];
    }

    const csvData: any[] = [];
    const sessionId = randomUUID(); // Generate a unique session ID
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileStream = Readable.from(buffer);
    const parseStream = fileStream.pipe(csvParser());

    console.log("Starting CSV Parsing...");

    for await (const row of parseStream) {
      // Skip rows that are headers, invalid, or where "Handedness" is null
      if (!row["_1"] || row["_1"] === "Equipment" || !row["_2"]) {
        console.log("Skipping invalid or header row:", row);
        continue;
      }

      csvData.push({
        sessionId, // Associate each row with the same session ID
        athlete: athleteId,
        date: new Date(), // Replace with a valid column if the date is in the CSV
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

    console.log("Finished CSV Parsing. Total Rows Parsed:", csvData.length);

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in the uploaded file" },
        { status: 400 }
      );
    }

    console.log("Inserting data into database...");
    await prisma.blastMotion.createMany({
      data: csvData,
    });

    console.log("Data insertion successful.");

    athlete.blastMotion.push(sessionId);

    await athlete.save();

    return NextResponse.json({
      message: "Blast Motion session uploaded successfully",
      sessionId, // Return the session ID for reference
    });
  } catch (error: any) {
    console.error("Error uploading data:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: error.message },
      { status: 500 }
    );
  }
}
