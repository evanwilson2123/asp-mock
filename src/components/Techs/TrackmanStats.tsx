'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import SignInPrompt from '../SignInPrompt';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ErrorMessage from '../ErrorMessage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// interface Session {
//   sessionId: string;
//   date: string;
// }

interface AvgPitchSpeed {
  date: string;
  pitchType: string;
  avgSpeed: number;
}

/**
 * TrackmanStats Component
 *
 * This component provides comprehensive data visualization for pitching sessions
 * using Trackman data. It displays:
 *
 * - Peak velocities for each pitch type (in circular metric cards).
 * - A clickable session list for navigation.
 * - A line chart for average pitch velocities over time (grouped by pitch type).
 * - A connections chart is not included here (but can be added similarly).
 *
 * The charts are wrapped in containers with fixed heights and use the
 * maintainAspectRatio option so they remain legible on mobile.
 */
const TrackmanStats: React.FC = () => {
  const [peakVelocities, setPeakVelocities] = useState<
    { pitchType: string; peakSpeed: number }[]
  >([]);
  const [averageVelocities, setAverageVelocities] = useState<AvgPitchSpeed[]>(
    []
  );
  const [sessions, setSessions] = useState<
    { sessionId: string; date: string }[]
  >([]); // Clickable sessions
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { athleteId } = useParams();
  const { user, isLoaded } = useUser(); // Use isLoaded to avoid premature rendering
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchTrackmanData = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/reports/trackman`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'Trackman data could not be found.'
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

        setPeakVelocities(data.pitchStats || []);
        setAverageVelocities(data.avgPitchSpeeds || []);
        setSessions(data.sessions || []); // Add sessions for clickable list
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackmanData();
  }, [athleteId]);

  if (!isLoaded || loading) {
    // Ensure Clerk user data and API data are fully loaded
    return <Loader />;
  }

  if (!role) {
    // Display sign-in prompt only if the role is explicitly null or undefined
    return <SignInPrompt />;
  }

  if (errorMessage) {
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );
  }

  const colors = [
    '#FF6384', // Red
    '#36A2EB', // Blue
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
  ];

  // Prepare chart data for the Averages Over Time chart.
  // Group by pitch type using the unique dates from the data.
  const uniqueDates = [...new Set(averageVelocities.map((d) => d.date))];
  const datasets = Object.entries(
    averageVelocities.reduce(
      (acc, curr) => {
        if (!acc[curr.pitchType]) {
          acc[curr.pitchType] = [];
        }
        acc[curr.pitchType].push(curr.avgSpeed);
        return acc;
      },
      {} as { [key: string]: number[] }
    )
  ).map(([pitchType, avgSpeeds], index) => ({
    label: pitchType,
    data: avgSpeeds,
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length] + '33', // Add transparency
    fill: true,
    tension: 0.3,
  }));

  const mainChartData = {
    labels: uniqueDates,
    datasets,
  };

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden">
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
          Trackman Stats
        </h1>

        {/* Clickable Sessions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Clickable)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.map((session) => (
              <li
                key={session.sessionId}
                className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
              >
                <a
                  href={`/trackman/${session.sessionId}`}
                  className="text-blue-600 hover:underline"
                >
                  {session.date} (Session ID: {session.sessionId})
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Peak Velocities by Pitch Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {peakVelocities.map(({ pitchType, peakSpeed }, index) => (
            <div
              key={pitchType}
              className="bg-white p-6 rounded shadow flex flex-col items-center min-w-0"
            >
              <span className="text-xl font-bold text-gray-600">
                {pitchType} Peak Velocity
              </span>
              <div
                className="mt-4 relative rounded-full w-32 h-32 border-8 flex items-center justify-center"
                style={{
                  borderColor: colors[index % colors.length],
                }}
              >
                <span
                  className="text-2xl font-semibold"
                  style={{ color: colors[index % colors.length] }}
                >
                  {peakSpeed}
                </span>
              </div>
              <p
                className="mt-2 font-medium"
                style={{ color: colors[index % colors.length] }}
              >
                mph
              </p>
            </div>
          ))}
        </div>

        {/* Averages Over Time (Line Chart) */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Averages Over Time
          </h2>
          <div className="w-full h-72 md:h-96">
            {averageVelocities.length > 0 ? (
              <Line data={mainChartData} options={mainChartOptions} />
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackmanStats;
