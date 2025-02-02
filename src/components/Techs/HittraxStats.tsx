'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import Link from 'next/link';
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
import { Line } from 'react-chartjs-2';
import ErrorMessage from '../ErrorMessage';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SessionAverage {
  date: string;
  avgExitVelo: number;
}

interface Session {
  sessionId: string;
  date: string;
}

/**
 * HitTraxStats Component
 *
 * This component provides an in-depth view of an athlete's hitting performance
 * using data from HitTrax sessions. It visualizes metrics like Exit Velocity,
 * Distance, and Hard Hit Average to help coaches and athletes analyze trends
 * and identify areas for improvement.
 *
 * Key Features:
 * - **Dynamic Data Fetching:**
 *   - Retrieves HitTrax data including maximum exit velocity, distance,
 *     hard-hit average, and session averages.
 *   - Handles errors gracefully with descriptive feedback messages.
 *
 * - **Performance Metrics Visualization:**
 *   - Displays key statistics:
 *     - **Max Exit Velocity (mph)**
 *     - **Max Distance (ft)**
 *     - **Hard Hit Average (%)**
 *   - Circular stat cards highlight each metric for clear, quick insights.
 *
 * - **Session Tracking:**
 *   - Lists past sessions with clickable links for deeper analysis of each session.
 *   - Sessions are sorted from the latest to the earliest for easy access.
 *
 * - **Interactive Line Chart:**
 *   - Tracks the trend of **Average Exit Velocity** over time.
 *   - Provides responsive, interactive visualization with hover tooltips.
 *
 * - **Role-Based Navigation:**
 *   - Dynamically renders the **CoachSidebar** or **Sidebar** based on the user's role.
 *   - Ensures a personalized experience for coaches and athletes.
 *
 * - **Mobile-Responsive Design:**
 *   - Optimized layout for both mobile and desktop views using Tailwind CSS.
 *   - Sidebar toggles for mobile and persistent display on larger screens.
 *
 * Technologies Used:
 * - **React** with hooks (`useState`, `useEffect`) for state management and lifecycle control
 * - **Next.js** for routing and API integration
 * - **Clerk** for authentication and user role management
 * - **Chart.js** with `react-chartjs-2` for data visualization
 * - **Tailwind CSS** for clean, responsive UI styling
 *
 * Usage:
 * - Ideal for coaches and athletes reviewing performance trends over time.
 * - Provides insights into hitting power, consistency, and hard-hit rates.
 * - Allows easy navigation to individual sessions for granular performance breakdowns.
 */

const HitTraxStats: React.FC = () => {
  const [maxExitVelo, setMaxExitVelo] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [hardHitAverage, setHardHitAverage] = useState<number>(0);
  const [sessionData, setSessionData] = useState<SessionAverage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchHitTraxData = async () => {
      try {
        const response = await fetch(
          `/api/athlete/${athleteId}/reports/hittrax`
        );
        if (!response.ok) {
          const errorMessage =
            response.status === 404
              ? 'Hittrax data could not be found.'
              : response.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errorMessage);
          return;
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setMaxExitVelo(data.maxExitVelo || 0);
        setMaxDistance(data.maxDistance || 0);
        setHardHitAverage(data.hardHitAverage || 0);
        setSessionData(data.sessionAverages || []);
        setSessions(data.sessions || []);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHitTraxData();
  }, [athleteId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  // Prepare data for the line chart
  const labels = sessionData.map((s) => s.date);
  const avgExitVeloData = sessionData.map((s) => s.avgExitVelo);

  const data = {
    labels,
    datasets: [
      {
        label: 'Avg Exit Velo',
        data: avgExitVeloData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    // Use flex-col on mobile and flex-row on md and above
    <div className="flex flex-col overflow-x-hidden md:flex-row min-h-screen">
      {/* Mobile Sidebar (visible on mobile) */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Desktop Sidebar (visible on md and above) */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          HitTrax Report
        </h1>

        {/* Session List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Latest to Earliest)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.map((session) => (
              <li
                key={session.sessionId}
                className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
              >
                <Link href={`/hittrax/${session.sessionId}`}>
                  {session.date} (Session ID: {session.sessionId})
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats with Circles */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Max Exit Velocity
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-blue-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-blue-600">
                {maxExitVelo.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-blue-600 font-medium">mph</p>
          </div>
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Max Distance
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-green-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-green-600">
                {maxDistance.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-green-600 font-medium">ft</p>
          </div>
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Hard Hit Average
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-red-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-red-600">
                {(hardHitAverage * 100).toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-red-600 font-medium">%</p>
          </div>
        </div>

        {/* Line Chart for Avg Exit Velocity Over Time */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Exit Velocity Over Time
          </h2>
          {sessionData.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HitTraxStats;
