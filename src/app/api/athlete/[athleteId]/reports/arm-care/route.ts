import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaDb";
import { auth } from "@clerk/nextjs/server";

/**
 * GET handler:
 *  - Fetches all ArmCare records for the given athlete (desc by examDate).
 *  - Uses the latest record's `weightLbs` as the bodyWeight.
 *  - Groups data by sessionId to compute avg `armScore` per session.
 *  - Finds global max for IR/ER/Scaption & ROM.
 *  - Finds latest IR/ER/Scaption & ROM (plus shoulderFlexion ftarmRom).
 *  - Returns session arrays for chart data & navigation.
 */
export async function GET(req: NextRequest, context: any) {
  // 1) Validate auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "AUTH FAILED" }, { status: 400 });
  }

  // 2) athleteId from params
  const athleteId = context.params.athleteId;
  if (!athleteId) {
    return NextResponse.json({ error: "Missing athleteId" }, { status: 400 });
  }

  try {
    // 3) Get ArmCare records
    const records = await prisma.armCare.findMany({
      where: { athlete: athleteId },
      orderBy: { examDate: "desc" },
    });
    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "No arm care data found for this athlete" },
        { status: 404 }
      );
    }

    // The newest (latest) record
    const latestRecord = records[0];

    // 4) We'll use the latest record's weightLbs as the bodyWeight
    const bodyWeight = latestRecord.weightLbs ?? 0;

    // 5) Prepare to compute session averages
    const sessionsMap: Record<
      string,
      {
        sessionId: string;
        date: string;
        armScores: number[];
      }
    > = {};

    // Arrays to track global max
    const allIrStrength: number[] = [];
    const allErStrength: number[] = [];
    const allScapStrength: number[] = [];
    const allIrRom: number[] = [];
    const allErRom: number[] = [];
    const allShoulderFlexion: number[] = [];

    for (const record of records) {
      const { sessionId } = record;
      const dateString = record.examDate
        ? record.examDate.toISOString().split("T")[0]
        : "N/A";

      // Group by session
      if (!sessionsMap[sessionId]) {
        sessionsMap[sessionId] = {
          sessionId,
          date: dateString,
          armScores: [],
        };
      }
      if (record.armScore != null) {
        sessionsMap[sessionId].armScores.push(record.armScore);
      }

      // Strength
      if (record.irtarmStrength != null) {
        allIrStrength.push(record.irtarmStrength);
      }
      if (record.ertarmStrength != null) {
        allErStrength.push(record.ertarmStrength);
      }
      if (record.starmStrength != null) {
        allScapStrength.push(record.starmStrength);
      }

      // ROM
      if (record.irtarmRom != null) {
        allIrRom.push(record.irtarmRom);
      }
      if (record.ertarmRom != null) {
        allErRom.push(record.ertarmRom);
      }
      if (record.ftarmRom != null) {
        allShoulderFlexion.push(record.ftarmRom);
      }
    }

    // 6) Session Averages
    const sessionAverages = Object.values(sessionsMap).map((session) => {
      const { sessionId, date, armScores } = session;
      const avgArmScore =
        armScores.reduce((acc, v) => acc + v, 0) / (armScores.length || 1);

      return { sessionId, date, armScore: avgArmScore };
    });

    // 7) Global max
    const maxInternal = allIrStrength.length ? Math.max(...allIrStrength) : 0;
    const maxExternal = allErStrength.length ? Math.max(...allErStrength) : 0;
    const maxScaption = allScapStrength.length
      ? Math.max(...allScapStrength)
      : 0;

    const internalRom = allIrRom.length ? Math.max(...allIrRom) : 0;
    const externalRom = allErRom.length ? Math.max(...allErRom) : 0;
    const maxShoulderFlexion = allShoulderFlexion.length
      ? Math.max(...allShoulderFlexion)
      : 0;

    // 8) Latest
    const latestInternal = latestRecord.irtarmStrength ?? 0;
    const latestExternal = latestRecord.ertarmStrength ?? 0;
    const latestScaption = latestRecord.starmStrength ?? 0;

    const latestInternalRom = latestRecord.irtarmRom ?? 0;
    const latestExternalRom = latestRecord.ertarmRom ?? 0;
    const latestShoulderFlexion = latestRecord.ftarmRom ?? 0;

    // Return everything
    return NextResponse.json({
      // Body weight from the latest record
      bodyWeight,

      // Global max
      maxInternal,
      maxExternal,
      maxScaption,
      internalRom,
      externalRom,
      maxShoulderFlexion,

      // Latest
      latestInternal,
      latestExternal,
      latestScaption,
      latestInternalRom,
      latestExternalRom,
      latestShoulderFlexion,

      // Chart data
      sessionAverages,
      sessions: sessionAverages.map(({ sessionId, date }) => ({
        sessionId,
        date,
      })),
    });
  } catch (error: any) {
    console.error("[ArmCare GET]: Error fetching ArmCare data:", error);
    return NextResponse.json(
      { error: "Failed to fetch ArmCare data", details: error.message },
      { status: 500 }
    );
  }
}
