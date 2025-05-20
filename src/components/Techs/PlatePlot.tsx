import React from 'react';

interface PlatePlotProps {
  width: number;
  height: number;
  hits: Array<{
    POIX: number | null;
    POIY: number | null;
    POIZ: number | null;
    velo: number | null;
  }>;
  strokeColor?: string;
  strokeWidth?: number;
  plateColor?: string;
  dotSize?: number;
}

const PlatePlot: React.FC<PlatePlotProps> = ({
  width,
  height,
  hits,
  strokeColor = 'black',
  strokeWidth = 2,
  plateColor = 'rgba(200, 200, 200, 0.3)',
  dotSize = 6,
}) => {
  // Plate takes up 80% width × 60% height
  const plateWidth = width * 0.8;
  const plateHeight = height * 0.6;

  // Center the plate (and all its points) in the svg
  const cx = width / 2;
  // We'll set the bottom of the plate a bit above the bottom of the SVG to allow room for data
  const plateBottomY = height * 0.85;

  // Scale inches → pixels
  const xScale = plateWidth / 17;
  const yScale = plateHeight / 17;

  // Five corners of home plate (flat side at bottom, tip at top)
  const backLeft   = { x: cx - 8.5 * xScale, y: plateBottomY - 8.5 * yScale };
  const backRight  = { x: cx + 8.5 * xScale, y: plateBottomY - 8.5 * yScale };
  const rightCorner= { x: cx + 8.5 * xScale, y: plateBottomY };
  const front      = { x: cx,                 y: plateBottomY + 8.5 * yScale };
  const leftCorner = { x: cx - 8.5 * xScale, y: plateBottomY };

  const platePoints = [backLeft, backRight, rightCorner, front, leftCorner];

  // Only plot hits with valid X & Y
  const validHits = hits.filter(h => h.POIX !== null && h.POIY !== null);

  // Find the max POIY to zoom out if needed
  const maxPOIY = Math.max(40, ...validHits.map(h => h.POIY as number));
  const dataYScale = (plateBottomY - 40) / maxPOIY; // fit data above plate

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="border border-gray-300 rounded">
        {/* Solid white background to cover any parent grid lines */}
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {/* Plate outline */}
        <polygon
          points={platePoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill={plateColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {/* Hit points */}
        {validHits.map((hit, index) => {
          const x = cx + (hit.POIX as number) * xScale;
          // POIY=0 at bottom, increases upward
          const y = plateBottomY - (hit.POIY as number) * dataYScale;
          const intensity = hit.velo ? Math.min((hit.velo - 60) / 40, 1) : 0.5;
          const pointColor = `rgba(54, 162, 235, ${0.3 + intensity * 0.7})`;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={dotSize}
              fill={pointColor}
              stroke={strokeColor}
              strokeWidth={1}
            />
          );
        })}
        {/* Labels */}
        <text x={cx} y={height - 10} textAnchor="middle" className="text-xs fill-gray-600">
          Front of Plate
        </text>
        <text x={cx - (8.5 * xScale) - 20} y={height / 2} textAnchor="middle" className="text-xs fill-gray-600" transform={`rotate(-90, ${cx - (8.5 * xScale) - 20}, ${height / 2})`}>
          Inches from Center
        </text>
      </svg>
    </div>
  );
};

export default PlatePlot;
