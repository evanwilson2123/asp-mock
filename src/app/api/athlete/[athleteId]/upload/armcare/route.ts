import { NextRequest, NextResponse } from "next/server";
import csvParser from "csv-parser";
import { Readable } from "stream";
import prisma from "@/lib/prismaDb";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

/**
 * parseDate: If invalid or blank, returns null.
 */
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d;
}

/**
 * parseNum: If invalid or blank, returns null.
 */
function parseNum(value: string | undefined): number | null {
  if (!value) return null;
  const n = parseFloat(value.trim());
  return isNaN(n) ? null : n;
}

/**
 * parseStr: If blank or missing, returns null.
 */
function parseStr(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export async function POST(req: NextRequest, context: any) {
  const { userId } = await auth();
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: "Athlete ID missing" }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }

  try {
    const sessionId = randomUUID(); // Generate a unique session ID

    // 1) Pull the CSV File from form data
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
        { error: "'file' is string, not a File" },
        { status: 400 }
      );
    }

    // 2) Convert file to stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    // 3) Set up csv-parser with mapHeaders to match your CSV column names to database fields
    const parseStream = fileStream.pipe(
      csvParser({
        mapHeaders: ({ header }) => {
          // Add all column mappings here
          switch (header.trim()) {
            case "Athlete ID":
              return "athlete";
            case "Exam Date":
              return "examDate";
            case "Email":
              return "email";
            case "ArmCare ID":
              return "armCareId";
            case "Last Name":
              return "lastName";
            case "First Name":
              return "firstName";
            case "Gender":
              return "gender";
            case "DOB":
              return "dob";
            case "Height (ft)":
              return "heightFt";
            case "Height (in)":
              return "heightIn";
            case "Weight (lbs)":
              return "weightLbs";
            case "Country":
              return "country";
            case "State/Prov":
              return "stateProv";
            case "Position 1":
              return "position1";
            case "Position 2":
              return "position2";
            case "Position 3":
              return "position3";
            case "Position 4":
              return "position4";
            case "Position 5":
              return "position5";
            case "Playing Level":
              return "playingLevel";
            case "Throws":
              return "throws";
            case "Bats":
              return "bats";
            case "Surgery":
              return "surgery";
            case "Time":
              return "time";
            case "Timezone":
              return "timezone";
            case "Exam Type":
              return "examType";
            case "Arm Score":
              return "armScore";
            case "Total Strength":
              return "totalStrength";
            case "IRTARM Strength":
              return "irtarmStrength";
            case "IRTARM RS":
              return "irtarmRs";
            case "IRTARM Recovery":
              return "irtarmRecovery";
            case "ERTARM Strength":
              return "ertarmStrength";
            case "ERTARM RS":
              return "ertarmRs";
            case "ERTARM Recovery":
              return "ertarmRecovery";
            case "STARM Strength":
              return "starmStrength";
            case "STARM RS":
              return "starmRs";
            case "STARM Recovery":
              return "starmRecovery";
            case "GTARM Strength":
              return "gtarmStrength";
            case "GTARM RS":
              return "gtarmRs";
            case "GTARM Recovery":
              return "gtarmRecovery";
            case "Shoulder Balance":
              return "shoulderBalance";
            case "Velo":
              return "velo";
            case "SVR":
              return "svr";
            case "IRTARM Peak Force-Lbs 1":
              return "irtarmPeakForceLbs1";
            case "IRTARM Peak Force-Lbs 2":
              return "irtarmPeakForceLbs2";
            case "IRTARM Peak Force-Lbs 3":
              return "irtarmPeakForceLbs3";
            case "IRTARM Max-Lbs":
              return "irtarmMaxLbs";
            // Add other cases as necessary
            default:
              return null; // Ignore unrecognized headers
          }
        },
      })
    );

    // 4) Loop over each parsed row and save to Prisma
    for await (const row of parseStream) {
      await prisma.armCare.create({
        data: {
          sessionId,
          athlete: athleteId,
          examDate: parseDate(row["examDate"]),
          email: parseStr(row["email"]),
          armCareId: parseStr(row["armCareId"]),
          lastName: parseStr(row["lastName"]),
          firstName: parseStr(row["firstName"]),
          gender: parseStr(row["gender"]),
          dob: parseDate(row["dob"]),
          heightFt: parseNum(row["heightFt"]),
          heightIn: parseNum(row["heightIn"]),
          weightLbs: parseNum(row["weightLbs"]),
          country: parseStr(row["country"]),
          stateProv: parseStr(row["stateProv"]),
          position1: parseStr(row["position1"]),
          position2: parseStr(row["position2"]),
          position3: parseStr(row["position3"]),
          position4: parseStr(row["position4"]),
          position5: parseStr(row["position5"]),
          playingLevel: parseStr(row["playingLevel"]),
          throws: parseStr(row["throws"]),
          bats: parseStr(row["bats"]),
          surgery: parseStr(row["surgery"]),
          time: parseStr(row["time"]),
          timezone: parseStr(row["timezone"]),
          examType: parseStr(row["examType"]),
          armScore: parseNum(row["armScore"]),
          totalStrength: parseNum(row["totalStrength"]),
          irtarmStrength: parseNum(row["irtarmStrength"]),
          irtarmRs: parseNum(row["irtarmRs"]),
          irtarmRecovery: parseStr(row["irtarmRecovery"]),
          ertarmStrength: parseNum(row["ertarmStrength"]),
          ertarmRs: parseNum(row["ertarmRs"]),
          ertarmRecovery: parseStr(row["ertarmRecovery"]),
          starmStrength: parseNum(row["starmStrength"]),
          starmRs: parseNum(row["starmRs"]),
          starmRecovery: parseStr(row["starmRecovery"]),
          gtarmStrength: parseNum(row["gtarmStrength"]),
          gtarmRs: parseNum(row["gtarmRs"]),
          gtarmRecovery: parseStr(row["gtarmRecovery"]),
          shoulderBalance: parseNum(row["shoulderBalance"]),
          velo: parseNum(row["velo"]),
          svr: parseNum(row["svr"]),
        },
      });
    }

    return NextResponse.json({
      message: "ArmCare CSV uploaded successfully.",
      sessionId,
    });
  } catch (err: any) {
    console.error("ArmCare CSV upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload ArmCare data", details: err.message },
      { status: 500 }
    );
  }
}
