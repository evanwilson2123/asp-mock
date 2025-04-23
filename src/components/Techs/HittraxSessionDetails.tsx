'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ErrorMessage from '../ErrorMessage';
import StrikeZone from '@/components/StrikeZone';
import AthleteSidebar from '../Dash/AthleteSidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

/* -------------------- CONSTANTS & TOP-LEVEL HOOKS -------------------- */
const hitsPerPage = 10; // pagination size – must live outside conditional logic

/**
 * HitTraxSessionDetails Component
 *
 * Displays hit session details along with charts, stats, and a paginated
 * table of individual hit data.
 */
const HitTraxSessionDetails: React.FC = () => {
  /* -------------------- top-level state hooks (run every render) -------------------- */
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1); // <-- moved here (unconditional)

  /* -------------------- other hooks -------------------- */
  const { sessionId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* -------------------- fetch session data -------------------- */
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/hittrax/session/${sessionId}`);
        if (!res.ok) {
          const message =
            res.status === 404
              ? 'HitTrax data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(message);
          return;
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!data.hits) throw new Error('Required hit data not provided');

        setSessionData(data);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  /* -------------------- reset page on new data -------------------- */
  useEffect(() => {
    // whenever we load a new session, jump back to page 1
    if (sessionData) setCurrentPage(1);
  }, [sessionData]);

  /* -------------------- early-return renders -------------------- */
  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role} message={errorMessage} />
      </div>
    );
  if (!sessionData) return null;

  /* -------------------- destructuring & derived values -------------------- */
  const {
    hits,
    maxExitVelo,
    maxDistance,
    avgLaunchAngle,
    avgVelocitiesByHeight,
    avgVelocitiesByZone,
    top12_5PercentStats,
    percentOptimalLA,
    percentByZone,
  } = sessionData;

  const totalPages = Math.max(1, Math.ceil(hits.length / hitsPerPage));
  const indexOfLastHit = currentPage * hitsPerPage;
  const indexOfFirstHit = indexOfLastHit - hitsPerPage;
  const currentHits = hits.slice(indexOfFirstHit, indexOfLastHit);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  /* -------------------- chart data (unchanged) -------------------- */
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
      legend: { position: 'top' as const },
      title: { display: true, text: 'Average Exit Velocity by Height Zone' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Velocity (mph)' },
      },
      x: { title: { display: true, text: 'Height Zone' } },
    },
  };

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
      legend: { position: 'top' as const },
      title: { display: true, text: 'Average Exit Velocity by Spray Zone' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Velocity (mph)' },
      },
      x: { title: { display: true, text: 'Spray Zone' } },
    },
  };

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

  /* -------------------- component render -------------------- */
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
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
        >
          Back
        </button>

        {/* Session Totals */}
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
              % Launch Angle&nbsp;7°–25°
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {percentOptimalLA}%
            </div>
          </div>
        </div>

        {/* Positive Outcome Zone */}
        <div className="rounded border-2 border-gray-300 bg-white mb-4">
          <h1 className="text-3xl font-bold text-gray-700 justify-center flex">
            Positive Outcome By Zone
          </h1>
        </div>

        {/* Top 12.5% Section */}
        <div className="rounded border-2 border-gray-300 bg-white mb-4">
          <h1 className="text-3xl font-bold text-gray-700 justify-center flex">
            Top&nbsp;12.5%
          </h1>
        </div>
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
            <h2 className="text-lg font-bold text-gray-700 justify-center flex">
              Avg Launch Angle
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-900 justify-center flex">
              {top12_5PercentStats.avgLaunchAngle.toFixed(1)} °
            </div>
          </div>
        </div>

        {/* Strike Zone visualization */}
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

        {/* Paginated Table for Hit Data */}
        <div className="bg-white p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Hit Data</h2>
          {hits.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Swing #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exit&nbsp;Velocity&nbsp;(mph)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance&nbsp;(ft)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Launch&nbsp;Angle&nbsp;(°)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-black">
                    {currentHits.map((hit, idx) => (
                      <tr key={indexOfFirstHit + idx}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {indexOfFirstHit + idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hit.velo !== null ? hit.velo.toFixed(1) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hit.dist !== null ? hit.dist.toFixed(1) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hit.LA !== null ? hit.LA.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No hit data available.</p>
          )}
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
      </div>
    </div>
  );
};

export default HitTraxSessionDetails;
