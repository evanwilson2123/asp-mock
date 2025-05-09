// /app/api/upload/route.ts
import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import prisma from '@/lib/prismaDb';
import csvParser from 'csv-parser';
import Athlete from '@/models/athlete';


// todo: prevent duplicate uploads by checking the date and time of the csv entry



/*──────────────── helpers ────────────────*/

type Row = Record<string, string | number | null | Date>;

const toFloat = (v: unknown): number =>
  v === undefined || v === null || v === ''
    ? 0
    : typeof v === 'number'
      ? v
      : parseFloat(String(v).replace(/,/g, '')) || 0;

const toInt = (v: unknown): number =>
  v === undefined || v === null || v === ''
    ? 0
    : typeof v === 'number'
      ? Math.trunc(v)
      : parseInt(String(v).replace(/,/g, ''), 10) || 0;

/*──────────── EDIT #1 ────────────
 *  • strip UTF-8 BOM               \uFEFF
 *  • remove *all* single/double quotes
 *─────────────────────────────────*/
const cleanHeaders = ({ header }: { header: string }) =>
  header
    .replace(/^\uFEFF/, '')
    .replace(/['"]/g, '')
    .trim();

/*──────────────── parsing ────────────────*/
// handle the CMJ test
async function parseTypeCMJ(rows: Row[]) {
  console.log(`parseTypeCMJ(): ${rows.length} rows`);

  for (const [idx, row] of rows.entries()) {
    console.log(`\n── Row #${idx + 1} ─`);
    console.log(row);

    /*────────── EDIT #2 ──────────*/
    let rawName = row['Name'] as string | undefined;
    if (!rawName) {
      const key = Object.keys(row).find((k) =>
        k.toLowerCase().includes('name')
      );
      rawName = key ? (row[key] as string) : undefined;
    }
    console.log('rawName:', rawName);

    if (!rawName) {
      console.log('→ rawName missing, skipping');
      continue;
    }

    const parts = rawName.trim().split(/\s+/, 2);
    if (parts.length < 2) {
      console.log('→ cannot split first/last, skipping');
      continue;
    }

    const athlete = await Athlete.findOne({
      firstName: parts[0],
      lastName: parts[1],
    });
    console.log('athlete:', athlete?._id?.toString() ?? null);
    if (!athlete) continue;

    const existingEntry = await prisma.forceCMJ.findFirst({
      where: {
        athlete: athlete._id.toString(),
        date: new Date(row['Date'] as string),
        time: row['Time'] as string,
      },
    });
    if (existingEntry) {
      console.log('→ duplicate entry, skipping');
      continue;
    }

    const data = {
      athlete: athlete._id.toString(),
      date: new Date(row['Date'] as string),
      time: row['Time'] as string,
      bodyWeight: toFloat(row['BW [KG]']),
      reps: toInt(row['Reps']),
      addLoad: toFloat(row['Additional Load [lb]']),
      jmpHeight: toFloat(row['Jump Height (Imp-Mom) [cm]']),
      lowLimbStiff: toFloat(row['Lower-Limb Stiffness [N/m]']),
      peakPowerW: toFloat(row['Peak Power [W]']),
      peakPowerBM: toFloat(row['Peak Power / BM [W/kg]']),
      eccentricDuration: toFloat(row['Eccentric Duration [ms]']),
      concretricDuration: toFloat(row['Concentric Duration [ms]']),
      RSImodified: toFloat(row['RSI-modified [m/s]']),
      counterMovement: toFloat(row['Countermovement Depth [cm]']),
      CMJstiffness: String(row['CMJ Stiffness % (Asym) (%)'] ?? ''),
      eccentricDeceleration: String(
        row['Eccentric Deceleration Impulse % (Asym) (%)'] ?? ''
      ),
      P1concentricImp: String(row['P1 Concentric Impulse % (Asym) (%)'] ?? ''),
      P2concentricImp: String(
        row['P2 Concentric Impulse:P1 Concentric Impulse % (Asym) (%)'] ?? ''
      ),
      concentricPeakForce: String(row['Concentric Peak Force [N]'] ?? ''),
      eccentricPeakForce: String(row['Eccentric Peak Force [N]'] ?? ''),
      minimumEccentricForce: String(row['Minimum Eccentric Force [N]'] ?? ''),
    };

    console.log('data →', data);
    try {
      const created = await prisma.forceCMJ.create({ data });
      console.log('✔ inserted ID:', created.id);
    } catch (err) {
      console.error('❌ insert failed:', err);
    }
  }
}
// handle the HJ test
async function parseTypeHop(rows: Row[]) {
  for (const row of rows) {
    /*── athlete lookup ─*/
    let rawName = row['Name'] as string | undefined;
    if (!rawName) {
      const k = Object.keys(row).find((h) => h.toLowerCase().includes('name'));
      rawName = k ? (row[k] as string) : undefined;
    }
    if (!rawName) continue;

    const parts = rawName.trim().split(/\s+/, 2);
    if (parts.length < 2) continue;

    const athlete = await Athlete.findOne({
      firstName: parts[0],
      lastName: parts[1],
    });
    if (!athlete) continue;

    const existingEntry = await prisma.forceHop.findFirst({
      where: {
        athlete: athlete._id.toString(),
        date: new Date(row['Date'] as string),
        time: row['Time'] as string,
      },
    });
    if (existingEntry) {
      console.log('→ duplicate entry, skipping');
      continue;
    }

    /*── build record ─*/
    const data = {
      athlete: athlete._id.toString(), // String in schema
      date: new Date(row['Date'] as string),
      time: row['Time'] as string,
      bw: toFloat(row['BW [KG]']),
      reps: toInt(row['Reps']),
      bestActiveStiffness: toFloat(row['Best Active Stiffness [N/m]']),
      bestJumpHeight: toFloat(row['Best Jump Height (Flight Time) [cm]']),
      bestRSIF: toFloat(row['Best RSI (Flight/Contact Time)']),
      bestRSIJ: toFloat(row['Best RSI (Jump Height/Contact Time) [m/s]']),
    };

    await prisma.forceHop.create({ data });
  }
}
// handle teh IMTP test
async function parseTypeIMTP(rows: Row[]) {
  /* TODO */
  for (const row of rows) {
    /*── athlete lookup ─*/
    let rawName = row['Name'] as string | undefined;
    if (!rawName) {
      const k = Object.keys(row).find((h) => h.toLowerCase().includes('name'));
      rawName = k ? (row[k] as string) : undefined;
    }
    if (!rawName) continue;

    const parts = rawName.trim().split(/\s+/, 2);
    if (parts.length < 2) continue;

    const athlete = await Athlete.findOne({
      firstName: parts[0],
      lastName: parts[1],
    });
    if (!athlete) continue;

    const existingEntry = await prisma.forceIMTP.findFirst({
      where: {
        athlete: athlete._id.toString(),
        date: new Date(row['Date'] as string),
        time: row['Time'] as string,
      },
    });
    if (existingEntry) {
      console.log('→ duplicate entry, skipping');
      continue;
    }

    // build the record
    const data = {
      athlete: athlete._id.toString(),
      date: new Date(row['Date'] as string),
      time: row['Time'] as string,
      bw: toFloat(row['BW [KG]']),
      reps: toInt(row['Reps']),
      netPeakVerticalForce: toFloat(row['Net Peak Vertical Force [N]']),
      peakVerticalForce: toFloat(row['Peak Vertical Force [N]']),
      forceAt100ms: toFloat(row['Force at 100ms [N]']),
      forceAt150ms: toFloat(row['Force at 150ms [N]']),
      forceAt200ms: toFloat(row['Force at 200ms [N]']),
    };

    await prisma.forceIMTP.create({ data });
  }
}

async function parseTypeSJ(rows: Row[]) {
  for (const row of rows) {
    let rawName = row['Name'] as string | undefined;
    if (!rawName) {
      const k = Object.keys(row).find((h) => h.toLowerCase().includes('name'));
      rawName = k ? (row[k] as string) : undefined;
    }
    if (!rawName) continue;

    const parts = rawName.trim().split(/\s+/, 2);
    if (parts.length < 2) continue;

    const athlete = await Athlete.findOne({
      firstName: parts[0],
      lastName: parts[1],
    });
    if (!athlete) continue;

    const existingEntry = await prisma.forceSJ.findFirst({
      where: {
        athlete: athlete._id.toString(),
        date: new Date(row['Date'] as string),
        time: row['Time'] as string,
      },
    });
    if (existingEntry) {
      console.log('→ duplicate entry, skipping');
      continue;
    }

    const data = {
      athlete: athlete._id.toString(),
      date: new Date(row['Date'] as string),
      time: row['Time'] as string,
      bw: toFloat(row['BW [KG]']),
      reps: toInt(row['Reps']),
      additionalLoad: toFloat(row['Additional Load [lb]']),
      peakPowerW: toFloat(row['Peak Power [W]']),
      peakPowerBM: toFloat(row['Peak Power / BM [W/kg]']),
      P1concentricImp: row['P1 Concentric Impulse % (Asym) (%)'] as string,
      P2concentricImp: row[
        'P2 Concentric Impulse:P1 Concentric Impulse % (Asym) (%)'
      ] as string,
    };

    await prisma.forceSJ.create({ data });
  }
}

async function parseTypePPU(rows: Row[]) {
  for (const row of rows) {
    /*── athlete lookup ─*/
    let rawName = row['Name'] as string | undefined;
    if (!rawName) {
      const k = Object.keys(row).find((h) => h.toLowerCase().includes('name'));
      rawName = k ? (row[k] as string) : undefined;
    }
    if (!rawName) continue;

    const parts = rawName.trim().split(/\s+/, 2);
    if (parts.length < 2) continue;

    const athlete = await Athlete.findOne({
      firstName: parts[0],
      lastName: parts[1],
    });
    if (!athlete) continue;

    const existingEntry = await prisma.forcePPU.findFirst({
      where: {
        athlete: athlete._id.toString(),
        date: new Date(row['Date'] as string),
        time: row['Time'] as string,
      },
    });

    if (existingEntry) {
      console.log('→ duplicate entry, skipping');
      continue;
    }

    const data = {
      athlete: athlete._id.toString(),
      date: new Date(row['Date'] as string),
      time: row['Time'] as string,
      bw: toFloat(row['BW [KG]']),
      reps: toInt(row['Reps']),
      takeoffPeakForceN: toFloat(row['Takeoff Peak Force [N]']),
      eccentricPeakForce: toFloat(row['Eccentric Peak Force [N]']),
      takeoffPeakForceAsym: row['Takeoff Peak Force % (Asym) (%)'] as string,
      eccentricPeakForceAsym: row['Eccentric Peak Force % (Asym) (%)'] as string,
    };

    await prisma.forcePPU.create({ data });
  }
}

/*──────────────── handler ────────────────*/

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthenticated request' },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: "'file' is missing or invalid" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows: Row[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csvParser({ mapHeaders: cleanHeaders })) // uses EDIT #1
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (!rows.length) {
      return NextResponse.json(
        { error: 'CSV appears to be empty' },
        { status: 400 }
      );
    }

    const testType = (rows[0]['Test Type'] ?? '').toString().trim();
    console.log('testType:', testType);

    switch (testType) {
      case 'CMJ':
        await parseTypeCMJ(rows);
        break;
      case 'HJ':
        await parseTypeHop(rows);
        break;
      case 'IMTP':
        await parseTypeIMTP(rows);
        break;
      case 'SJ':
        await parseTypeSJ(rows);
        break;
      case 'PPU':
        await parseTypePPU(rows);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown Test Type: ${testType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
