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
      const deltaX = ((actual.x - intended.x) / 100) * 17; // x-difference in inches
      const deltaY = ((actual.y - intended.y) / 100) * 23; // y-difference in inches

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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Intended Zone Tracker</h1>

      {/* Pitch Type Dropdown */}
      <div className="mb-4">
        <label htmlFor="pitch-type" className="block text-sm font-medium mb-2">
          Select Pitch Type:
        </label>
        <select
          id="pitch-type"
          value={pitchType}
          onChange={(e) => setPitchType(e.target.value)}
          className="border p-2 rounded w-full max-w-xs text-black"
        >
          <option value="4-seam">4-Seam Fastball</option>
          <option value="2-seam">2-Seam Fastball</option>
          <option value="curveball">Curveball</option>
          <option value="slider">Slider</option>
          <option value="changeup">Changeup</option>
        </select>
      </div>

      {/* Strike Zone */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">
          Strike Zone (Click to Select Locations)
        </h2>
        <div
          className="border border-white relative"
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
              border: "2px solid white",
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
                borderLeft: "1px solid white",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                gridRow: "1 / 4",
                gridColumn: "3 / 4",
                borderLeft: "1px solid white",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                gridRow: "2 / 3",
                gridColumn: "1 / 4",
                borderTop: "1px solid white",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                gridRow: "3 / 4",
                gridColumn: "1 / 4",
                borderTop: "1px solid white",
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
        <div className="mt-2">
          <p>
            <span className="font-bold">Intended:</span>{" "}
            {intended
              ? `(${intended.x.toFixed(1)}%, ${intended.y.toFixed(1)}%)`
              : "Not Selected"}
          </p>
          <p>
            <span className="font-bold">Actual:</span>{" "}
            {actual
              ? `(${actual.x.toFixed(1)}%, ${actual.y.toFixed(1)}%)`
              : "Not Selected"}
          </p>
        </div>
      </div>

      {/* Add Pitch Button */}
      <button
        onClick={handleAddPitch}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Add Pitch
      </button>

      {/* Display Pitches */}
      <div className="mt-4">
        <h2 className="text-lg font-medium mb-2">Pitches</h2>
        <ul className="list-disc ml-6">
          {pitches.map((pitch, index) => (
            <li key={index}>
              <span className="font-bold">Pitch Type:</span> {pitch.pitchType} |{" "}
              <span className="font-bold">Intended:</span> (
              {pitch.intended.x.toFixed(1)}%, {pitch.intended.y.toFixed(1)}%) |{" "}
              <span className="font-bold">Actual:</span> (
              {pitch.actual.x.toFixed(1)}%, {pitch.actual.y.toFixed(1)}%) |{" "}
              <span className="font-bold">Distance:</span> {pitch.distance}{" "}
              inches
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IntendedZone;
