import { NextRequest, NextResponse } from "next/server";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { connectDB } from "@/lib/db";
import ArmCare from "@/models/armcare";
import { auth } from "@clerk/nextjs/server";

/**
 * parseDate: If invalid or blank, returns new Date(0).
 */
function parseDate(value: string | undefined): Date {
  if (!value) return new Date(0);
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * parseNum: If invalid or blank, returns 0.
 */
function parseNum(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value.trim());
  return isNaN(n) ? 0 : n;
}

/**
 * parseStr: If blank or missing, returns empty string.
 */
function parseStr(value: string | undefined): string {
  return value?.trim() || "";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 400 });
  }
  try {
    await connectDB();

    // 1) Build an aggregator with arrays for EVERY field in the model
    const aggregatedData = {
      examDate: [] as Date[],
      email: [] as string[],
      armCareId: [] as string[],
      lastName: [] as string[],
      firstName: [] as string[],
      gender: [] as string[],
      dob: [] as Date[],
      heightFt: [] as number[],
      heightIn: [] as number[],
      weightLbs: [] as number[],
      country: [] as string[],
      stateProv: [] as string[],
      position1: [] as string[],
      position2: [] as string[],
      position3: [] as string[],
      position4: [] as string[],
      position5: [] as string[],
      playingLevel: [] as string[],
      throws: [] as string[],
      bats: [] as string[],
      surgery: [] as string[],
      time: [] as string[],
      timezone: [] as string[],
      examType: [] as string[],
      armScore: [] as number[],
      totalStrength: [] as number[],
      irtarmStrength: [] as number[],
      irtarmRs: [] as number[],
      irtarmRecovery: [] as string[],
      ertarmStrength: [] as number[],
      ertarmRs: [] as number[],
      ertarmRecovery: [] as string[],
      starmStrength: [] as number[],
      starmRs: [] as number[],
      starmRecovery: [] as string[],
      gtarmStrength: [] as number[],
      gtarmRs: [] as number[],
      gtarmRecovery: [] as string[],
      shoulderBalance: [] as number[],
      velo: [] as number[],
      svr: [] as number[],
      totalStrengthPost: [] as number[],
      postStrengthLoss: [] as number[],
      totalPctFresh: [] as number[],
      irtarmPostStrength: [] as number[],
      irtarmPostLoss: [] as number[],
      irtarmPctFresh: [] as number[],
      ertarmPostStrength: [] as number[],
      ertarmPostLoss: [] as number[],
      ertarmPctFresh: [] as number[],
      starmPostStrength: [] as number[],
      starmPostLoss: [] as number[],
      starmPctFresh: [] as number[],
      gtarmPostStrength: [] as number[],
      gtarmPostLoss: [] as number[],
      gtarmPctFresh: [] as number[],
      irtarmPeakForceLbs1: [] as number[],
      irtarmPeakForceLbs2: [] as number[],
      irtarmPeakForceLbs3: [] as number[],
      irtarmMaxLbs: [] as number[],
      irntarmPeakForceLbs1: [] as number[],
      irntarmPeakForceLbs2: [] as number[],
      irntarmPeakForceLbs3: [] as number[],
      irntarmMaxLbs: [] as number[],
      ertarmPeakForceLbs1: [] as number[],
      ertarmPeakForceLbs2: [] as number[],
      ertarmPeakForceLbs3: [] as number[],
      ertarmMaxLbs: [] as number[],
      erntarmPeakForceLbs1: [] as number[],
      erntarmPeakForceLbs2: [] as number[],
      erntarmPeakForceLbs3: [] as number[],
      erntarmMaxLbs: [] as number[],
      starmPeakForceLbs1: [] as number[],
      starmPeakForceLbs2: [] as number[],
      starmPeakForceLbs3: [] as number[],
      starmMaxLbs: [] as number[],
      sntarmPeakForceLbs1: [] as number[],
      sntarmPeakForceLbs2: [] as number[],
      sntarmPeakForceLbs3: [] as number[],
      sntarmMaxLbs: [] as number[],
      gtarmPeakForceLbs1: [] as number[],
      gtarmPeakForceLbs2: [] as number[],
      gtarmPeakForceLbs3: [] as number[],
      gtarmMaxLbs: [] as number[],
      gntarmPeakForceLbs1: [] as number[],
      gntarmPeakForceLbs2: [] as number[],
      gntarmPeakForceLbs3: [] as number[],
      gntarmMaxLbs: [] as number[],
      accelPeakForceLbs1: [] as number[],
      accelPeakForceLbs2: [] as number[],
      accelPeakForceLbs3: [] as number[],
      accelMaxLbs: [] as number[],
      decelPeakForceLbs1: [] as number[],
      decelPeakForceLbs2: [] as number[],
      decelPeakForceLbs3: [] as number[],
      decelMaxLbs: [] as number[],
      totalPrimerMaxLbs: [] as number[],
      irtarmRom: [] as number[],
      irntarmRom: [] as number[],
      ertarmRom: [] as number[],
      erntarmRom: [] as number[],
      tarmTarc: [] as number[],
      ntarmTarc: [] as number[],
      ftarmRom: [] as number[],
      fntarmRom: [] as number[],
      freshLastOuting: [] as string[],
      freshThrewToday: [] as string[],
      freshRpe: [] as number[],
      freshArmFeels: [] as string[],
      freshLocation: [] as string[],
      freshWarmedUp: [] as string[],
      postThrewToday: [] as string[],
      postThrowingActivity: [] as string[],
      postThrowingTime: [] as string[],
      postPitchCount: [] as number[],
      postHighIntentThrows: [] as number[],
      postRpe: [] as number[],
    };

    // 2) Pull the CSV File from form data
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

    // 3) Convert file to stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    // 4) Set up csv-parser with mapHeaders to match your CSV column names to aggregator keys
    const parseStream = fileStream.pipe(
      csvParser({
        // If your CSV is tab-delimited, use { separator: '\t', ... }
        mapHeaders: ({ header }) => {
          switch (header.trim()) {
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
            case "Total Strength Post":
              return "totalStrengthPost";
            case "Post Strength Loss":
              return "postStrengthLoss";
            case "Total %Fresh":
              return "totalPctFresh";
            case "IRTARM Post Strength":
              return "irtarmPostStrength";
            case "IRTARM Post Loss":
              return "irtarmPostLoss";
            case "IRTARM %Fresh":
              return "irtarmPctFresh";
            case "ERTARM Post Strength":
              return "ertarmPostStrength";
            case "ERTARM Post Loss":
              return "ertarmPostLoss";
            case "ERTARM %Fresh":
              return "ertarmPctFresh";
            case "STARM Post Strength":
              return "starmPostStrength";
            case "STARM Post Loss":
              return "starmPostLoss";
            case "STARM %Fresh":
              return "starmPctFresh";
            case "GTARM Post Strength":
              return "gtarmPostStrength";
            case "GTARM Post Loss":
              return "gtarmPostLoss";
            case "GTARM %Fresh":
              return "gtarmPctFresh";
            case "IRTARM Peak Force-Lbs 1":
              return "irtarmPeakForceLbs1";
            case "IRTARM Peak Force-Lbs 2":
              return "irtarmPeakForceLbs2";
            case "IRTARM Peak Force-Lbs 3":
              return "irtarmPeakForceLbs3";
            case "IRTARM Max-Lbs":
              return "irtarmMaxLbs";
            case "IRNTARM Peak Force-Lbs 1":
              return "irntarmPeakForceLbs1";
            case "IRNTARM Peak Force-Lbs 2":
              return "irntarmPeakForceLbs2";
            case "IRNTARM Peak Force-Lbs 3":
              return "irntarmPeakForceLbs3";
            case "IRNTARM Max-Lbs":
              return "irntarmMaxLbs";
            case "ERTARM Peak Force-Lbs 1":
              return "ertarmPeakForceLbs1";
            case "ERTARM Peak Force-Lbs 2":
              return "ertarmPeakForceLbs2";
            case "ERTARM Peak Force-Lbs 3":
              return "ertarmPeakForceLbs3";
            case "ERTARM Max-Lbs":
              return "ertarmMaxLbs";
            case "ERNTARM Peak Force-Lbs 1":
              return "erntarmPeakForceLbs1";
            case "ERNTARM Peak Force-Lbs 2":
              return "erntarmPeakForceLbs2";
            case "ERNTARM Peak Force-Lbs 3":
              return "erntarmPeakForceLbs3";
            case "ERNTARM Max-Lbs":
              return "erntarmMaxLbs";
            case "STARM Peak Force-Lbs 1":
              return "starmPeakForceLbs1";
            case "STARM Peak Force-Lbs 2":
              return "starmPeakForceLbs2";
            case "STARM Peak Force-Lbs 3":
              return "starmPeakForceLbs3";
            case "STARM Max-Lbs":
              return "starmMaxLbs";
            case "SNTARM Peak Force-Lbs 1":
              return "sntarmPeakForceLbs1";
            case "SNTARM Peak Force-Lbs 2":
              return "sntarmPeakForceLbs2";
            case "SNTARM Peak Force-Lbs 3":
              return "sntarmPeakForceLbs3";
            case "SNTARM Max-Lbs":
              return "sntarmMaxLbs";
            case "GTARM Peak Force-Lbs 1":
              return "gtarmPeakForceLbs1";
            case "GTARM Peak Force-Lbs 2":
              return "gtarmPeakForceLbs2";
            case "GTARM Peak Force-Lbs 3":
              return "gtarmPeakForceLbs3";
            case "GTARM Max-Lbs":
              return "gtarmMaxLbs";
            case "GNTARM Peak Force-Lbs 1":
              return "gntarmPeakForceLbs1";
            case "GNTARM Peak Force-Lbs 2":
              return "gntarmPeakForceLbs2";
            case "GNTARM Peak Force-Lbs 3":
              return "gntarmPeakForceLbs3";
            case "GNTARM Max-Lbs":
              return "gntarmMaxLbs";
            case "Accel Peak Force-Lbs 1":
              return "accelPeakForceLbs1";
            case "Accel Peak Force-Lbs 2":
              return "accelPeakForceLbs2";
            case "Accel Peak Force-Lbs 3":
              return "accelPeakForceLbs3";
            case "Accel Max-Lbs":
              return "accelMaxLbs";
            case "Decel Peak Force-Lbs 1":
              return "decelPeakForceLbs1";
            case "Decel Peak Force-Lbs 2":
              return "decelPeakForceLbs2";
            case "Decel Peak Force-Lbs 3":
              return "decelPeakForceLbs3";
            case "Decel Max-Lbs":
              return "decelMaxLbs";
            case "Total Primer Max-Lbs":
              return "totalPrimerMaxLbs";
            case "IRTARM ROM":
              return "irtarmRom";
            case "IRNTARM ROM":
              return "irntarmRom";
            case "ERTARM ROM":
              return "ertarmRom";
            case "ERNTARM ROM":
              return "erntarmRom";
            case "TARM TARC":
              return "tarmTarc";
            case "NTARM TARC":
              return "ntarmTarc";
            case "FTARM ROM":
              return "ftarmRom";
            case "FNTARM ROM":
              return "fntarmRom";
            case "Fresh- Last Outing":
              return "freshLastOuting";
            case "Fresh- Threw Today":
              return "freshThrewToday";
            case "Fresh- RPE":
              return "freshRpe";
            case "Fresh- Arm Feels":
              return "freshArmFeels";
            case "Fresh- Location":
              return "freshLocation";
            case "Fresh- Warmed up":
              return "freshWarmedUp";
            case "Post- Threw Today":
              return "postThrewToday";
            case "Post- Throwing Activity":
              return "postThrowingActivity";
            case "Post- Throwing Time":
              return "postThrowingTime";
            case "Post- Pitch Count":
              return "postPitchCount";
            case "Post- High Intent Throws":
              return "postHighIntentThrows";
            case "Post-RPE":
              return "postRpe";
            default:
              // If unknown header, keep as-is or return null to ignore
              return header.trim();
          }
        },
      })
    );

    // 5) Loop over each parsed CSV row
    for await (const row of parseStream) {
      // For debugging, see what we get:
      console.log("Parsed row:", row);

      // Fill aggregator arrays:

      // Dates
      aggregatedData.examDate.push(parseDate(row["examDate"]));
      aggregatedData.dob.push(parseDate(row["dob"]));

      // Strings
      aggregatedData.email.push(parseStr(row["email"]));
      aggregatedData.armCareId.push(parseStr(row["armCareId"]));
      aggregatedData.lastName.push(parseStr(row["lastName"]));
      aggregatedData.firstName.push(parseStr(row["firstName"]));
      aggregatedData.gender.push(parseStr(row["gender"]));
      aggregatedData.country.push(parseStr(row["country"]));
      aggregatedData.stateProv.push(parseStr(row["stateProv"]));
      aggregatedData.position1.push(parseStr(row["position1"]));
      aggregatedData.position2.push(parseStr(row["position2"]));
      aggregatedData.position3.push(parseStr(row["position3"]));
      aggregatedData.position4.push(parseStr(row["position4"]));
      aggregatedData.position5.push(parseStr(row["position5"]));
      aggregatedData.playingLevel.push(parseStr(row["playingLevel"]));
      aggregatedData.throws.push(parseStr(row["throws"]));
      aggregatedData.bats.push(parseStr(row["bats"]));
      aggregatedData.surgery.push(parseStr(row["surgery"]));
      aggregatedData.time.push(parseStr(row["time"]));
      aggregatedData.timezone.push(parseStr(row["timezone"]));
      aggregatedData.examType.push(parseStr(row["examType"]));
      aggregatedData.irtarmRecovery.push(parseStr(row["irtarmRecovery"]));
      aggregatedData.ertarmRecovery.push(parseStr(row["ertarmRecovery"]));
      aggregatedData.starmRecovery.push(parseStr(row["starmRecovery"]));
      aggregatedData.gtarmRecovery.push(parseStr(row["gtarmRecovery"]));
      aggregatedData.freshLastOuting.push(parseStr(row["freshLastOuting"]));
      aggregatedData.freshThrewToday.push(parseStr(row["freshThrewToday"]));
      aggregatedData.freshArmFeels.push(parseStr(row["freshArmFeels"]));
      aggregatedData.freshLocation.push(parseStr(row["freshLocation"]));
      aggregatedData.freshWarmedUp.push(parseStr(row["freshWarmedUp"]));
      aggregatedData.postThrewToday.push(parseStr(row["postThrewToday"]));
      aggregatedData.postThrowingActivity.push(
        parseStr(row["postThrowingActivity"])
      );
      aggregatedData.postThrowingTime.push(parseStr(row["postThrowingTime"]));

      // Numbers
      aggregatedData.heightFt.push(parseNum(row["heightFt"]));
      aggregatedData.heightIn.push(parseNum(row["heightIn"]));
      aggregatedData.weightLbs.push(parseNum(row["weightLbs"]));
      aggregatedData.armScore.push(parseNum(row["armScore"]));
      aggregatedData.totalStrength.push(parseNum(row["totalStrength"]));
      aggregatedData.irtarmStrength.push(parseNum(row["irtarmStrength"]));
      aggregatedData.irtarmRs.push(parseNum(row["irtarmRs"]));
      aggregatedData.ertarmStrength.push(parseNum(row["ertarmStrength"]));
      aggregatedData.ertarmRs.push(parseNum(row["ertarmRs"]));
      aggregatedData.starmStrength.push(parseNum(row["starmStrength"]));
      aggregatedData.starmRs.push(parseNum(row["starmRs"]));
      aggregatedData.gtarmStrength.push(parseNum(row["gtarmStrength"]));
      aggregatedData.gtarmRs.push(parseNum(row["gtarmRs"]));
      aggregatedData.shoulderBalance.push(parseNum(row["shoulderBalance"]));
      aggregatedData.velo.push(parseNum(row["velo"]));
      aggregatedData.svr.push(parseNum(row["SVR"])); // watch case! If "SVR" not "svr"
      aggregatedData.totalStrengthPost.push(parseNum(row["totalStrengthPost"]));
      aggregatedData.postStrengthLoss.push(parseNum(row["postStrengthLoss"]));
      aggregatedData.totalPctFresh.push(parseNum(row["totalPctFresh"]));
      aggregatedData.irtarmPostStrength.push(
        parseNum(row["irtarmPostStrength"])
      );
      aggregatedData.irtarmPostLoss.push(parseNum(row["irtarmPostLoss"]));
      aggregatedData.irtarmPctFresh.push(parseNum(row["irtarmPctFresh"]));
      aggregatedData.ertarmPostStrength.push(
        parseNum(row["ertarmPostStrength"])
      );
      aggregatedData.ertarmPostLoss.push(parseNum(row["ertarmPostLoss"]));
      aggregatedData.ertarmPctFresh.push(parseNum(row["ertarmPctFresh"]));
      aggregatedData.starmPostStrength.push(parseNum(row["starmPostStrength"]));
      aggregatedData.starmPostLoss.push(parseNum(row["starmPostLoss"]));
      aggregatedData.starmPctFresh.push(parseNum(row["starmPctFresh"]));
      aggregatedData.gtarmPostStrength.push(parseNum(row["gtarmPostStrength"]));
      aggregatedData.gtarmPostLoss.push(parseNum(row["gtarmPostLoss"]));
      aggregatedData.gtarmPctFresh.push(parseNum(row["gtarmPctFresh"]));
      aggregatedData.irtarmPeakForceLbs1.push(
        parseNum(row["irtarmPeakForceLbs1"])
      );
      aggregatedData.irtarmPeakForceLbs2.push(
        parseNum(row["irtarmPeakForceLbs2"])
      );
      aggregatedData.irtarmPeakForceLbs3.push(
        parseNum(row["irtarmPeakForceLbs3"])
      );
      aggregatedData.irtarmMaxLbs.push(parseNum(row["irtarmMaxLbs"]));
      aggregatedData.irntarmPeakForceLbs1.push(
        parseNum(row["irntarmPeakForceLbs1"])
      );
      aggregatedData.irntarmPeakForceLbs2.push(
        parseNum(row["irntarmPeakForceLbs2"])
      );
      aggregatedData.irntarmPeakForceLbs3.push(
        parseNum(row["irntarmPeakForceLbs3"])
      );
      aggregatedData.irntarmMaxLbs.push(parseNum(row["irntarmMaxLbs"]));
      aggregatedData.ertarmPeakForceLbs1.push(
        parseNum(row["ertarmPeakForceLbs1"])
      );
      aggregatedData.ertarmPeakForceLbs2.push(
        parseNum(row["ertarmPeakForceLbs2"])
      );
      aggregatedData.ertarmPeakForceLbs3.push(
        parseNum(row["ertarmPeakForceLbs3"])
      );
      aggregatedData.ertarmMaxLbs.push(parseNum(row["ertarmMaxLbs"]));
      aggregatedData.erntarmPeakForceLbs1.push(
        parseNum(row["erntarmPeakForceLbs1"])
      );
      aggregatedData.erntarmPeakForceLbs2.push(
        parseNum(row["erntarmPeakForceLbs2"])
      );
      aggregatedData.erntarmPeakForceLbs3.push(
        parseNum(row["erntarmPeakForceLbs3"])
      );
      aggregatedData.erntarmMaxLbs.push(parseNum(row["erntarmMaxLbs"]));
      aggregatedData.starmPeakForceLbs1.push(
        parseNum(row["starmPeakForceLbs1"])
      );
      aggregatedData.starmPeakForceLbs2.push(
        parseNum(row["starmPeakForceLbs2"])
      );
      aggregatedData.starmPeakForceLbs3.push(
        parseNum(row["starmPeakForceLbs3"])
      );
      aggregatedData.starmMaxLbs.push(parseNum(row["starmMaxLbs"]));
      aggregatedData.sntarmPeakForceLbs1.push(
        parseNum(row["sntarmPeakForceLbs1"])
      );
      aggregatedData.sntarmPeakForceLbs2.push(
        parseNum(row["sntarmPeakForceLbs2"])
      );
      aggregatedData.sntarmPeakForceLbs3.push(
        parseNum(row["sntarmPeakForceLbs3"])
      );
      aggregatedData.sntarmMaxLbs.push(parseNum(row["sntarmMaxLbs"]));
      aggregatedData.gtarmPeakForceLbs1.push(
        parseNum(row["gtarmPeakForceLbs1"])
      );
      aggregatedData.gtarmPeakForceLbs2.push(
        parseNum(row["gtarmPeakForceLbs2"])
      );
      aggregatedData.gtarmPeakForceLbs3.push(
        parseNum(row["gtarmPeakForceLbs3"])
      );
      aggregatedData.gtarmMaxLbs.push(parseNum(row["gtarmMaxLbs"]));
      aggregatedData.gntarmPeakForceLbs1.push(
        parseNum(row["gntarmPeakForceLbs1"])
      );
      aggregatedData.gntarmPeakForceLbs2.push(
        parseNum(row["gntarmPeakForceLbs2"])
      );
      aggregatedData.gntarmPeakForceLbs3.push(
        parseNum(row["gntarmPeakForceLbs3"])
      );
      aggregatedData.gntarmMaxLbs.push(parseNum(row["gntarmMaxLbs"]));
      aggregatedData.accelPeakForceLbs1.push(
        parseNum(row["accelPeakForceLbs1"])
      );
      aggregatedData.accelPeakForceLbs2.push(
        parseNum(row["accelPeakForceLbs2"])
      );
      aggregatedData.accelPeakForceLbs3.push(
        parseNum(row["accelPeakForceLbs3"])
      );
      aggregatedData.accelMaxLbs.push(parseNum(row["accelMaxLbs"]));
      aggregatedData.decelPeakForceLbs1.push(
        parseNum(row["decelPeakForceLbs1"])
      );
      aggregatedData.decelPeakForceLbs2.push(
        parseNum(row["decelPeakForceLbs2"])
      );
      aggregatedData.decelPeakForceLbs3.push(
        parseNum(row["decelPeakForceLbs3"])
      );
      aggregatedData.decelMaxLbs.push(parseNum(row["decelMaxLbs"]));
      aggregatedData.totalPrimerMaxLbs.push(parseNum(row["totalPrimerMaxLbs"]));
      aggregatedData.irtarmRom.push(parseNum(row["irtarmRom"]));
      aggregatedData.irntarmRom.push(parseNum(row["irntarmRom"]));
      aggregatedData.ertarmRom.push(parseNum(row["ertarmRom"]));
      aggregatedData.erntarmRom.push(parseNum(row["erntarmRom"]));
      aggregatedData.tarmTarc.push(parseNum(row["tarmTarc"]));
      aggregatedData.ntarmTarc.push(parseNum(row["ntarmTarc"]));
      aggregatedData.ftarmRom.push(parseNum(row["ftarmRom"]));
      aggregatedData.fntarmRom.push(parseNum(row["fntarmRom"]));
      aggregatedData.freshRpe.push(parseNum(row["freshRpe"]));
      aggregatedData.postPitchCount.push(parseNum(row["postPitchCount"]));
      aggregatedData.postHighIntentThrows.push(
        parseNum(row["postHighIntentThrows"])
      );
      aggregatedData.postRpe.push(parseNum(row["postRpe"]));
    }

    // 6) Insert a single doc
    await ArmCare.create(aggregatedData);

    return NextResponse.json({
      message: "ArmCare CSV uploaded into one doc successfully (no nulls).",
    });
  } catch (err: any) {
    console.error("ArmCare CSV error:", err);
    return NextResponse.json(
      { error: "Failed to upload ArmCare data", details: err.message },
      { status: 500 }
    );
  }
}
