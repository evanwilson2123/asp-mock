import { NextRequest, NextResponse } from "next/server";
import csvParser from "csv-parser";
import { Readable } from "stream";
import HitTrax from "@/models/hittrax"; // Adjust path if needed
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// This shape matches what your Mongoose schema requires
type AggregatedData = {
  athlete: string;
  AB: number[];
  date: string[];
  timestamp: string[];
  pitch: number[]; // numeric array
  strikeZone: string[];
  pType: string[];
  velo: number[];
  LA: number[];
  dist: number[];
  res: string[];
  type: string[];
  horizAngle: number[];
  pts: number[];
  strikeZoneBottom: number[];
  strikeZoneTop: number[];
  strikeZoneWidth: number[];
  verticalDistance: number[];
  horizontalDistance: number[];
  POIX: number[];
  POIY: number[];
  POIZ: number[];
  sprayChartX: number[];
  sprayChartZ: number[];
  fieldedX: number[];
  fieldedZ: number[];
  batMaterial: string[];
  user: string[];
  pitchAngle: number[];
  batting: string[];
  level: string[];
  opposingPlayer: string[];
  tag: string[];
};

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }
  try {
    const athleteId = context.params.athleteId;

    if (!athleteId) {
      return NextResponse.json(
        { error: "Athlete ID is missing" },
        { status: 400 }
      );
    }

    await connectDB(); // Make sure your Mongo connection logic works

    // Prepare aggregator with arrays matching your Mongoose schema
    const aggregatedData: AggregatedData = {
      athlete: athleteId,
      AB: [],
      date: [],
      timestamp: [],
      pitch: [],
      strikeZone: [],
      pType: [],
      velo: [],
      LA: [],
      dist: [],
      res: [],
      type: [],
      horizAngle: [],
      pts: [],
      strikeZoneBottom: [],
      strikeZoneTop: [],
      strikeZoneWidth: [],
      verticalDistance: [],
      horizontalDistance: [],
      POIX: [],
      POIY: [],
      POIZ: [],
      sprayChartX: [],
      sprayChartZ: [],
      fieldedX: [],
      fieldedZ: [],
      batMaterial: [],
      user: [],
      pitchAngle: [],
      batting: [],
      level: [],
      opposingPlayer: [],
      tag: [],
    };

    // 1) Grab the file from multipart form
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json(
        { error: "No 'file' field found" },
        { status: 400 }
      );
    }
    if (typeof file === "string") {
      return NextResponse.json(
        { error: "'file' FormData entry is a string, not a File" },
        { status: 400 }
      );
    }

    // 2) Create a readable stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    // 3) Pipe into csv-parser, renaming headers exactly
    //    to match aggregator keys. (Case-sensitive!)
    const parseStream = fileStream.pipe(
      csvParser({
        mapHeaders: ({ header }) => {
          switch (header.trim()) {
            case "#":
              return null; // We ignore the "#" column
            case "AB":
              return "AB";
            case "Date":
              return "date";
            case "Time Stamp":
              return "timestamp";
            case "Pitch":
              return "pitch";
            case "Strike Zone":
              return "strikeZone";
            case "P. Type":
              return "pType";
            case "Velo":
              return "velo";
            case "LA":
              return "LA";
            case "Dist":
              return "dist";
            case "Res":
              return "res";
            case "Type":
              return "type";
            case "Horiz. Angle":
              return "horizAngle";
            case "Pts":
              return "pts";
            case "Strike Zone Bottom":
              return "strikeZoneBottom";
            case "Strike Zone Top":
              return "strikeZoneTop";
            case "Strike Zone Width":
              return "strikeZoneWidth";
            case "Vertical Distance":
              return "verticalDistance";
            case "Horizontal Distance":
              return "horizontalDistance";
            case "POI X":
              return "POIX";
            case "POI Y":
              return "POIY";
            case "POI Z":
              return "POIZ";
            case "Spray Chart X":
              return "sprayChartX";
            case "Spray Chart Z":
              return "sprayChartZ";
            case "Fielded X":
              return "fieldedX";
            case "Fielded Z":
              return "fieldedZ";
            case "Bat Material":
              return "batMaterial";
            case "User":
              return "user";
            case "Pitch Angle":
              return "pitchAngle";
            case "Batting":
              return "batting";
            case "Level":
              return "level";
            case "Opposing Player":
              return "opposingPlayer";
            case "Tag":
              return "tag";
            default:
              return header.trim(); // Or null if you want to ignore unknown columns
          }
        },
      })
    );

    // 4) Iterate each CSV row
    for await (const row of parseStream) {
      // AB -> parse integer
      aggregatedData.AB.push(parseInt(row["AB"] ?? "") || 0);

      // Date, TimeStamp -> strings
      aggregatedData.date.push(row["date"]?.trim() || "Unknown");
      aggregatedData.timestamp.push(row["timestamp"]?.trim() || "Unknown");

      // pitch, velo, dist, LA, etc. -> parse floats
      {
        const val = parseFloat(row["pitch"] ?? "");
        aggregatedData.pitch.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["velo"] ?? "");
        aggregatedData.velo.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["dist"] ?? "");
        aggregatedData.dist.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["LA"] ?? "");
        aggregatedData.LA.push(isNaN(val) ? 0 : val);
      }

      // strikeZone, pType, res, type -> strings
      aggregatedData.strikeZone.push(row["strikeZone"]?.trim() || "Unknown");
      aggregatedData.pType.push(row["pType"]?.trim() || "Unknown");
      aggregatedData.res.push(row["res"]?.trim() || "Unknown");
      aggregatedData.type.push(row["type"]?.trim() || "Unknown");

      // horizAngle, pts, etc. -> parse floats
      {
        const val = parseFloat(row["horizAngle"] ?? "");
        aggregatedData.horizAngle.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["pts"] ?? "");
        aggregatedData.pts.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["strikeZoneBottom"] ?? "");
        aggregatedData.strikeZoneBottom.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["strikeZoneTop"] ?? "");
        aggregatedData.strikeZoneTop.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["strikeZoneWidth"] ?? "");
        aggregatedData.strikeZoneWidth.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["verticalDistance"] ?? "");
        aggregatedData.verticalDistance.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["horizontalDistance"] ?? "");
        aggregatedData.horizontalDistance.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["POIX"] ?? "");
        aggregatedData.POIX.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["POIY"] ?? "");
        aggregatedData.POIY.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["POIZ"] ?? "");
        aggregatedData.POIZ.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["sprayChartX"] ?? "");
        aggregatedData.sprayChartX.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["sprayChartZ"] ?? "");
        aggregatedData.sprayChartZ.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["fieldedX"] ?? "");
        aggregatedData.fieldedX.push(isNaN(val) ? 0 : val);
      }
      {
        const val = parseFloat(row["fieldedZ"] ?? "");
        aggregatedData.fieldedZ.push(isNaN(val) ? 0 : val);
      }

      // batMaterial, user -> strings
      aggregatedData.batMaterial.push(row["batMaterial"]?.trim() || "Unknown");
      aggregatedData.user.push(row["user"]?.trim() || "Unknown");

      // pitchAngle -> numeric
      {
        const val = parseFloat(row["pitchAngle"] ?? "");
        aggregatedData.pitchAngle.push(isNaN(val) ? 0 : val);
      }

      // batting, level, opposingPlayer, tag -> strings
      aggregatedData.batting.push(row["batting"]?.trim() || "Unknown");
      aggregatedData.level.push(row["level"]?.trim() || "Unknown");
      aggregatedData.opposingPlayer.push(
        row["opposingPlayer"]?.trim() || "Unknown"
      );

      // Tag, if present
      if (row["tag"]) {
        aggregatedData.tag.push(row["tag"]?.trim() || "Unknown");
      } else {
        aggregatedData.tag.push("Unknown");
      }
    }

    // Finally, save aggregated data
    await HitTrax.create(aggregatedData);

    return NextResponse.json({
      message: "HitTrax session uploaded successfully",
    });
  } catch (error: any) {
    console.error("CSV upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload data", details: error.message },
      { status: 500 }
    );
  }
}
