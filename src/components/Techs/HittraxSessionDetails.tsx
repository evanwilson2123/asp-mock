'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Import BarElement for bar charts
  Title,
  Tooltip,
  Legend,
  // Plugin,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ErrorMessage from '../ErrorMessage';
import StrikeZone from '@/components/StrikeZone'; // <-- Imported StrikeZone
import AthleteSidebar from '../Dash/AthleteSidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Register BarElement
  Title,
  Tooltip,
  Legend
);

interface Hit {
  velo: number | null;
  dist: number | null;
  LA: number | null;
  sprayChartX?: number | null;
  sprayChartZ?: number | null;
}

interface SessionData {
  hits: Hit[];
  maxExitVelo: number;
  maxDistance: number;
  avgLaunchAngle: number;
  avgVelocitiesByHeight: { [key: string]: number };
  avgVelocitiesByZone: { [key: string]: number };
  top12_5PercentStats: {
    avgVelo: number;
    avgDistance: number;
    avgLaunchAngle: number;
  };
  percentOptimalLA: string;
  // Added percentByZone property as an object with each zone's percentage
  percentByZone: {
    topLeft: number;
    topCenter: number;
    topRight: number;
    middleLeft: number;
    middleCenter: number;
    middleRight: number;
    bottomLeft: number;
    bottomCenter: number;
    bottomRight: number;
  };
}

/**
 * HitTraxSessionDetails Component
 *
 * Displays hit session details along with several charts:
 * 1. A Line chart showing hit data over time (exit velocity, distance, launch angle).
 * 2. A square Scatter chart (spray chart) plotting ball landing positions.
 *    The spray chart uses the fieldBackgroundPlugin to draw the baseball field.
 * 3. Two Bar charts showing average exit velocities by height zone and spray zone.
 * 4. Instead of a bar chart for the top 12.5% hardest hits, the numbers are shown below the max stats.
 * 5. A new StrikeZone component that visualizes the positive outcome percentage by zone.
 */
const HitTraxSessionDetails: React.FC = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sessionId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/hittrax/session/${sessionId}`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'HitTrax data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errorMessage);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.hits) {
          throw new Error('Required hit data not provided');
        }
        console.log(data.percentByZone);
        setSessionData(data);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role} message={errorMessage} />
      </div>
    );

  if (!sessionData) return null;

  const {
    hits,
    maxExitVelo,
    maxDistance,
    avgLaunchAngle,
    avgVelocitiesByHeight,
    avgVelocitiesByZone,
    top12_5PercentStats,
    percentOptimalLA,
    percentByZone, // Destructure percentByZone from sessionData
  } = sessionData;

  // Prepare data for the Line chart.
  const labels = hits.map((_, i) => `Swing ${i + 1}`);
  const exitVeloData = hits.map((h) => (h.velo !== null ? h.velo : 0));
  const distanceData = hits.map((h) => (h.dist !== null ? h.dist : 0));
  const launchAngleData = hits.map((h) => (h.LA !== null ? h.LA : 0));

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Exit Velocity (mph)',
        data: exitVeloData,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: 'white',
        pointRadius: 6,
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Distance (ft)',
        data: distanceData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: 'white',
        pointRadius: 6,
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Launch Angle (°)',
        data: launchAngleData,
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointBorderColor: 'white',
        pointRadius: 6,
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Prepare data for the Bar chart (Average Velocities by Height Zone)
  const heightBarChartData = {
    labels: ['Low', 'Middle', 'Top'],
    datasets: [
      {
        label: 'Average Exit Velocity (mph)',
        data: [
          avgVelocitiesByHeight['low'] || 0,
          avgVelocitiesByHeight['middle'] || 0,
          avgVelocitiesByHeight['top'] || 0,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const heightBarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Average Exit Velocity by Height Zone',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Velocity (mph)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Height Zone',
        },
      },
    },
  };

  // Prepare data for the Bar chart (Average Velocities by Spray Zone)
  const sprayBarChartData = {
    labels: ['Pull', 'Center', 'Opposite'],
    datasets: [
      {
        label: 'Average Exit Velocity (mph)',
        data: [
          avgVelocitiesByZone['pull'] || 0,
          avgVelocitiesByZone['center'] || 0,
          avgVelocitiesByZone['opposite'] || 0,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const sprayBarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Average Exit Velocity by Spray Zone',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Velocity (mph)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Spray Zone',
        },
      },
    },
  };

  // Convert percentByZone object into an ordered array for the StrikeZone component.
  const orderedSections = [
    percentByZone.topLeft || 0,
    percentByZone.topCenter || 0,
    percentByZone.topRight || 0,
    percentByZone.middleLeft || 0,
    percentByZone.middleCenter || 0,
    percentByZone.middleRight || 0,
    percentByZone.bottomLeft || 0,
    percentByZone.bottomCenter || 0,
    percentByZone.bottomRight || 0,
  ];

  console.log(orderedSections);
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <div className="rounded border-2 border-gray-300 bg-white mb-4">
          <h1 className="text-3xl font-bold text-gray-700 justify-center flex">
            Session Totals
          </h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow w-full md:w-1/4 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-600 justify-center flex">
              Max Exit Velocity
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {maxExitVelo.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/4 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-600 justify-center flex">
              Max Distance
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {maxDistance.toFixed(1)} ft
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/4 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-600 justify-center flex">
              Avg Launch Angle
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {avgLaunchAngle.toFixed(1)} °
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/4 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-600 justify-center flex">
              % Launch Angle 7° - 25°
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {percentOptimalLA}%
            </div>
          </div>
        </div>

        {/* New StrikeZone Section */}
        <div className="rounded border-2 border-gray-300 bg-white mb-4">
          <h1 className="text-3xl font-bold text-gray-700 justify-center flex">
            Positive Outcome By Zone
          </h1>
        </div>
        <div className="rounded border-2 border-gray-300 bg-white mb-4">
          <h1 className="text-3xl font-bold text-gray-700 justify-center flex">
            Top 12.5%
          </h1>
        </div>
        {/* Top 12.5% Hardest Hits Statistics as Numbers */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-700 justify-center flex">
              Avg Exit Velocity
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {top12_5PercentStats.avgVelo.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-700 justify-center flex">
              Avg Distance
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {top12_5PercentStats.avgDistance.toFixed(1)} ft
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3 border-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-700 justofy-center flex">
              Avg Launch Angle
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {top12_5PercentStats.avgLaunchAngle.toFixed(1)} °
            </div>
          </div>
        </div>

        {/* Line Chart for Hit Data */}
        <div className="bg-white p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Hit Data Over Time
          </h2>
          {hits.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <p className="text-gray-500">No hit data available.</p>
          )}
        </div>

        <div className="mb-8 flex justify-center">
          <StrikeZone
            width={300}
            height={400}
            x={10}
            y={10}
            redColor="red"
            orangeColor="orange"
            yellowColor="yellow"
            greenColor="green"
            strokeColorBorder="black"
            strokeWidth={2}
            sections={orderedSections}
            fillColor="blue"
          />
        </div>

        {/* Bar Chart for Average Velocities by Height Zone */}
        <div className="bg-white p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Exit Velocities by Height Zone
          </h2>
          {Object.keys(avgVelocitiesByHeight).length > 0 ? (
            <Bar data={heightBarChartData} options={heightBarChartOptions} />
          ) : (
            <p className="text-gray-500">No height zone data available.</p>
          )}
        </div>

        {/* Bar Chart for Average Velocities by Spray Zone */}
        <div className="bg-white p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Exit Velocities by Spray Zone
          </h2>
          {Object.keys(avgVelocitiesByZone).length > 0 ? (
            <Bar data={sprayBarChartData} options={sprayBarChartOptions} />
          ) : (
            <p className="text-gray-500">No spray zone data available.</p>
          )}
        </div>

        {/* Scatter Chart (Spray Chart) with Field Background
        <div className="bg-white p-6 rounded shadow border-2 border-gray-300">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Spray Chart
          </h2>
          {scatterPoints.length > 0 ? (
            <Scatter
              data={scatterData}
              options={scatterOptions}
              plugins={[fieldBackgroundPlugin]}
            />
          ) : (
            <p className="text-gray-500">No spray chart data available.</p>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default HitTraxSessionDetails;
