'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '../Dash/Sidebar';
import Loader from '../Loader';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
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
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js modules and the annotation plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

// Extend the session average interface to include all required fields
interface SessionAvg {
  date: string;
  avgBatSpeed: number;
  avgHandSpeed: number;
  avgRotaionalAcceleration: number;
  avgPower: number;
  avgEarlyConnection: number;
  avgConnectionAtImpacts: number;
}

interface Session {
  sessionId: string;
  sessionName: string;
  date: string;
}

/**
 * BlastMotionStats Component
 *
 * This component displays comprehensive Blast Motion data for an athlete,
 * including session history, maximum performance metrics, and detailed trend
 * visualizations for various swing statistics.
 */
const BlastMotionStats: React.FC = () => {
  const [maxBatSpeed, setMaxBatSpeed] = useState<number>(0);
  const [maxHandSpeed, setMaxHandSpeed] = useState<number>(0);
  const [maxRotationalAccel, setMaxRotationalAccel] = useState<number>(0);
  const [maxPower, setMaxPower] = useState<number>(0);
  const [sessionData, setSessionData] = useState<SessionAvg[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // State for inline editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState<string>('');

  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState<{
    show: boolean;
    sessionId: string;
    confirmText: string;
  }>({
    show: false,
    sessionId: '',
    confirmText: '',
  });

  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Helper to show the delete confirmation popup
  const showDeletePopup = (sessionId: string) => {
    setDeletePopup({ show: true, sessionId, confirmText: '' });
  };

  // Fetch aggregator data on mount
  useEffect(() => {
    const fetchBlastData = async () => {
      try {
        const res = await fetch(
          `/api/athlete/${athleteId}/reports/blast-motion`
        );
        if (!res.ok) {
          const errorMsg =
            res.status === 404
              ? 'Blast Motion data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errorMsg);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Sort session averages in chronological order (oldest first)
        const sortedSessionAverages = data.sessionAverages.sort(
          (a: SessionAvg, b: SessionAvg) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setMaxBatSpeed(data.maxBatSpeed || 0);
        setMaxHandSpeed(data.maxHandSpeed || 0);
        setMaxRotationalAccel(data.maxRotationalAcceleration || 0);
        setMaxPower(data.maxPower || 0);
        setSessionData(sortedSessionAverages);

        // Use the sessions array directly from the API response
        setSessions(data.sessions);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlastData();
  }, [athleteId]);

  if (loading) {
    return <Loader />;
  }
  if (errorMessage) {
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );
  }

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
          techName: 'blast',
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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ techName: 'blast', athleteId: athleteId }),
      });
      if (!res.ok) {
        return;
      }
      const newSessions = sessions.filter((s) => s.sessionId !== sessionId);
      setSessions(newSessions);
    } catch (error: any) {
      console.error(error);
    }
  };

  // Prepare chart data for the main chart (speeds, acceleration, power)
  const labels = sessionData.map((s) => s.date);
  const batSpeedData = sessionData.map((s) => s.avgBatSpeed);
  const handSpeedData = sessionData.map((s) => s.avgHandSpeed);
  const rotationalAccelData = sessionData.map(
    (s) => s.avgRotaionalAcceleration
  );
  const powerData = sessionData.map((s) => s.avgPower);

  const mainChartData = {
    labels,
    datasets: [
      {
        label: 'Avg Bat Speed',
        data: batSpeedData,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Avg Hand Speed',
        data: handSpeedData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Avg Rotational Acceleration',
        data: rotationalAccelData,
        borderColor: 'rgba(255, 206, 86, 0.8)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Avg Power',
        data: powerData,
        borderColor: 'rgba(153, 102, 255, 0.8)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
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

  // Prepare chart data for the connections chart (early connections and connection at impacts)
  const earlyConnectionsData = sessionData.map((s) => s.avgEarlyConnection);
  const connectionAtImpactsData = sessionData.map(
    (s) => s.avgConnectionAtImpacts
  );
  const connectionsChartData = {
    labels,
    datasets: [
      {
        label: 'Avg Early Connection (°)',
        data: earlyConnectionsData,
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Avg Connection at Impact (°)',
        data: connectionAtImpactsData,
        borderColor: 'rgba(153, 102, 255, 0.8)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  // Options for the connections chart with an annotation at 90°.
  const connectionsChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      annotation: {
        annotations: {
          horizontalLine: {
            type: 'line',
            yMin: 90,
            yMax: 90,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              content: '90°',
              enabled: true,
              position: 'end',
            },
          },
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
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Profile
          </button>
          {['Assessments', 'Pitching', 'Hitting', 'Goals'].map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                tech === 'Hitting' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
        </nav>
        <div>
          <h1 className="text-3xl font-bold text-gray-700 flex justify-center mb-4">
            Blast Motion Overview
          </h1>
        </div>
        <div className="bg-blue-700">
          <button
            className="text-white"
            onClick={() => router.push(`/athlete/${athleteId}/tags/blast`)}
          >
            Blast Tags
          </button>
        </div>

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
                      href={`/blast-motion/${session.sessionId}`}
                      className="flex-1"
                    >
                      {session.date + ' '}
                      {session.sessionName && session.sessionName.trim() !== ''
                        ? session.sessionName
                        : session.sessionId}
                    </Link>
                    <button
                      onClick={() => showDeletePopup(session.sessionId)}
                      className="ml-4 px-3 py-1 text-gray-900 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
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

        {/* All-time max stats */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          {/* Bat Speed Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/4">
            <span className="text-xl font-bold text-gray-600">
              Max Bat Speed
            </span>
            <div className="mt-4 relative rounded-full w-32 h-32 border-8 border-blue-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">
                {maxBatSpeed}
              </span>
            </div>
            <p className="mt-2 text-blue-600 font-medium">mph</p>
          </div>

          {/* Hand Speed Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/4">
            <span className="text-xl font-bold text-gray-600">
              Max Hand Speed
            </span>
            <div className="mt-4 relative rounded-full w-32 h-32 border-8 border-green-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-green-600">
                {maxHandSpeed}
              </span>
            </div>
            <p className="mt-2 text-green-600 font-medium">mph</p>
          </div>

          {/* Rotational Acceleration Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/4">
            <span className="text-xl font-bold text-gray-600">
              Max Rot. Acceleration
            </span>
            <div className="mt-4 relative rounded-full w-32 h-32 border-8 border-yellow-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-yellow-600">
                {maxRotationalAccel}
              </span>
            </div>
            <p className="mt-2 text-yellow-600 font-medium">G&apos;s</p>
          </div>

          {/* Power Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/4">
            <span className="text-xl font-bold text-gray-600">Max Power</span>
            <div className="mt-4 relative rounded-full w-32 h-32 border-8 border-purple-200 flex items-center justify-center">
              <span className="text-2xl font-semibold text-purple-600">
                {maxPower}
              </span>
            </div>
            <p className="mt-2 text-purple-600 font-medium">KWs</p>
          </div>
        </div>

        {/* Main Chart: Averages Over Time */}
        <div
          className="bg-white p-6 rounded shadow mb-8"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Averages Over Time
          </h2>
          {sessionData.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line data={mainChartData} options={mainChartOptions} />
            </div>
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>

        {/* Connections Chart: Early Connections & Connection at Impacts */}
        <div
          className="bg-white p-6 rounded shadow"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Connections Over Time
          </h2>
          {sessionData.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line
                data={connectionsChartData}
                options={connectionsChartOptions}
              />
            </div>
          ) : (
            <p className="text-gray-500">No connection data available.</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deletePopup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4 text-black">
              Confirm Deletion
            </h3>
            <p className="mb-2 text-black">
              Type <strong>DELETE</strong> to confirm deletion.
            </p>
            <input
              type="text"
              placeholder="DELETE"
              value={deletePopup.confirmText}
              onChange={(e) =>
                setDeletePopup((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
              className="border p-2 mb-4 w-full text-black"
            />
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setDeletePopup({
                    show: false,
                    sessionId: '',
                    confirmText: '',
                  })
                }
                className="mr-4 px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletePopup.confirmText !== 'DELETE') {
                    alert("Please type 'DELETE' to confirm deletion.");
                    return;
                  }
                  await handleDeleteSession(deletePopup.sessionId);
                  setDeletePopup({
                    show: false,
                    sessionId: '',
                    confirmText: '',
                  });
                }}
                className="px-4 py-2 border rounded bg-red-500 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlastMotionStats;
