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
  Plugin,
} from 'chart.js';
import { Line, Scatter, Bar } from 'react-chartjs-2'; // Import Bar
import ErrorMessage from '../ErrorMessage';

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

/**
 * Custom Plugin: fieldBackgroundPlugin
 *
 * This plugin now draws:
 * - Foul lines from home plate (0,0) to the left (-300,300)
 *   and right (300,300) foul poles.
 * - An outfield fence drawn as a quadratic curve between the foul poles,
 *   using (0,400) as a control point to create a bulge that resembles
 *   a typical baseball field.
 */
const fieldBackgroundPlugin: Plugin = {
  id: 'fieldBackground',
  beforeDatasetsDraw: (chart) => {
    const {
      ctx,
      scales: { x: xScale, y: yScale },
    } = chart;
    ctx.save();

    // Define field coordinates in data units
    const homePlate = { x: 0, y: 0 };
    const leftFoulPole = { x: -300, y: 300 };
    const rightFoulPole = { x: 300, y: 300 };

    // Convert data coordinates to pixel coordinates
    const homePlatePx = {
      x: xScale.getPixelForValue(homePlate.x),
      y: yScale.getPixelForValue(homePlate.y),
    };
    const leftFoulPolePx = {
      x: xScale.getPixelForValue(leftFoulPole.x),
      y: yScale.getPixelForValue(leftFoulPole.y),
    };
    const rightFoulPolePx = {
      x: xScale.getPixelForValue(rightFoulPole.x),
      y: yScale.getPixelForValue(rightFoulPole.y),
    };

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    // Draw foul lines from home plate to each foul pole
    ctx.beginPath();
    ctx.moveTo(homePlatePx.x, homePlatePx.y);
    ctx.lineTo(leftFoulPolePx.x, leftFoulPolePx.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(homePlatePx.x, homePlatePx.y);
    ctx.lineTo(rightFoulPolePx.x, rightFoulPolePx.y);
    ctx.stroke();

    // Draw the outfield fence as a quadratic curve.
    // The curve starts at the left foul pole, ends at the right foul pole,
    // and uses a control point above home plate to create a convex arc.
    const controlPointData = { x: 0, y: 400 };
    const controlPointPx = {
      x: xScale.getPixelForValue(controlPointData.x),
      y: yScale.getPixelForValue(controlPointData.y),
    };

    ctx.beginPath();
    ctx.moveTo(leftFoulPolePx.x, leftFoulPolePx.y);
    ctx.quadraticCurveTo(
      controlPointPx.x,
      controlPointPx.y,
      rightFoulPolePx.x,
      rightFoulPolePx.y
    );
    ctx.stroke();

    ctx.restore();
  },
};

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
}

/**
 * HitTraxSessionDetails Component
 *
 * Displays hit session details along with four charts:
 * 1. A Line chart showing hit data over time (exit velocity, distance, launch angle).
 * 2. A square Scatter chart (spray chart) plotting ball landing positions.
 *    The spray chart uses the fieldBackgroundPlugin to draw the baseball field.
 * 3. A Bar chart showing average exit velocities by height zone (low, middle, top).
 * 4. A Bar chart showing average exit velocities by spray zone (pull, center, opposite).
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

  // Prepare data for the Scatter (Spray Chart).
  const scatterPoints = hits
    .filter((h) => h.sprayChartX != null && h.sprayChartZ != null)
    .map((h) => ({
      x: h.sprayChartX as number,
      y: h.sprayChartZ as number,
    }));

  const scatterData = {
    datasets: [
      {
        label: 'Balls Landed',
        data: scatterPoints,
        backgroundColor: 'blue',
        pointRadius: 5,
      },
    ],
  };

  // Adjust the scales so we can accommodate the control point for the outfield fence.
  const scatterOptions = {
    aspectRatio: 1,
    responsive: true,
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        min: -300,
        max: 300,
        title: {
          display: true,
          text: 'Spray Chart X',
        },
      },
      y: {
        type: 'linear' as const,
        min: 0,
        max: 400,
        title: {
          display: true,
          text: 'Spray Chart Y',
        },
      },
    },
  };

  // Prepare data for the Bar chart (Average Velocities by Height Zone)
  const heightBarChartData = {
    labels: ['Low', 'Middle', 'Top'], // Labels for the height zones
    datasets: [
      {
        label: 'Average Exit Velocity (mph)',
        data: [
          avgVelocitiesByHeight['low'] || 0,
          avgVelocitiesByHeight['middle'] || 0,
          avgVelocitiesByHeight['top'] || 0,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.5)', // Blue bars
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
    labels: ['Pull', 'Center', 'Opposite'], // Labels for the spray zones
    datasets: [
      {
        label: 'Average Exit Velocity (mph)',
        data: [
          avgVelocitiesByZone['pull'] || 0,
          avgVelocitiesByZone['center'] || 0,
          avgVelocitiesByZone['opposite'] || 0,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)', // Teal bars (different color for distinction)
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Session Details for {sessionId}
        </h1>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">
              Max Exit Velocity
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-600">
              {maxExitVelo.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">Max Distance</h2>
            <div className="mt-4 text-4xl font-semibold text-green-600">
              {maxDistance.toFixed(1)} ft
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">
              Average Launch Angle
            </h2>
            <div className="mt-4 text-4xl font-semibold text-orange-600">
              {avgLaunchAngle.toFixed(1)} °
            </div>
          </div>
        </div>

        {/* Line Chart for Hit Data */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Hit Data Over Time
          </h2>
          {hits.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <p className="text-gray-500">No hit data available.</p>
          )}
        </div>

        {/* Bar Chart for Average Velocities by Height Zone */}
        <div className="bg-white p-6 rounded shadow mb-8">
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
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Exit Velocities by Spray Zone
          </h2>
          {Object.keys(avgVelocitiesByZone).length > 0 ? (
            <Bar data={sprayBarChartData} options={sprayBarChartOptions} />
          ) : (
            <p className="text-gray-500">No spray zone data available.</p>
          )}
        </div>

        {/* Scatter Chart (Spray Chart) with Field Background */}
        <div className="bg-white p-6 rounded shadow">
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
        </div>
      </div>
    </div>
  );
};

export default HitTraxSessionDetails;
