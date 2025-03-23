'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
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
import { useRouter } from 'next/navigation';

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

// --- New Interface and States for Tag Handling ---
interface BlastTag {
  _id: string;
  name: string;
}

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

  // --- New States for Tag Handling ---
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

  const router = useRouter();

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

  // --- New: Fetch athlete's hittrax tags ---
  useEffect(() => {
    const fetchBlastTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/hittrax`);
        if (res.ok) {
          const data = await res.json();
          setBlastTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching hittrax tags:', err);
      }
    };
    if (athleteId) fetchBlastTags();
  }, [athleteId]);

  // --- New: Fetch available tags ---
  useEffect(() => {
    const fetchAvailableTags = async () => {
      try {
        const res = await fetch(`/api/tags`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching available tags:', err);
      }
    };
    fetchAvailableTags();
  }, []);

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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          techName: 'hittrax',
          athleteId: athleteId,
        }),
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

  const showDeletePopup = (sessionId: string) => {
    setDeletePopup({ show: true, sessionId, confirmText: '' });
  };

  // --- New: Handlers for tag management ---
  const handleAddBlastTag = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = e.target.value;
    if (!tagId) return;
    try {
      const res = await fetch(`/api/tags/${athleteId}/hittrax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) {
        const addedTag = availableTags.find((tag) => tag._id === tagId);
        if (addedTag) {
          setBlastTags((prev) => [...prev, addedTag]);
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Error adding tag');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Internal Server Error');
    }
  };

  const handleRemoveBlastTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/tags/${athleteId}/hittrax/${tagId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBlastTags((prev) => prev.filter((tag) => tag._id !== tagId));
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Error removing tag');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Internal Server Error');
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

        {/* --- New: HitTrax Tag Management Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-700">HitTrax Overview</h1>
          <div className="flex items-center">
            <span className="text-gray-900 mr-2 font-semibold">Tags:</span>
            {blastTags.length > 0 ? (
              blastTags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/athlete/${athleteId}/tags/hittrax/${tag._id}`}
                >
                  <span
                    key={tag._id}
                    className="inline-block bg-gray-200 text-gray-800 rounded-full px-3 py-1 mr-2 mb-2"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveBlastTag(tag._id)}
                      className="ml-1 text-red-500"
                    >
                      <TrashIcon className="h-4 w-4 inline" />
                    </button>
                  </span>
                </Link>
              ))
            ) : (
              <span className="text-gray-500">None</span>
            )}
            <select
              onChange={handleAddBlastTag}
              defaultValue=""
              className="ml-2 p-2 border rounded text-gray-900"
            >
              <option value="">Add Tag</option>
              {availableTags
                .filter((tag) => !blastTags.some((bt) => bt._id === tag._id))
                .map((tag) => (
                  <option key={tag._id} value={tag._id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {/* End Tag Management Section */}

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

export default HitTraxStats;
