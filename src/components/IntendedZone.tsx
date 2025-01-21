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
const FIELD_WIDTH_FEET = 1.66; // Strike zone width in feet
// const FIELD_HEIGHT_FEET = 2.157; // Strike zone height in feet

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
      chart.data.datasets.find(
        (dataset) => dataset.label === "Intended"
      )!.data = [point];
    } else {
      setActual(point);
      chart.data.datasets.find((dataset) => dataset.label === "Actual")!.data =
        [point];
    }

    chart.update(); // Refresh the chart to show the new point
  };

  const handleAddPitch = () => {
    if (intended && actual) {
      // Calculate the delta in feet directly
      const deltaXFeet = actual.x - intended.x;
      const deltaYFeet = actual.y - intended.y;

      // Calculate the distance in feet using the Euclidean formula
      const distanceFeet = Math.sqrt(deltaXFeet ** 2 + deltaYFeet ** 2);

      // Convert the distance to inches
      // const distanceInches = distanceFeet * 12;

      setPitches([
        ...pitches,
        {
          intended,
          actual,
          pitchType,
          distance: {
            feet: parseFloat(distanceFeet.toFixed(2)),
            percent: parseFloat((distanceFeet / FIELD_WIDTH_FEET).toFixed(2)),
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
      ...pitches.map((pitch) => ({
        label: pitch.pitchType,
        data: [{ x: pitch.actual.x, y: pitch.actual.y }],
        backgroundColor: softColors[pitchTypes.indexOf(pitch.pitchType)],
        pointRadius: 6,
      })),
    ],
  };

  const options: ChartOptions<"scatter"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
      },
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
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen p-6">
      <div className="mb-6 w-full max-w-md">
        <label
          htmlFor="pitch-type"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Pitch Type:
        </label>
        <select
          id="pitch-type"
          value={pitchType}
          onChange={(e) => setPitchType(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white text-gray-700 w-full"
        >
          {pitchTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2 bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          Pitch Location (Strike Zone)
        </h2>
        <div style={{ width: "600px", height: "600px" }}>
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
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleAddPitch}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600"
        >
          Add Pitch
        </button>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Pitch Data</h2>
        <ul className="list-disc pl-6 space-y-2">
          {pitches.map((pitch, index) => (
            <li key={index} className="text-gray-700">
              <span className="font-bold">Pitch Type:</span> {pitch.pitchType} |{" "}
              <span className="font-bold">Intended:</span> (
              {pitch.intended.x.toFixed(2)}%, {pitch.intended.y.toFixed(2)}%) |{" "}
              <span className="font-bold">Actual:</span> (
              {pitch.actual.x.toFixed(2)}%, {pitch.actual.y.toFixed(2)}%) |{" "}
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
