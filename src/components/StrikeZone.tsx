import React from 'react';

interface StrikeZoneProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  redColor?: string; // For 0-25%
  orangeColor?: string; // For 25-50%
  yellowColor?: string; // For 50-75%
  greenColor?: string; // For 75-100%
  strokeWidth?: number;
  strokeColorBorder?: string;
  sections?: number[]; // 9 percentage values (0-100) for each cell; if a value > 100, that means "no data"
  fillColor?: string; // fallback base color if needed
}

const StrikeZone: React.FC<StrikeZoneProps> = ({
  width = 200,
  height = 300,
  x = 0,
  y = 0,
  redColor = 'red',
  orangeColor = 'orange',
  yellowColor = 'yellow',
  greenColor = 'green',
  strokeColorBorder = 'black',
  strokeWidth = 2,
  sections,
  fillColor = 'blue',
}) => {
  // Use default percentages if not provided or if not exactly 9 items.
  const defaultSections = Array.from({ length: 9 }, () => 101);
  const sectionData =
    sections && sections.length === 9 ? sections : defaultSections;

  const cellWidth = width / 3;
  const cellHeight = height / 3;

  // Define minimum and maximum opacity for the effect.
  const minOpacity = 0.3;
  const maxOpacity = 1.0;

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4">
      <h1 className="text-2xl font-bold text-gray-700 text-center">
        Positive Result By Zone
      </h1>
      <h2 className="text-lg font-bold text-gray-700 text-center mb-4">
        Top 75% exit velocity between 7° and 30°
      </h2>
      {/* Use viewBox so the inner grid is exactly centered */}
      <svg
        width={width}
        height={height}
        viewBox={`${x} ${y} ${width} ${height}`}
        className="mx-auto"
        style={{ border: '1px solid #ccc' }}
      >
        {/* Overall strike zone border */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke={strokeColorBorder}
          strokeWidth={strokeWidth}
        />
        {/* Draw each of the 9 cells */}
        {Array.from({ length: 9 }).map((_, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const cellX = x + col * cellWidth;
          const cellY = y + row * cellHeight;
          const percent = sectionData[index];

          // If percent > 100, consider that as "no data"
          if (percent > 100) {
            return (
              <g key={index}>
                <rect
                  x={cellX}
                  y={cellY}
                  width={cellWidth}
                  height={cellHeight}
                  fill="none"
                  stroke={strokeColorBorder}
                  strokeWidth={strokeWidth / 2}
                />
                <text
                  x={cellX + cellWidth / 2}
                  y={cellY + cellHeight / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  dy=".3em"
                  fill="black"
                  fontSize={14}
                >
                  No Data
                </text>
              </g>
            );
          }

          let cellFillColor = fillColor; // fallback
          let progress = 0;

          if (percent < 25) {
            cellFillColor = redColor;
            progress = percent / 25;
          } else if (percent < 50) {
            cellFillColor = orangeColor;
            progress = (percent - 25) / 25;
          } else if (percent < 75) {
            cellFillColor = yellowColor;
            progress = (percent - 50) / 25;
          } else {
            cellFillColor = greenColor;
            progress = (percent - 75) / 25;
          }

          const opacity = minOpacity + progress * (maxOpacity - minOpacity);

          return (
            <g key={index}>
              <rect
                x={cellX}
                y={cellY}
                width={cellWidth}
                height={cellHeight}
                fill={cellFillColor}
                fillOpacity={opacity}
                stroke={strokeColorBorder}
                strokeWidth={strokeWidth / 2}
              />
              <text
                x={cellX + cellWidth / 2}
                y={cellY + cellHeight / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                dy=".3em"
                fill="black"
                fontSize={14}
              >
                {percent.toFixed(2)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default StrikeZone;
