import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    const heightMap: Map<string, number[]> = new Map();
    // Fetch all records for the given sessionId, including spray chart coordinates.
    const hits = await prisma.hitTrax.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    if (!hits || hits.length === 0) {
      return NextResponse.json(
        { error: 'No hits found for the given sessionId' },
        { status: 404 }
      );
    }

    // Filter out hits where velo or dist is 0 or null.
    const filteredHits = hits.filter(
      (h) => h.velo !== 0 && h.dist !== 0 && h.velo !== null && h.dist !== null
    );

    if (filteredHits.length === 0) {
      return NextResponse.json(
        { error: 'No valid hits found for the given sessionId' },
        { status: 404 }
      );
    }

    // Fetch handedness from HitTrax (assuming one record exists for the session)
    const athleteInfo = await prisma.hitTrax.findFirst({
      where: { sessionId },
      select: { batting: true },
    });
    const handedness = athleteInfo?.batting || 'Right'; // Default to Right-handed if undefined

    const centerZoneMargin = 15;

    // Group velocities by pull, center, and opposite zones
    const zoneVelocities: {
      pull: number[];
      center: number[];
      opposite: number[];
    } = {
      pull: [],
      center: [],
      opposite: [],
    };

    for (const hit of filteredHits) {
      if (hit.sprayChartX !== null && hit.velo !== null) {
        if (handedness === 'Left') {
          if (hit.sprayChartX < -centerZoneMargin) {
            zoneVelocities.pull.push(hit.velo);
          } else if (hit.sprayChartX > centerZoneMargin) {
            zoneVelocities.opposite.push(hit.velo);
          } else {
            zoneVelocities.center.push(hit.velo);
          }
        } else {
          if (hit.sprayChartX > centerZoneMargin) {
            zoneVelocities.pull.push(hit.velo);
          } else if (hit.sprayChartX < -centerZoneMargin) {
            zoneVelocities.opposite.push(hit.velo);
          } else {
            zoneVelocities.center.push(hit.velo);
          }
        }
      }
    }

    // Calculate average velocities for each zone
    const avgVelocitiesByZone: { [key: string]: number } = {};
    for (const [zone, velocities] of Object.entries(zoneVelocities)) {
      if (velocities.length > 0) {
        avgVelocitiesByZone[zone] =
          velocities.reduce((sum, velo) => sum + velo, 0) / velocities.length;
      } else {
        avgVelocitiesByZone[zone] = 0; // Default to 0 if no hits in zone
      }
    }

    // Height zone processing (kept as is for consistency)
    for (const hit of hits) {
      if (
        hit.POIY === null ||
        hit.strikeZoneBottom === null ||
        hit.strikeZoneTop === null
      ) {
        continue;
      }
      const third = (hit.strikeZoneTop! - hit.strikeZoneBottom!) / 3;
      if (hit.POIY < hit.strikeZoneBottom + third) {
        if (!heightMap.get('low')) {
          heightMap.set('low', [hit.velo!]);
          continue;
        }
        heightMap.get('low')?.push(hit.velo!);
      } else if (
        hit.POIY > hit.strikeZoneBottom + third &&
        hit.POIY < hit.strikeZoneTop - third
      ) {
        if (!heightMap.get('middle')) {
          heightMap.set('middle', [hit.velo!]);
          continue;
        }
        heightMap.get('middle')?.push(hit.velo!);
      } else if (hit.POIY > hit.strikeZoneTop - third) {
        if (!heightMap.get('top')) {
          heightMap.set('top', [hit.velo!]);
          continue;
        }
        heightMap.get('top')?.push(hit.velo!);
      }
    }

    // Calculate key statistics.
    const exitVelocities = filteredHits
      .map((h) => h.velo)
      .filter((v): v is number => v !== null);
    const distances = filteredHits
      .map((h) => h.dist)
      .filter((d): d is number => d !== null);
    const launchAngles = filteredHits
      .map((h) => h.LA)
      .filter((la): la is number => la !== null);

    const maxExitVelo =
      exitVelocities.length > 0 ? Math.max(...exitVelocities) : 0;
    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
    const avgLaunchAngle =
      launchAngles.length > 0
        ? launchAngles.reduce((sum, angle) => sum + angle, 0) /
          launchAngles.length
        : 0;

    // Calculate average velocities for each height zone
    const avgVelocitiesByHeight: { [key: string]: number } = {};
    for (const [zone, velocities] of heightMap.entries()) {
      if (velocities.length > 0) {
        avgVelocitiesByHeight[zone] =
          velocities.reduce((sum, velo) => sum + velo, 0) / velocities.length;
      } else {
        avgVelocitiesByHeight[zone] = 0; // Default to 0 if no hits in zone
      }
    }

    return NextResponse.json({
      hits: filteredHits,
      maxExitVelo,
      maxDistance,
      avgLaunchAngle,
      avgVelocitiesByHeight,
      avgVelocitiesByZone, // Add average velocities by spray zone (pull, center, opposite)
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
