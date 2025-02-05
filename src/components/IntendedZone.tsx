'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, registerables, ChartOptions } from 'chart.js';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { useRouter } from 'next/navigation';

// Register all necessary Chart.js modules and the annotation plugin
ChartJS.register(...registerables, annotationPlugin);

interface Pitch {
  level: string;
  intended: { x: number; y: number };
  actual: { x: number; y: number };
  pitchType: string;
  distance: { feet: number; percent: number; inches: number };
}

const pitchTypes = ['4-seam', '2-seam', 'curveball', 'slider', 'changeup'];
const softColors = [
  'rgba(255, 99, 132, 0.5)',
  'rgba(54, 162, 235, 0.5)',
  'rgba(75, 192, 192, 0.5)',
  'rgba(153, 102, 255, 0.5)',
  'rgba(255, 159, 64, 0.5)',
];

// ----- Added Athlete Interfaces and Selection State ----- //
interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

// ----- Helper function: get window dimensions ----- //
interface WindowSize {
  width: number;
  height: number;
}

const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
};

// Outer strike zone boundaries.
const outerXMin = -0.83;
const outerXMax = 0.83;
const outerYMin = 1.513;
const outerYMax = 3.67;

// Calculate grid line positions for a 3x3 grid within the outer strike zone.
const outerWidth = outerXMax - outerXMin;
const outerHeight = outerYMax - outerYMin;

const verticalLine1 = outerXMin + outerWidth / 3;
const verticalLine2 = outerXMin + (2 * outerWidth) / 3;

const horizontalLine1 = outerYMin + outerHeight / 3;
const horizontalLine2 = outerYMin + (2 * outerHeight) / 3;

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
  // ===== Athlete Selection State and Effect =====
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesLoading, setAthletesLoading] = useState<boolean>(true);
  const [athletesError, setAthletesError] = useState<string | null>(null);

  // Filter and pagination state for athlete selection (similar to ManageAthletes)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const router = useRouter();

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const res = await fetch('/api/manage-athletes');
        if (!res.ok) {
          throw new Error('Failed to fetch athletes');
        }
        const data = await res.json();
        setAthletes(data.athletes || []);
      } catch (err: any) {
        setAthletesError(err.message || 'An unexpected error occurred');
      } finally {
        setAthletesLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // Filter logic (similar to ManageAthletes)
  const filteredAthletes = athletes.filter((athlete) => {
    const fullName = (athlete.firstName + ' ' + athlete.lastName).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesLevel =
      selectedLevel === 'All' || athlete.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalPages = Math.ceil(filteredAthletes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex);

  // ----- End Athlete Selection State -----

  // ----- Existing Pitching Session State -----
  const chartRef = useRef<ChartJS<'scatter'> | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [intended, setIntended] = useState<{ x: number; y: number } | null>(
    null
  );
  const [actual, setActual] = useState<{ x: number; y: number } | null>(null);
  const [pitchType, setPitchType] = useState<string>('4-seam');

  // Window dimensions to ensure large screen
  const { width, height } = useWindowSize();

  // Store the scaled glove image as a canvas.
  const [gloveImage, setGloveImage] = useState<HTMLCanvasElement | null>(null);

  // Load and scale the glove image on mount.
  useEffect(() => {
    const img = new Image();
    img.src = 'mitt.webp'; // Ensure this path is correct and the image exists.
    img.onload = () => {
      const scaled = createScaledImage(img, 0.4);
      setGloveImage(scaled);
    };
  }, []);

  // If the window dimensions are not large enough, return an alternative UI.
  if (width && height && (width < 1024 || height < 768)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <h1 className="text-white text-2xl">
          This page is only available for large screens.
        </h1>
      </div>
    );
  }

  // ----- If no athlete is selected, show the athlete selection view -----
  if (!selectedAthlete) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Select Athlete
        </h1>
        {athletesLoading ? (
          <p>Loading athletes...</p>
        ) : athletesError ? (
          <p className="text-red-500">Error: {athletesError}</p>
        ) : (
          <>
            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-gray-700 font-semibold mb-1"
                >
                  Search by Name:
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="e.g. John"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="level-filter"
                  className="block text-gray-700 font-semibold mb-1"
                >
                  Filter by Level:
                </label>
                <select
                  id="level-filter"
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border rounded text-black"
                >
                  {[
                    'All',
                    ...Array.from(new Set(athletes.map((a) => a.level))).sort(),
                  ].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Athletes Table */}
            {paginatedAthletes.length > 0 ? (
              <>
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700">
                      <th className="py-2 px-4 text-left">First Name</th>
                      <th className="py-2 px-4 text-left">Last Name</th>
                      <th className="py-2 px-4 text-left">Email</th>
                      <th className="py-2 px-4 text-left">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAthletes.map((athlete) => (
                      <tr
                        key={athlete._id}
                        onClick={() => setSelectedAthlete(athlete)}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="text-black py-2 px-4">
                          {athlete.firstName}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.lastName}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.email}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      if (currentPage > 1) setCurrentPage((prev) => prev - 1);
                    }}
                    disabled={currentPage <= 1}
                    className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded ${
                            page === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-black'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (currentPage < totalPages)
                        setCurrentPage((prev) => prev + 1);
                    }}
                    disabled={currentPage >= totalPages}
                    className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-lg text-blue-900 text-center mt-4">
                No athletes found matching your filters.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // ----- Existing IntendedZone (Pitching Session) UI below -----
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
            inches: parseFloat((distanceFeet * 12).toFixed(2)),
          },
          level: selectedAthlete.level,
        },
      ]);
      console.log(
        `distance inches: ${parseFloat((distanceFeet * 12).toFixed(2))}`
      );
      console.log(`distance: ${distanceFeet}`);
      setIntended(null);
      setActual(null);
    } else {
      alert('Please select both intended and actual pitch locations.');
    }
  };

  // Undo last pitch (with confirmation)
  const handleUndoPitch = () => {
    if (pitches.length === 0) {
      alert('No pitches to undo.');
      return;
    }
    const confirmUndo = window.confirm(
      'Are you sure you want to undo the last pitch?'
    );
    if (confirmUndo) {
      setPitches(pitches.slice(0, pitches.length - 1));
    }
  };

  // Submit the pitching session to /api/intended-zone
  const handleSubmitSession = async () => {
    if (pitches.length === 0) {
      alert('There are no pitches to submit.');
      return;
    }
    try {
      const payload = {
        athleteId: selectedAthlete._id,
        pitches,
      };
      const res = await fetch('/api/intended-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to submit session');
      }
      alert('Session submitted successfully!');
      const { sessionId } = await res.json();
      router.push(`/intended-zone/${sessionId}`);
      // Optionally clear the session
      setPitches([]);
    } catch (err: any) {
      alert(err.message || 'An error occurred while submitting the session');
    }
  };

  // Construct the data object for the scatter chart.
  const data = {
    datasets: [
      ...pitchTypes.map((type, index) => ({
        label: type,
        data: pitches
          .filter((pitch) => pitch.pitchType === type)
          .map((pitch) => ({ x: pitch.actual.x, y: pitch.actual.y })),
        backgroundColor: softColors[index % softColors.length],
        pointRadius: 6,
        order: 0,
        z: 0,
      })),
      {
        label: 'Intended',
        data: intended ? [intended] : [],
        pointStyle: gloveImage || 'circle',
        pointRadius: gloveImage ? 10 : 8,
        order: 1,
        z: 1,
      },
      {
        label: 'Actual',
        data: actual ? [actual] : [],
        backgroundColor: 'red',
        pointRadius: 14,
        order: 2,
        z: 2,
      },
    ],
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 0 },
    layout: { padding: { top: 20 } },
    scales: {
      x: {
        title: {
          display: false,
          text: 'Horizontal Location (ft)',
          color: 'white',
        },
        min: -2.5,
        max: 2.5,
        ticks: { stepSize: 0.5, color: 'white' },
        grid: { color: '#1a202c' },
      },
      y: {
        title: {
          display: false,
          text: 'Vertical Location (ft)',
          color: 'white',
        },
        min: 0.0915,
        max: 5.0915,
        ticks: { stepSize: 0.5, color: 'white' },
        grid: { color: '#1a202c' },
      },
    },
    plugins: {
      legend: { display: false },
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
            borderWidth: 3,
            borderColor: 'white',
            backgroundColor: 'transparent',
          } as AnnotationOptions,
          innerStrikeZone: {
            type: 'box',
            xMin: -0.703,
            xMax: 0.703,
            yMin: 1.64,
            yMax: 3.55,
            borderWidth: 2,
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
            borderWidth: 2,
          } as AnnotationOptions,
          gridV2: {
            type: 'line',
            xMin: verticalLine2,
            xMax: verticalLine2,
            yMin: outerYMin,
            yMax: outerYMax,
            borderColor: 'white',
            borderWidth: 2,
          } as AnnotationOptions,
          gridH1: {
            type: 'line',
            yMin: horizontalLine1,
            yMax: horizontalLine1,
            xMin: outerXMin,
            xMax: outerXMax,
            borderColor: 'white',
            borderWidth: 2,
          } as AnnotationOptions,
          gridH2: {
            type: 'line',
            yMin: horizontalLine2,
            yMax: horizontalLine2,
            xMin: outerXMin,
            xMax: outerXMax,
            borderColor: 'white',
            borderWidth: 2,
          } as AnnotationOptions,
        },
      },
    },
    aspectRatio: 1,
  };

  return (
    <div className="flex flex-col items-center justify-center bg-black min-h-screen">
      <div className="flex flex-row items-center justify-center w-full gap-8">
        <div className="flex flex-col items-center">
          <label
            htmlFor="pitch-type"
            className="block text-lg font-medium text-white mb-2"
          >
            Select Pitch Type:
          </label>
          <select
            id="pitch-type"
            value={pitchType}
            onChange={(e) => setPitchType(e.target.value)}
            className="border border-gray-300 rounded-md p-3 bg-white text-gray-700 w-48 shadow-md focus:outline-blue-400 focus:ring focus:ring-blue-300"
          >
            {pitchTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-20" style={{ width: '1200px', height: '1200px' }}>
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

        <div className="flex flex-col items-center">
          <button
            onClick={handleAddPitch}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition mb-4"
          >
            Add Pitch
          </button>
          <button
            onClick={handleUndoPitch}
            className="bg-yellow-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-yellow-600 transition mb-4"
          >
            Undo Pitch
          </button>
          <button
            onClick={handleSubmitSession}
            className="bg-green-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition"
          >
            Submit Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntendedZone;
