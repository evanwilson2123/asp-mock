'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import SignInPrompt from '../SignInPrompt';
import { Line } from 'react-chartjs-2';
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
import ErrorMessage from '../ErrorMessage';
import AthleteSidebar from '../Dash/AthleteSidebar';

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
  sessionName?: string;
}

interface TrackmanData {
  pitchStats: { pitchType: string; peakSpeed: number }[];
  avgPitchSpeeds: AvgPitchSpeed[];
  sessions: Session[];
}

// --- New Interface for Tag Handling ---
interface BlastTag {
  _id: string;
  name: string;
  description: string;
}

/**
 * TrackmanStats Component
 *
 * Provides data visualization for pitching sessions using Trackman data,
 * now with inline editing for session names, delete confirmation popup,
 * and tag management (added exactly as in the other components).
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

  // --- New: Tag Management States ---
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

  const { athleteId } = useParams();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;

  const router = useRouter();

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

  // --- New: Fetch athlete's Trackman tags ---
  useEffect(() => {
    const fetchTrackmanTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/trackman`);
        if (res.ok) {
          const data = await res.json();
          setBlastTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching trackman tags:', err);
      }
    };
    if (athleteId) fetchTrackmanTags();
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

  if (!isLoaded || loading) return <Loader />;
  if (!role) return <SignInPrompt />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  // Handler to start inline editing a session name
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

  // Original deletion handler
  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          techName: 'trackman',
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

  // Handlers for the delete confirmation popup
  const showDeletePopup = (sessionId: string) => {
    setDeletePopup({ show: true, sessionId, confirmText: '' });
  };

  const handleDeleteConfirmationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDeletePopup((prev) => ({ ...prev, confirmText: e.target.value }));
  };

  const handleConfirmDeletion = async () => {
    if (deletePopup.confirmText !== 'DELETE') {
      alert("Please type 'DELETE' to confirm deletion.");
      return;
    }
    // Proceed with deletion if the input is correct
    await handleDeleteSession(deletePopup.sessionId);
    // Hide the popup after deletion
    setDeletePopup({ show: false, sessionId: '', confirmText: '' });
  };

  const handleCancelDeletion = () => {
    setDeletePopup({ show: false, sessionId: '', confirmText: '' });
  };

  // --- New: Handlers for tag management ---
  const handleAddBlastTag = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = e.target.value;
    if (!tagId) return;
    try {
      const res = await fetch(`/api/tags/${athleteId}/trackman`, {
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
      const res = await fetch(`/api/tags/${athleteId}/trackman/${tagId}`, {
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
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Profile
          </button>
          <button
            key="assessments"
            onClick={() =>
              router.push(`/athlete/${athleteId}/reports/assessments`)
            }
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Assessments
          </button>
          {['Pitching', 'Hitting', 'Goals'].map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                tech === 'Pitching' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
          <button
            key="media"
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
        </nav>

        {/* --- New: Trackman Tag Management Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-700">
            Trackman Overview
          </h1>
          <div className="flex items-center">
            <span className="text-gray-900 mr-2 font-semibold">Tags:</span>
            {blastTags.length > 0 ? (
              blastTags.map((tag) => (
                <div
                  key={tag._id}
                  className="relative inline-block group mr-2 mb-2"
                >
                  <Link
                    key={tag._id}
                    href={`/athlete/${athleteId}/tags/trackman/${tag._id}`}
                  >
                    <span
                      title={tag.description}
                      key={tag._id}
                      className="inline-block bg-gray-200 text-gray-800 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      {tag.name}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveBlastTag(tag._id);
                        }}
                        className="ml-1 text-red-500"
                      >
                        <TrashIcon className="h-4 w-4 inline" />
                      </button>
                    </span>
                  </Link>
                  {/* Tooltip element
                  <div className="absolute left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                    {tag.description}
                  </div> */}
                </div>
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
              onChange={handleDeleteConfirmationChange}
              className="border p-2 mb-4 w-full text-black"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCancelDeletion}
                className="mr-4 px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletion}
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

export default TrackmanStats;
