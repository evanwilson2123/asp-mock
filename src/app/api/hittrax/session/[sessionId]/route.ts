import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaDb';

function positiveOutcomeByZone(hits: any): Map<string, number> {
  // First, compute the global max exit velocity among all hits with a valid velo.
  const validVelocities = hits
    .filter((h: any) => h.velo != null)
    .map((h: any) => h.velo as number);
  const maxVelo = validVelocities.length > 0 ? Math.max(...validVelocities) : 0;

  // Prepare a map to accumulate counts for each zone.
  // For each zone we store an object with:
  // - total: total number of hits in that zone.
  // - positive: number of hits meeting our criteria.
  const zoneCounts: Map<string, { total: number; positive: number }> =
    new Map();

  // Define the nine zone keys.
  const zoneKeys = [
    'topLeft',
    'topCenter',
    'topRight',
    'middleLeft',
    'middleCenter',
    'middleRight',
    'bottomLeft',
    'bottomCenter',
    'bottomRight',
  ];
  // Initialize counts for each zone.
  zoneKeys.forEach((key) => zoneCounts.set(key, { total: 0, positive: 0 }));

  // Loop over each hit.
  for (const hit of hits) {
    // Require all strike zone properties and coordinates.
    if (
      hit.strikeZoneWidth == null ||
      hit.strikeZoneTop == null ||
      hit.strikeZoneBottom == null ||
      hit.POIX == null ||
      hit.POIY == null
    ) {
      continue;
    }

    const strikeZoneWidth = hit.strikeZoneWidth;
    const strikeZoneTop = hit.strikeZoneTop;
    const strikeZoneBottom = hit.strikeZoneBottom;
    const zoneHeight = strikeZoneTop - strikeZoneBottom;
    const widthThird = strikeZoneWidth / 3;
    const heightThird = zoneHeight / 3;

    // Horizontal determination (assuming the strike zone is centered at 0).
    const leftBoundary = -strikeZoneWidth / 2;
    let horizontalZone: string;
    if (hit.POIX >= leftBoundary && hit.POIX < leftBoundary + widthThird) {
      horizontalZone = 'Left';
    } else if (
      hit.POIX >= leftBoundary + widthThird &&
      hit.POIX < leftBoundary + 2 * widthThird
    ) {
      horizontalZone = 'Center';
    } else {
      horizontalZone = 'Right';
    }

    // Vertical determination using a reversed coordinate:
    // Calculate how far hit.POIY is from the top of the strike zone.
    const relativeY = strikeZoneTop - hit.POIY;
    let verticalZone: string;
    if (relativeY < heightThird) {
      verticalZone = 'Top';
    } else if (relativeY < 2 * heightThird) {
      verticalZone = 'Middle';
    } else {
      verticalZone = 'Bottom';
    }

    // Construct the zone key (e.g., "topLeft", "middleCenter", etc.)
    const key = verticalZone.toLowerCase() + horizontalZone;

    // Update counts.
    const zone = zoneCounts.get(key);
    if (zone) {
      zone.total++;
      // Count as positive if:
      // - velo is not null and is at least 80% of max exit velocity (top 20%),
      // - and LA is not null and is between 7° and 25°.
      if (
        hit.velo != null &&
        hit.LA != null &&
        hit.velo >= 0.75 * maxVelo &&
        hit.LA >= 7 &&
        hit.LA <= 30
      ) {
        zone.positive++;
      }
    }
  }

  // Compute the percentage of positive outcomes for each zone.
  // If a zone has no data (total is 0), we set its percentage to 101.
  const result: Map<string, number> = new Map();
  zoneKeys.forEach((key) => {
    const zone = zoneCounts.get(key);
    const percent = (zone!.positive / zone!.total) * 100;
    result.set(key, percent);
  });

  return result;
}

export async function GET(req: NextRequest, context: any) {
  const sessionId = context.params.sessionId;

  try {
    const heightMap: Map<string, number[]> = new Map();
    // Fetch all records for the given sessionId.
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

    // Calculate positive outcome percentages by zone as a Map.
    const percentByZoneMap = positiveOutcomeByZone(hits);
    // Convert the Map to a plain object for JSON serialization.
    const zoneKeys = [
      'topLeft',
      'topCenter',
      'topRight',
      'middleLeft',
      'middleCenter',
      'middleRight',
      'bottomLeft',
      'bottomCenter',
      'bottomRight',
    ];
    const percentByZone: { [key: string]: number } = {};
    zoneKeys.forEach((key) => {
      percentByZone[key] = percentByZoneMap.get(key)!;
    });

    // Fetch handedness from HitTrax.
    const athleteInfo = await prisma.hitTrax.findFirst({
      where: { sessionId },
      select: { batting: true },
    });
    const handedness = athleteInfo?.batting || 'Right';

    const centerZoneMargin = 15;

    // Group velocities by spray chart zones.
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

    const avgVelocitiesByZone: { [key: string]: number } = {};
    for (const [zone, velocities] of Object.entries(zoneVelocities)) {
      avgVelocitiesByZone[zone] =
        velocities.length > 0
          ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
          : 0;
    }

    // Height zone processing.
    for (const hit of hits) {
      if (
        hit.POIY === null ||
        hit.strikeZoneBottom === null ||
        hit.strikeZoneTop === null
      ) {
        continue;
      }
      const third = (hit.strikeZoneTop - hit.strikeZoneBottom) / 3;
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

    const avgVelocitiesByHeight: { [key: string]: number } = {};
    for (const [zone, velocities] of heightMap.entries()) {
      avgVelocitiesByHeight[zone] =
        velocities.length > 0
          ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
          : 0;
    }

    const percentOptimalLA = (
      (filteredHits.filter((f) => f.LA! < 25 && f.LA! > 7).length /
        filteredHits.length) *
      100
    ).toFixed(2);
    console.log(`Percent optimal LA ${percentOptimalLA}%`);

    // Calculate top 12.5% statistics.
    if (exitVelocities.length > 0) {
      const sortedVelocities = [...exitVelocities].sort((a, b) => b - a);
      const topPercentIndex = Math.ceil(exitVelocities.length * 0.125);
      const topHits = filteredHits
        .filter(
          (h) =>
            h.velo !== null &&
            sortedVelocities.slice(0, topPercentIndex).includes(h.velo)
        )
        .filter((h) => h.dist !== null && h.LA !== null);

      let topVeloSum = 0,
        topDistSum = 0,
        topLASum = 0;
      if (topHits.length > 0) {
        topVeloSum = topHits.reduce((sum, hit) => sum + hit.velo!, 0);
        topDistSum = topHits.reduce((sum, hit) => sum + hit.dist!, 0);
        topLASum = topHits.reduce((sum, hit) => sum + hit.LA!, 0);
      }

      const avgTopVelo = topHits.length > 0 ? topVeloSum / topHits.length : 0;
      const avgTopDist = topHits.length > 0 ? topDistSum / topHits.length : 0;
      const avgTopLA = topHits.length > 0 ? topLASum / topHits.length : 0;
      console.log(percentByZone);
      return NextResponse.json({
        hits: filteredHits,
        maxExitVelo,
        maxDistance,
        avgLaunchAngle,
        avgVelocitiesByHeight,
        avgVelocitiesByZone,
        percentOptimalLA,
        percentByZone: percentByZone,
        top12_5PercentStats: {
          avgVelo: avgTopVelo,
          avgDistance: avgTopDist,
          avgLaunchAngle: avgTopLA,
        },
      });
    }
    console.log(percentByZone);
    return NextResponse.json({
      hits: filteredHits,
      maxExitVelo,
      maxDistance,
      avgLaunchAngle,
      avgVelocitiesByHeight,
      avgVelocitiesByZone,
      percentOptimalLA,
      percentByZone: percentByZone,
      top12_5PercentStats: {
        avgVelo: 0,
        avgDistance: 0,
        avgLaunchAngle: 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching HitTrax session data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data', details: error.message },
      { status: 500 }
    );
  }
}
