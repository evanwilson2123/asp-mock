"use client";

import React, { useRef, useState } from "react";
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, registerables, ChartOptions } from "chart.js";
import annotationPlugin, { AnnotationOptions } from "chartjs-plugin-annotation";

ChartJS.register(...registerables, annotationPlugin);

interface Pitch {
  intended: { x: number; y: number };
  actual: { x: number; y: number };
  pitchType: string;
  distance: { feet: number; percent: number };
}

const pitchTypes = ["4-seam", "2-seam", "curveball", "slider", "changeup"];
const softColors = [
  "rgba(255, 99, 132, 0.5)",
  "rgba(54, 162, 235, 0.5)",
  "rgba(75, 192, 192, 0.5)",
  "rgba(153, 102, 255, 0.5)",
  "rgba(255, 159, 64, 0.5)",
];
const FIELD_WIDTH_FEET = 1.66; // Horizontal strike zone width in feet
const FIELD_HEIGHT_FEET = 2.157; // Vertical strike zone height in feet

const IntendedZone: React.FC = () => {
  const chartRef = useRef<ChartJS<"scatter"> | null>(null);

  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [intended, setIntended] = useState<{ x: number; y: number } | null>(
    null
  );
  const [actual, setActual] = useState<{ x: number; y: number } | null>(null);
  const [pitchType, setPitchType] = useState<string>("4-seam");

  const handleChartClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
    type: "intended" | "actual"
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

    if (type === "intended") {
      setIntended(point);
    } else {
      setActual(point);
    }
  };

  const handleAddPitch = () => {
    if (intended && actual) {
      // Normalize the horizontal (x) distance to match vertical (y) scale
      const normalizedDeltaX =
        (actual.x - intended.x) * (FIELD_HEIGHT_FEET / FIELD_WIDTH_FEET);
      const deltaYFeet = actual.y - intended.y;

      // Calculate the Euclidean distance in feet
      const distanceFeet = Math.sqrt(normalizedDeltaX ** 2 + deltaYFeet ** 2);

      // Calculate the percentage distance (optional, for display)
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
      alert("Please select both intended and actual pitch locations.");
    }
  };

  const data = {
    datasets: [
      ...pitchTypes.map((type, index) => ({
        label: type,
        data: pitches
          .filter((pitch) => pitch.pitchType === type)
          .map((pitch) => ({ x: pitch.actual.x, y: pitch.actual.y })),
        backgroundColor: softColors[index % softColors.length],
        pointRadius: 6,
      })),
      {
        label: "Intended",
        data: intended ? [intended] : [],
        backgroundColor: "blue",
        pointRadius: 8,
      },
      {
        label: "Actual",
        data: actual ? [actual] : [],
        backgroundColor: "red",
        pointRadius: 8,
      },
    ],
  };

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: "top" },
      annotation: {
        annotations: {
          outerStrikeZone: {
            type: "box",
            xMin: -0.83,
            xMax: 0.83,
            yMin: 1.513,
            yMax: 3.67,
            borderWidth: 2,
            borderColor: "rgba(0, 0, 0, 0.7)",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
          } as AnnotationOptions,
          innerStrikeZone: {
            type: "box",
            xMin: -0.703,
            xMax: 0.703,
            yMin: 1.64,
            yMax: 3.55,
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.7)",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
          } as AnnotationOptions,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Horizontal Location (ft)",
        },
        min: -3,
        max: 3,
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        title: {
          display: true,
          text: "Vertical Location (ft)",
        },
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    layout: {
      padding: {
        top: 20,
      },
    },
    aspectRatio: 1,
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-8">
      {/* Dropdown */}
      <div className="mb-6 w-full max-w-sm">
        <label
          htmlFor="pitch-type"
          className="block text-lg font-medium text-gray-700 mb-2 text-center"
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

      {/* Chart */}
      <div className="flex justify-center items-center lg:col-span-2 bg-white p-6 rounded shadow">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Pitch Location (Strike Zone)
          </h2>
          <div
            style={{
              width: "600px",
              height: "600px",
            }}
          >
            <Scatter
              ref={chartRef}
              data={data}
              options={options}
              onClick={(event) =>
                handleChartClick(
                  event as React.MouseEvent<HTMLCanvasElement>,
                  intended === null ? "intended" : "actual"
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

      {/* Pitch Data */}
      <div className="mt-10 max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Pitch Data</h2>
        <ul className="list-disc pl-6 space-y-3">
          {pitches.map((pitch, index) => (
            <li key={index} className="text-gray-700">
              <span className="font-bold">Pitch Type:</span> {pitch.pitchType} |{" "}
              <span className="font-bold">Intended:</span> (
              {pitch.intended.x.toFixed(2)} ft, {pitch.intended.y.toFixed(2)}{" "}
              ft) | <span className="font-bold">Actual:</span> (
              {pitch.actual.x.toFixed(2)} ft, {pitch.actual.y.toFixed(2)} ft) |{" "}
              <span className="font-bold">Distance:</span>{" "}
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
