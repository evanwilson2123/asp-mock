'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import SignInPrompt from '../SignInPrompt';
import { Line } from 'react-chartjs-2';
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

interface AvgPitchSpeed {
  date: string;
  pitchType: string;
  avgSpeed: number;
}

interface Session {
  sessionId: string;
  date: string;
  sessionName?: string; // Added optional sessionName
}

interface TrackmanData {
  pitchStats: { pitchType: string; peakSpeed: number }[];
  avgPitchSpeeds: AvgPitchSpeed[];
  sessions: Session[];
}

/**
 * TrackmanStats Component
 *
 * Provides data visualization for pitching sessions using Trackman data,
 * now with inline editing for session names.
 */
const TrackmanStats: React.FC = () => {
  const [peakVelocities, setPeakVelocities] = useState<
    { pitchType: string; peakSpeed: number }[]
  >([]);
  const [averageVelocities, setAverageVelocities] = useState<AvgPitchSpeed[]>(
    []
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline editing state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState<string>('');

  const { athleteId } = useParams();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchTrackmanData = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/reports/trackman`);
        if (!res.ok) {
          const errMsg =
            res.status === 404
              ? 'Trackman data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errMsg);
          return;
        }
        const data: TrackmanData = await res.json();
        setPeakVelocities(data.pitchStats || []);
        setAverageVelocities(data.avgPitchSpeeds || []);
        setSessions(data.sessions || []);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackmanData();
  }, [athleteId]);

  if (!isLoaded || loading) return <Loader />;
  if (!role) return <SignInPrompt />;
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
          techName: 'trackman',
        }),
      });
      if (!res.ok) {
        console.error('Failed to update session name');
        return;
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, sessionName: newSessionName } : s
        )
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Prepare chart data for average pitch speeds
  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];
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
    backgroundColor: colors[index % colors.length] + '33',
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
      legend: { position: 'top' as const },
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

        {/* Clickable Session List with inline editing */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Clickable)
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
                    <a
                      href={`/trackman/${session.sessionId}`}
                      className="flex-1 text-black"
                    >
                      {session.date + ' '}
                      {session.sessionName && session.sessionName.trim() !== ''
                        ? session.sessionName
                        : '(' + session.sessionId + ')'}
                    </a>
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
                style={{ borderColor: colors[index % colors.length] }}
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
