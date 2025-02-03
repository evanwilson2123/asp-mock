'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, registerables, ChartOptions } from 'chart.js';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';

// Register all necessary Chart.js modules and the annotation plugin
ChartJS.register(...registerables, annotationPlugin);

interface Pitch {
  intended: { x: number; y: number };
  actual: { x: number; y: number };
  pitchType: string;
  distance: { feet: number; percent: number };
}

const pitchTypes = ['4-seam', '2-seam', 'curveball', 'slider', 'changeup'];
const softColors = [
  'rgba(255, 99, 132, 0.5)',
  'rgba(54, 162, 235, 0.5)',
  'rgba(75, 192, 192, 0.5)',
  'rgba(153, 102, 255, 0.5)',
  'rgba(255, 159, 64, 0.5)',
];

// Outer strike zone boundaries.
const outerXMin = -0.83;
const outerXMax = 0.83;
const outerYMin = 1.513;
const outerYMax = 3.67;

// Calculate grid line positions for a 3x3 grid within the outer strike zone.
const outerWidth = outerXMax - outerXMin; // 1.66
const outerHeight = outerYMax - outerYMin; // 2.157

// Vertical grid lines (divide width into 3 equal parts)
const verticalLine1 = outerXMin + outerWidth / 3; // ≈ -0.83 + 0.5533 = -0.2767
const verticalLine2 = outerXMin + (2 * outerWidth) / 3; // ≈ -0.83 + 1.1067 = 0.2767

// Horizontal grid lines (divide height into 3 equal parts)
const horizontalLine1 = outerYMin + outerHeight / 3; // ≈ 1.513 + 0.719 = 2.232
const horizontalLine2 = outerYMin + (2 * outerHeight) / 3; // ≈ 1.513 + 1.438 = 2.951

// Helper function: Creates a canvas with the scaled-down image.
const createScaledImage = (
  img: HTMLImageElement,
  scale: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
};

const IntendedZone: React.FC = () => {
  const chartRef = useRef<ChartJS<'scatter'> | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [intended, setIntended] = useState<{ x: number; y: number } | null>(
    null
  );
  const [actual, setActual] = useState<{ x: number; y: number } | null>(null);
  const [pitchType, setPitchType] = useState<string>('4-seam');

  // Store the scaled glove image as a canvas.
  const [gloveImage, setGloveImage] = useState<HTMLCanvasElement | null>(null);

  // Load and scale the glove image on mount.
  useEffect(() => {
    const img = new Image();
    img.src = 'mitt.webp'; // Ensure this path is correct and the image exists.
    img.onload = () => {
      // Adjust the scale factor (0.2 makes the image smaller).
      const scaled = createScaledImage(img, 0.2);
      setGloveImage(scaled);
    };
  }, []);

  const handleChartClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
    type: 'intended' | 'actual'
  ) => {
    const chart = chartRef.current;
    if (!chart) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xPos = event.clientX - rect.left;
    const yPos = event.clientY - rect.top;

    const x = chart.scales.x.getValueForPixel(xPos);
    const y = chart.scales.y.getValueForPixel(yPos);

    if (x === undefined || y === undefined) return;

    const point = { x, y };

    if (type === 'intended') {
      setIntended(point);
    } else {
      setActual(point);
    }
  };

  const handleAddPitch = () => {
    if (intended && actual) {
      // Use the raw difference in feet.
      const deltaXFeet = actual.x - intended.x;
      const deltaYFeet = actual.y - intended.y;
      const distanceFeet = Math.sqrt(deltaXFeet ** 2 + deltaYFeet ** 2);
      const distancePercent = Math.sqrt(
        (actual.x - intended.x) ** 2 + (actual.y - intended.y) ** 2
      );
      setPitches([
        ...pitches,
        {
          intended,
          actual,
          pitchType,
          distance: {
            feet: parseFloat(distanceFeet.toFixed(2)),
            percent: parseFloat(distancePercent.toFixed(2)),
          },
        },
      ]);
      setIntended(null);
      setActual(null);
    } else {
      alert('Please select both intended and actual pitch locations.');
    }
  };

  // Construct the data object for the scatter chart.
  const data = {
    datasets: [
      // One dataset per pitch type for actual pitch locations.
      ...pitchTypes.map((type, index) => ({
        label: type,
        data: pitches
          .filter((pitch) => pitch.pitchType === type)
          .map((pitch) => ({ x: pitch.actual.x, y: pitch.actual.y })),
        backgroundColor: softColors[index % softColors.length],
        pointRadius: 6,
        order: 0, // Default order
      })),
      // Dataset for the intended point.
      {
        label: 'Intended',
        data: intended ? [intended] : [],
        pointStyle: gloveImage || 'circle',
        pointRadius: gloveImage ? 10 : 8,
        order: 1, // Draw intended points before actual
      },
      // Dataset for the actual point.
      {
        label: 'Actual',
        data: actual ? [actual] : [],
        backgroundColor: 'red',
        pointRadius: 8,
        order: 2, // Draw actual points on top
      },
    ],
  };

  // Chart configuration options.
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
      padding: { top: 20 },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Horizontal Location (ft)',
          color: 'white',
        },
        min: -3,
        max: 3,
        ticks: { stepSize: 1, color: 'white' },
        grid: { color: '#1a202c' },
      },
      y: {
        title: {
          display: true,
          text: 'Vertical Location (ft)',
          color: 'white',
        },
        min: 0,
        max: 5,
        ticks: { stepSize: 1, color: 'white' },
        grid: { color: '#1a202c' },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'white' },
      },
      tooltip: {
        bodyColor: 'white',
        titleColor: 'white',
        backgroundColor: 'rgba(0,0,0,0.8)',
      },
      annotation: {
        annotations: {
          outerStrikeZone: {
            type: 'box',
            xMin: outerXMin,
            xMax: outerXMax,
            yMin: outerYMin,
            yMax: outerYMax,
            borderWidth: 2,
            borderColor: 'white',
            backgroundColor: 'transparent',
          } as AnnotationOptions,
          innerStrikeZone: {
            type: 'box',
            xMin: -0.703,
            xMax: 0.703,
            yMin: 1.64,
            yMax: 3.55,
            borderWidth: 1,
            borderColor: 'white',
            backgroundColor: 'transparent',
          } as AnnotationOptions,
          gridV1: {
            type: 'line',
            xMin: verticalLine1,
            xMax: verticalLine1,
            yMin: outerYMin,
            yMax: outerYMax,
            borderColor: 'white',
            borderWidth: 1,
          } as AnnotationOptions,
          gridV2: {
            type: 'line',
            xMin: verticalLine2,
            xMax: verticalLine2,
            yMin: outerYMin,
            yMax: outerYMax,
            borderColor: 'white',
            borderWidth: 1,
          } as AnnotationOptions,
          gridH1: {
            type: 'line',
            yMin: horizontalLine1,
            yMax: horizontalLine1,
            xMin: outerXMin,
            xMax: outerXMax,
            borderColor: 'white',
            borderWidth: 1,
          } as AnnotationOptions,
          gridH2: {
            type: 'line',
            yMin: horizontalLine2,
            yMax: horizontalLine2,
            xMin: outerXMin,
            xMax: outerXMax,
            borderColor: 'white',
            borderWidth: 1,
          } as AnnotationOptions,
        },
      },
    },
    aspectRatio: 1,
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 min-h-screen p-8">
      {/* Dropdown for selecting pitch type */}
      <div className="mb-6 w-full max-w-sm">
        <label
          htmlFor="pitch-type"
          className="block text-lg font-medium text-white mb-2 text-center"
        >
          Select Pitch Type:
        </label>
        <select
          id="pitch-type"
          value={pitchType}
          onChange={(e) => setPitchType(e.target.value)}
          className="border border-gray-300 rounded-md p-3 bg-white text-gray-700 w-full shadow-md focus:outline-blue-400 focus:ring focus:ring-blue-300"
        >
          {pitchTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Section */}
      <div className="flex justify-center items-center bg-gray-900 p-6 rounded shadow">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 text-center">
            Pitch Location (Strike Zone)
          </h2>
          <div style={{ width: '800px', height: '800px' }}>
            <Scatter
              ref={chartRef}
              data={data}
              options={options}
              onClick={(event) =>
                handleChartClick(
                  event as React.MouseEvent<HTMLCanvasElement>,
                  intended === null ? 'intended' : 'actual'
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleAddPitch}
          className="bg-blue-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Add Pitch
        </button>
        <button
          onClick={() => {
            setPitches([]);
            setIntended(null);
            setActual(null);
          }}
          className="bg-red-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-red-600 transition"
        >
          Reset
        </button>
      </div>

      {/* Display Pitch Data */}
      <div className="mt-10 max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Pitch Data</h2>
        <ul className="list-disc pl-6 space-y-3">
          {pitches.map((pitch, index) => (
            <li key={index} className="text-gray-700">
              <span className="font-bold">Pitch Type:</span> {pitch.pitchType} |{' '}
              <span className="font-bold">Intended:</span> (
              {pitch.intended.x.toFixed(2)} ft, {pitch.intended.y.toFixed(2)}{' '}
              ft) | <span className="font-bold">Actual:</span> (
              {pitch.actual.x.toFixed(2)} ft, {pitch.actual.y.toFixed(2)} ft) |{' '}
              <span className="font-bold">Distance:</span>{' '}
              {(pitch.distance.feet * 12).toFixed(2)} inches (
              {pitch.distance.percent.toFixed(2)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IntendedZone;
