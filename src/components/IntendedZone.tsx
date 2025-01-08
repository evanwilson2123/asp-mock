"use client";
import React, { useState } from "react";

interface Pitch {
  intended: { x: number; y: number };
  actual: { x: number; y: number };
  pitchType: string;
  distance: number; // Distance in inches
}

const IntendedZone: React.FC = () => {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [intended, setIntended] = useState<{ x: number; y: number } | null>(
    null
  );
  const [actual, setActual] = useState<{ x: number; y: number } | null>(null);
  const [pitchType, setPitchType] = useState<string>("4-seam");

  const handleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    type: "intended" | "actual"
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Calculate the x and y percentages relative to the entire grid
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (type === "intended") {
      setIntended({ x, y });
    } else if (type === "actual") {
      setActual({ x, y });
    }
  };

  const handleAddPitch = () => {
    if (intended && actual) {
      // Scale the x and y differences to inches (17 inches wide, 23 inches tall)
      const deltaX = ((actual.x - intended.x) / 100) * 19.94; // x-difference in inches
      const deltaY = ((actual.y - intended.y) / 100) * 25.79; // y-difference in inches

      // Calculate the Euclidean distance in inches
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2);

      setPitches([
        ...pitches,
        {
          intended,
          actual,
          pitchType,
          distance: parseFloat(distance),
        },
      ]);
      setIntended(null);
      setActual(null);
    } else {
      alert("Please select both intended and actual pitch locations.");
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 h-screen p-6">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            Intended Zone Tracker
          </h1>
          <p className="text-gray-500">
            Track pitch accuracy with a detailed breakdown of intended vs.
            actual pitch locations.
          </p>
        </header>

        {/* Pitch Type Dropdown */}
        <div className="mb-6">
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
            className="border border-gray-300 rounded-md p-2 bg-white text-gray-700 w-full max-w-sm"
          >
            <option value="4-seam">4-Seam Fastball</option>
            <option value="2-seam">2-Seam Fastball</option>
            <option value="curveball">Curveball</option>
            <option value="slider">Slider</option>
            <option value="changeup">Changeup</option>
          </select>
        </div>

        {/* Strike Zone */}
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Strike Zone (Click to Select Locations)
          </h2>
          <div
            className="border border-black relative bg-gray-50"
            style={{
              width: "300px",
              height: "300px",
              position: "relative",
            }}
            onClick={(e) =>
              handleClick(e, intended === null ? "intended" : "actual")
            }
          >
            {/* Draw the strike zone rectangle with 3x3 grid lines */}
            <div
              style={{
                position: "absolute",
                left: "20%",
                top: "20%",
                width: "60%",
                height: "60%",
                border: "2px solid black",
                display: "grid",
                gridTemplateRows: "1fr 1fr 1fr",
                gridTemplateColumns: "1fr 1fr 1fr",
                zIndex: 1,
                pointerEvents: "none", // Ensure the grid doesn't block clicks
              }}
            >
              {/* Horizontal and Vertical Grid Lines */}
              <div
                style={{
                  gridRow: "1 / 4",
                  gridColumn: "2 / 3",
                  borderLeft: "1px solid black",
                  pointerEvents: "none",
                }}
              ></div>
              <div
                style={{
                  gridRow: "1 / 4",
                  gridColumn: "3 / 4",
                  borderLeft: "1px solid black",
                  pointerEvents: "none",
                }}
              ></div>
              <div
                style={{
                  gridRow: "2 / 3",
                  gridColumn: "1 / 4",
                  borderTop: "1px solid black",
                  pointerEvents: "none",
                }}
              ></div>
              <div
                style={{
                  gridRow: "3 / 4",
                  gridColumn: "1 / 4",
                  borderTop: "1px solid black",
                  pointerEvents: "none",
                }}
              ></div>
            </div>

            {/* Render intended dot */}
            {intended && (
              <div
                style={{
                  position: "absolute",
                  left: `${intended.x}%`,
                  top: `${intended.y}%`,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "blue",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2, // Ensure dots are above the strike zone
                }}
              ></div>
            )}

            {/* Render actual dot */}
            {actual && (
              <div
                style={{
                  position: "absolute",
                  left: `${actual.x}%`,
                  top: `${actual.y}%`,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2, // Ensure dots are above the strike zone
                }}
              ></div>
            )}
          </div>
        </div>

        {/* Add Pitch Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAddPitch}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600"
          >
            Add Pitch
          </button>
        </div>

        {/* Display Pitches */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Pitch Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            {pitches.map((pitch, index) => (
              <li key={index} className="text-gray-700">
                <span className="font-bold">Pitch Type:</span> {pitch.pitchType}{" "}
                | <span className="font-bold">Intended:</span> (
                {pitch.intended.x.toFixed(1)}%, {pitch.intended.y.toFixed(1)}%)
                | <span className="font-bold">Actual:</span> (
                {pitch.actual.x.toFixed(1)}%, {pitch.actual.y.toFixed(1)}%) |{" "}
                <span className="font-bold">Distance:</span> {pitch.distance}{" "}
                inches
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IntendedZone;
