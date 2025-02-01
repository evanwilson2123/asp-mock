import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';

/**
 * GET handler:
 * - Finds all `BlastMotion` records for the given athlete.
 * - Groups data by `sessionId`.
 * - Calculates average speeds for each session and sorts by session date (latest to earliest).
 * - Computes global max batSpeed and peakHandSpeed across all sessions.
 * - Returns a list of sessions for navigation.
 */
export async function GET(req: NextRequest, context: any) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'AUTH FAILED' }, { status: 400 });
  }
  const athleteId = context.params.athleteId;

  try {
    // Fetch all BlastMotion records for the athlete
    const records = await prisma.blastMotion.findMany({
      where: { athlete: athleteId },
      orderBy: { date: 'desc' }, // Sort by session date (latest first)
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No data found for this athlete' },
        { status: 404 }
      );
    }

    // Group records by sessionId and collect all values for global maxes
    const sessions: Record<
      string,
      {
        sessionId: string;
        date: string;
        batSpeeds: number[];
        handSpeeds: number[];
        rotationalAccels: number[];
        powers: number[];
        earlyConnections: number[];
        connectionAtImpacts: number[];
      }
    > = {};

    const allBatSpeeds: number[] = [];
    const allHandSpeeds: number[] = [];
    const allRotationalAccels: number[] = [];
    const allPowers: number[] = [];
    const allEarlyConnections: number[] = [];
    const allConnectionAtImpacts: number[] = [];

    for (const record of records) {
      const sessionId = record.sessionId;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          sessionId,
          date: record.date.toISOString().split('T')[0], // Format date to "YYYY-MM-DD"
          batSpeeds: [],
          handSpeeds: [],
          rotationalAccels: [],
          powers: [],
          earlyConnections: [],
          connectionAtImpacts: [],
        };
      }

      // Collect batSpeed and peakHandSpeed for this session and global max calculations
      if (record.batSpeed !== null) {
        sessions[sessionId].batSpeeds.push(record.batSpeed);
        allBatSpeeds.push(record.batSpeed); // Add to global max array
      }
      if (record.peakHandSpeed !== null) {
        sessions[sessionId].handSpeeds.push(record.peakHandSpeed);
        allHandSpeeds.push(record.peakHandSpeed); // Add to global max array
      }
      if (record.rotationalAcceleration !== null) {
        sessions[sessionId].rotationalAccels.push(
          record.rotationalAcceleration
        );
        allRotationalAccels.push(record.rotationalAcceleration);
      }
      if (record.power !== null) {
        sessions[sessionId].powers.push(record.power);
        allPowers.push(record.power);
      }
      if (record.earlyConnection !== null) {
        sessions[sessionId].earlyConnections.push(record.earlyConnection);
        allEarlyConnections.push(record.earlyConnection);
      }
      if (record.connectionAtImpact !== null) {
        sessions[sessionId].connectionAtImpacts.push(record.connectionAtImpact);
        allConnectionAtImpacts.push(record.connectionAtImpact);
      }
    }

    // Calculate averages per session
    const sessionAverages = Object.values(sessions).map((session) => {
      const avgBatSpeed =
        session.batSpeeds.length > 0
          ? session.batSpeeds.reduce((acc, v) => acc + v, 0) /
            session.batSpeeds.length
          : 0;
      const avgHandSpeed =
        session.handSpeeds.length > 0
          ? session.handSpeeds.reduce((acc, v) => acc + v, 0) /
            session.handSpeeds.length
          : 0;
      const avgRotaionalAcceleration =
        session.rotationalAccels.length > 0
          ? session.rotationalAccels.reduce((acc, v) => acc + v, 0) /
            session.rotationalAccels.length
          : 0;
      const avgPower =
        session.powers.length > 0
          ? session.powers.reduce((acc, v) => acc + v, 0) /
            session.powers.length
          : 0;
      const avgEarlyConnection =
        session.earlyConnections.length > 0
          ? session.earlyConnections.reduce((acc, v) => acc + v, 0) /
            session.earlyConnections.length
          : 0;
      const avgConnectionAtImpacts =
        session.connectionAtImpacts.length > 0
          ? session.connectionAtImpacts.reduce((acc, v) => acc + v, 0) /
            session.connectionAtImpacts.length
          : 0;

      return {
        sessionId: session.sessionId,
        date: session.date,
        avgBatSpeed,
        avgHandSpeed,
        avgRotaionalAcceleration,
        avgPower,
        avgEarlyConnection,
        avgConnectionAtImpacts,
      };
    });

    // Compute global max values
    const maxBatSpeed = allBatSpeeds.length > 0 ? Math.max(...allBatSpeeds) : 0;
    const maxHandSpeed =
      allHandSpeeds.length > 0 ? Math.max(...allHandSpeeds) : 0;
    const maxRotationalAcceleration =
      allRotationalAccels.length > 0 ? Math.max(...allRotationalAccels) : 0;
    const maxPower = allPowers.length > 0 ? Math.max(...allPowers) : 0;

    return NextResponse.json({
      maxBatSpeed,
      maxHandSpeed,
      maxRotationalAcceleration,
      maxPower,
      sessionAverages, // [{ sessionId, date, avgBatSpeed, avgHandSpeed }, ...]
      sessions: sessionAverages.map(({ sessionId, date }) => ({
        sessionId,
        date,
      })), // List of sessions for navigation
    });
  } catch (error: any) {
    console.error('Error fetching BlastMotion data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BlastMotion data', details: error.message },
      { status: 500 }
    );
  }
}
