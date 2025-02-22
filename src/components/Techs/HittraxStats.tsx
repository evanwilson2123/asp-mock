'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/solid';
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
  avgLA: number;
}

interface Session {
  sessionId: string;
  date: string;
  sessionName?: string; // Optional session name
}

interface ZoneAverage {
  sessionId: string;
  date: string;
  pull: { avgExitVelo: number; avgLA: number };
  center: { avgExitVelo: number; avgLA: number };
  oppo: { avgExitVelo: number; avgLA: number };
}

/**
 * HitTraxStats Component
 *
 * Provides an in-depth view of an athlete's hitting performance using HitTrax data.
 * Includes global metrics (max exit velo, hard hit average, distance metrics),
 * overall session trends, and inline editing for session names.
 */
const HitTraxStats: React.FC = () => {
  // Global metric states
  const [maxExitVelo, setMaxExitVelo] = useState<number>(0);
  const [hardHitAverage, setHardHitAverage] = useState<number>(0);
  // Distance metric states
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [maxPullDistance, setMaxPullDistance] = useState<number>(0);
  const [maxCenterDistance, setMaxCenterDistance] = useState<number>(0);
  const [maxOppoDistance, setMaxOppoDistance] = useState<number>(0);

  // Data and session states
  const [sessionData, setSessionData] = useState<SessionAverage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [zoneData, setZoneData] = useState<ZoneAverage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for inline editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState<string>('');

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
          const errMsg =
            response.status === 404
              ? 'HitTrax data could not be found.'
              : response.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errMsg);
          return;
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setMaxExitVelo(data.maxExitVelo || 0);
        setHardHitAverage(data.hardHitAverage || 0);
        setMaxDistance(data.maxDistance || 0);
        setMaxPullDistance(data.maxPullDistance || 0);
        setMaxCenterDistance(data.maxCenterDistance || 0);
        setMaxOppoDistance(data.maxOppoDistance || 0);
        setSessionData(data.sessionAverages || []);
        setSessions(data.sessions || []);
        setZoneData(data.zoneAverages || []);
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

  // Handler to start editing a session name
  const handleStartEditing = (session: Session) => {
    setEditingSessionId(session.sessionId);
    setNewSessionName(
      session.sessionName && session.sessionName.trim() !== ''
        ? session.sessionName
        : ''
    );
  };

  // Handler to save the new session name
  const handleSaveSessionName = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: newSessionName,
          techName: 'hittrax',
        }),
      });
      if (!res.ok) {
        console.error('Failed to update session name');
        return;
      }
      // Update local state with the new session name
      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.sessionId === sessionId ? { ...s, sessionName: newSessionName } : s
        )
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Chart options and data for overall trends
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  const labels = sessionData.map((s) => s.date);
  const avgExitVeloData = sessionData.map((s) => s.avgExitVelo);
  const avgLAData = sessionData.map((s) => s.avgLA);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Avg Exit Velo (mph)',
        data: avgExitVeloData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Avg Launch Angle (°)',
        data: avgLAData,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  // Prepare chart data for zone averages
  const zoneLabels = zoneData.map((z) => z.date);
  const zonePullVeloData = zoneData.map((z) => z.pull.avgExitVelo);
  const zoneCenterVeloData = zoneData.map((z) => z.center.avgExitVelo);
  const zoneOppoVeloData = zoneData.map((z) => z.oppo.avgExitVelo);
  const zonePullLAData = zoneData.map((z) => z.pull.avgLA);
  const zoneCenterLAData = zoneData.map((z) => z.center.avgLA);
  const zoneOppoLAData = zoneData.map((z) => z.oppo.avgLA);

  const zoneChartData = {
    labels: zoneLabels,
    datasets: [
      {
        label: 'Pull Avg Exit Velo (mph)',
        data: zonePullVeloData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Center Avg Exit Velo (mph)',
        data: zoneCenterVeloData,
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Oppo Avg Exit Velo (mph)',
        data: zoneOppoVeloData,
        borderColor: 'rgba(153, 102, 255, 0.8)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Pull Avg Launch Angle (°)',
        data: zonePullLAData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Center Avg Launch Angle (°)',
        data: zoneCenterLAData,
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Oppo Avg Launch Angle (°)',
        data: zoneOppoLAData,
        borderColor: 'rgba(153, 102, 255, 0.8)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.2,
      },
    ],
  };

  // Define arrays for the two metric sections
  const globalMetrics = [
    {
      label: 'Max Exit Velocity',
      value: maxExitVelo,
      unit: 'mph',
      color: 'blue',
    },
    {
      label: 'Hard Hit Average',
      value: hardHitAverage * 100,
      unit: '%',
      color: 'red',
    },
  ];

  const distanceMetrics = [
    {
      label: 'Max All-Time Distance',
      value: maxDistance,
      unit: 'ft',
      color: 'green',
    },
    {
      label: 'Max Pull Distance',
      value: maxPullDistance,
      unit: 'ft',
      color: 'purple',
    },
    {
      label: 'Max Center Distance',
      value: maxCenterDistance,
      unit: 'ft',
      color: 'orange',
    },
    {
      label: 'Max Oppo Distance',
      value: maxOppoDistance,
      unit: 'ft',
      color: 'yellow',
    },
  ];

  return (
    <div className="flex flex-col overflow-x-hidden md:flex-row min-h-screen">
      {/* Sidebar for mobile and desktop */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          HitTrax Report
        </h1>

        {/* Clickable Session List with inline editing */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Latest to Earliest)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.map((session) => (
              <li
                key={session.sessionId}
                className="flex items-center justify-between py-2 px-4 hover:bg-gray-100"
              >
                {editingSessionId === session.sessionId ? (
                  <>
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="flex-1 border p-1 mr-2"
                    />
                    <button
                      onClick={() => handleSaveSessionName(session.sessionId)}
                      className="px-3 py-1 text-green-600 border border-green-600 mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="px-3 py-1 text-red-600 border border-red-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/hittrax/${session.sessionId}`}
                      className="flex-1"
                    >
                      {session.date + ' '}
                      {session.sessionName && session.sessionName.trim() !== ''
                        ? session.sessionName
                        : session.sessionId}
                    </Link>
                    <button
                      onClick={() => handleStartEditing(session)}
                      className="ml-4 px-3 py-1 text-gray-900 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Global Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {globalMetrics.map(({ label, value, unit, color }, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded shadow flex flex-col items-center"
            >
              <span className="text-xl font-bold text-gray-600">{label}</span>
              <div
                className={`mt-4 relative rounded-full w-40 h-40 border-8 border-${color}-200 flex items-center justify-center`}
              >
                <span className={`text-3xl font-semibold text-${color}-600`}>
                  {value.toFixed(1)}
                </span>
              </div>
              <p className={`mt-2 text-${color}-600 font-medium`}>{unit}</p>
            </div>
          ))}
        </div>

        {/* Distance Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {distanceMetrics.map(({ label, value, unit, color }, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded shadow flex flex-col items-center"
            >
              <span className="text-xl font-bold text-gray-600">{label}</span>
              <div
                className={`mt-4 relative rounded-full w-40 h-40 border-8 border-${color}-200 flex items-center justify-center`}
              >
                <span className={`text-3xl font-semibold text-${color}-600`}>
                  {value.toFixed(1)}
                </span>
              </div>
              <p className={`mt-2 text-${color}-600 font-medium`}>{unit}</p>
            </div>
          ))}
        </div>

        {/* Overall Chart Section */}
        <div
          className="bg-white p-6 rounded shadow mb-8"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Exit Velocity & Launch Angle Over Time
          </h2>
          {sessionData.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>

        {/* Zone Averages Chart Section */}
        <div
          className="bg-white p-6 rounded shadow"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Zone Averages (Pull, Center & Oppo)
          </h2>
          {zoneData.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line data={zoneChartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-500">No zone data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HitTraxStats;
