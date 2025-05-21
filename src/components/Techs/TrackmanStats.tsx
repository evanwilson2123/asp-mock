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
import { ICoachNote } from '@/models/coachesNote';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* -------------------------------------------------------------------------- */
/*                                Interfaces                                  */
/* -------------------------------------------------------------------------- */

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
  coachesNotes: ICoachNote[];
  maxStuffPlus: number;
}

interface BlastTag {
  _id: string;
  name: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
/* -------------------------------------------------------------------------- */

const TrackmanStats: React.FC = () => {
  /* ---------------------------- State variables --------------------------- */

  const [peakVelocities, setPeakVelocities] = useState<
    { pitchType: string; peakSpeed: number }[]
  >([]);
  const [averageVelocities, setAverageVelocities] = useState<AvgPitchSpeed[]>(
    []
  );
  const [maxStuffPlus, setMaxStuffPlus] = useState<number>(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline session‑name editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');

  // Coach notes
  const [coachNotes, setCoachNotes] = useState<ICoachNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [visibleToAthlete, setVisibleToAthlete] = useState(false);

  // Delete confirmation pop‑up
  const [deletePopup, setDeletePopup] = useState<{
    show: boolean;
    sessionId: string;
    confirmText: string;
  }>({ show: false, sessionId: '', confirmText: '' });

  // Tag handling
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

  /* ------------------------------ Hooks ----------------------------------- */

  const { athleteId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;

  /* ----------------------------- Fetch data ------------------------------- */

  useEffect(() => {
    const fetchTrackmanData = async () => {
      try {
        const isAthleteParam = role === 'ATHLETE' ? 'true' : 'false';
        const res = await fetch(
          `/api/athlete/${athleteId}/reports/trackman?isAthlete=${isAthleteParam}`
        );
        if (!res.ok) {
          const err =
            res.status === 404
              ? 'Trackman data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          throw new Error(err);
        }
        const data: TrackmanData = await res.json();
        setPeakVelocities(data.pitchStats || []);
        setAverageVelocities(data.avgPitchSpeeds || []);
        setSessions(data.sessions || []);
        setCoachNotes(data.coachesNotes || []);
        setMaxStuffPlus(data.maxStuffPlus || 0);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackmanData();
  }, [athleteId, role]);

  /* --------------------------- Tag fetching ------------------------------ */

  useEffect(() => {
    if (!athleteId) return;

    const fetchTags = async () => {
      const trackmanTags = await fetch(`/api/tags/${athleteId}/trackman`);
      if (trackmanTags.ok) {
        const data = await trackmanTags.json();
        setBlastTags(data.tags);
      }

      const allTags = await fetch('/api/tags');
      if (allTags.ok) {
        const data = await allTags.json();
        setAvailableTags(data.tags);
      }
    };
    fetchTags();
  }, [athleteId]);

  /* -------------------------------------------------------------------------- */
  /*                               Early returns                                */
  /* -------------------------------------------------------------------------- */

  if (!isLoaded || loading) return <Loader />;
  if (!role) return <SignInPrompt />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /*                                   Helpers                                  */
  /* -------------------------------------------------------------------------- */

  /* ----- Session name editing ----- */
  const handleStartEditing = (s: Session) => {
    setEditingSessionId(s.sessionId);
    setNewSessionName(s.sessionName?.trim() || '');
  };

  const handleSaveSessionName = async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName: newSessionName,
        techName: 'trackman',
      }),
    });
    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, sessionName: newSessionName } : s
        )
      );
      setEditingSessionId(null);
    }
  };

  /* ----- Delete session ----- */
  const handleDeleteSession = async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, techName: 'trackman' }),
    });
    if (res.ok)
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  };

  /* ----- Delete popup ----- */
  const showDeletePopup = (sessionId: string) =>
    setDeletePopup({ show: true, sessionId, confirmText: '' });
  const handleDeleteConfirmationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setDeletePopup((prev) => ({ ...prev, confirmText: e.target.value }));
  const handleConfirmDeletion = async () => {
    if (deletePopup.confirmText !== 'DELETE') {
      alert("Please type 'DELETE' to confirm deletion.");
      return;
    }
    await handleDeleteSession(deletePopup.sessionId);
    setDeletePopup({ show: false, sessionId: '', confirmText: '' });
  };
  const handleCancelDeletion = () =>
    setDeletePopup({ show: false, sessionId: '', confirmText: '' });

  /* ----- Coach notes ----- */
  const handleNotesSave = async () => {
    const newNote: ICoachNote = {
      coachName: `${user?.publicMetadata?.firstName || 'Coach'} ${
        user?.publicMetadata?.lastName || ''
      }`.trim(),
      coachNote: newNoteText,
      isAthlete: visibleToAthlete,
      section: 'trackman',
      date: new Date(),
    };

    const res = await fetch(`/api/athlete/${athleteId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    });

    if (res.ok) {
      setCoachNotes((prev) => [...prev, newNote]);
      setNewNoteText('');
      setVisibleToAthlete(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const res = await fetch(
      `/api/athlete/${athleteId}/notes?noteId=${noteId}`,
      {
        method: 'DELETE',
      }
    );
    if (res.ok)
      setCoachNotes((prev) => prev.filter((n) => n._id?.toString() !== noteId));
  };

  /* ----- Tag management ----- */
  const handleAddBlastTag = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = e.target.value;
    if (!tagId) return;

    const res = await fetch(`/api/tags/${athleteId}/trackman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    });

    if (res.ok) {
      const tag = availableTags.find((t) => t._id === tagId);
      if (tag) setBlastTags((prev) => [...prev, tag]);
    }
  };

  const handleRemoveBlastTag = async (tagId: string) => {
    const res = await fetch(`/api/tags/${athleteId}/trackman/${tagId}`, {
      method: 'DELETE',
    });
    if (res.ok) setBlastTags((prev) => prev.filter((t) => t._id !== tagId));
  };

  

  /* ----- Chart ----- */
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
      (acc, cur) => {
        if (!acc[cur.pitchType]) acc[cur.pitchType] = [];
        acc[cur.pitchType].push(cur.avgSpeed);
        return acc;
      },
      {} as Record<string, number[]>
    )
  ).map(([pitchType, speeds], idx) => ({
    label: pitchType,
    data: speeds,
    borderColor: colors[idx % colors.length],
    backgroundColor: colors[idx % colors.length] + '33',
    tension: 0.3,
    fill: true,
  }));

  const mainChartData = { labels: uniqueDates, datasets };
  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
  };

  /* -------------------------------------------------------------------------- */
  /*                                   JSX                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <div className="flex min-h-screen overflow-x-hidden">
        {/* --------------- Sidebar --------------- */}
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

        {/* --------------- Main Column --------------- */}
        <div className="flex-1 p-6 bg-gray-100 flex flex-col overflow-x-hidden">
          {/* Top nav */}
          <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
            <button
              onClick={() => router.push(`/athlete/${athleteId}`)}
              className="text-gray-700 font-semibold hover:text-gray-900"
            >
              Profile
            </button>
            <button
              onClick={() =>
                router.push(`/athlete/${athleteId}/reports/assessments`)
              }
              className="text-gray-700 font-semibold hover:text-gray-900"
            >
              Assessments
            </button>
            {['Pitching', 'Hitting', 'Goals'].map((tech) => (
              <button
                key={tech}
                onClick={() =>
                  router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
                }
                className={`text-gray-700 font-semibold hover:text-gray-900 ${tech === 'Pitching' ? 'underline' : ''}`}
              >
                {tech}
              </button>
            ))}
            <button
              onClick={() => router.push(`/athlete/${athleteId}/media`)}
              className="text-gray-700 font-semibold hover:text-gray-900"
            >
              Media
            </button>
          </nav>

          {/* Tag management */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-700">
              Trackman Overview
            </h1>
            <div className="flex flex-wrap items-center">
              <span className="text-gray-900 mr-2 font-semibold">Tags:</span>
              {blastTags.length ? (
                blastTags.map((tag) => (
                  <span
                    key={tag._id}
                    className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 mr-2 mb-2"
                  >
                    <Link
                      href={`/athlete/${athleteId}/tags/trackman/${tag._id}`}
                    >
                      {tag.name}
                    </Link>
                    <button
                      onClick={() => handleRemoveBlastTag(tag._id)}
                      className="ml-1"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500 inline" />
                    </button>
                  </span>
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
                  .filter((t) => !blastTags.some((bt) => bt._id === t._id))
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Session list */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Sessions (Clickable)
            </h2>
            <ul className="bg-white p-4 rounded shadow text-black">
              {sessions.map((s) => (
                <li
                  key={s.sessionId}
                  className="flex items-center justify-between py-2 px-4 hover:bg-gray-100"
                >
                  {editingSessionId === s.sessionId ? (
                    <>
                      <input
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        className="flex-1 border p-1 mr-2"
                      />
                      <button
                        onClick={() => handleSaveSessionName(s.sessionId)}
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
                        href={`/trackman/${s.sessionId}`}
                        className="flex-1 text-black"
                      >
                        {s.date}{' '}
                        {s.sessionName?.trim()
                          ? s.sessionName
                          : '(' + s.sessionId + ')'}
                      </a>
                      <button
                        onClick={() => showDeletePopup(s.sessionId)}
                        className="ml-4 px-3 py-1 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                      >
                        <TrashIcon className="h-5 w-5 text-gray-900" />
                      </button>
                      <button
                        onClick={() => handleStartEditing(s)}
                        className="ml-4 px-3 py-1 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                      >
                        <PencilIcon className="h-5 w-5 text-gray-900" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Peak velocities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {peakVelocities.map(({ pitchType, peakSpeed }, idx) => (
              <div
                key={pitchType}
                className="bg-white p-6 rounded shadow flex flex-col items-center"
              >
                <span className="text-xl font-bold text-gray-600">
                  {pitchType} Peak Velocity
                </span>
                <div
                  className="mt-4 rounded-full w-32 h-32 border-8 flex items-center justify-center"
                  style={{ borderColor: colors[idx % colors.length] }}
                >
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: colors[idx % colors.length] }}
                  >
                    {peakSpeed}
                  </span>
                </div>
                <p
                  className="mt-2 font-medium"
                  style={{ color: colors[idx % colors.length] }}
                >
                  mph
                </p>
              </div>
            ))}
            <div className="bg-white p-6 rounded shadow flex flex-col items-center">
              <span className="text-xl font-bold text-gray-600">
                Max Stuff+
              </span>
              <div
                className="mt-4 rounded-full w-32 h-32 border-8 flex items-center justify-center"
                style={{ borderColor: colors[0] }}
              >
                <span
                  className="text-2xl font-semibold"
                  style={{ color: colors[0] }}
                >
                  {maxStuffPlus.toFixed(2)}
                </span>
              </div>
              <p
                className="mt-2 font-medium"
                style={{ color: colors[0] }}
              >
                Stuff+
              </p>
            </div>
          </div>

          {/* Averages chart */}
          <div
            className="bg-white p-6 rounded shadow mb-8"
            style={{ minHeight: 300 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Averages Over Time
            </h2>
            {averageVelocities.length ? (
              <div className="w-full h-72 md:h-96">
                <Line data={mainChartData} options={mainChartOptions} />
              </div>
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </div>

          {/* Coach's notes */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-10">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              Coach&apos;s Notes
            </h2>
            {coachNotes.length ? (
              coachNotes.map((note, idx) => {
                const key = note._id ? note._id.toString() : `temp-${idx}`;
                return (
                  <div
                    key={key}
                    className="mb-2 p-2 border rounded flex justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{note.coachName}</span>{' '}
                        on {new Date(note.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-800">{note.coachNote}</p>
                      {note.isAthlete && role !== 'ATHLETE' && (
                        <p className="text-xs text-green-600 font-semibold">
                          Visible to Athlete
                        </p>
                      )}
                    </div>
                    {role !== 'ATHLETE' && (
                      <button
                        onClick={() =>
                          note._id && handleDeleteNote(note._id.toString())
                        }
                      >
                        <TrashIcon className="h-5 w-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 mb-4">No notes yet.</p>
            )}

            {role !== 'ATHLETE' && (
              <>
                <textarea
                  className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Add a new note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <div className="flex items-center mt-2">
                  <input
                    id="visibleToAthlete"
                    type="checkbox"
                    checked={visibleToAthlete}
                    onChange={(e) => setVisibleToAthlete(e.target.checked)}
                    className="mr-2"
                  />
                  <label
                    htmlFor="visibleToAthlete"
                    className="text-sm text-gray-700"
                  >
                    Visible to Athlete
                  </label>
                </div>
                <button
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleNotesSave}
                >
                  Save Note
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
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
              className="border p-2 mb-4 w-full text-black"
              placeholder="DELETE"
              value={deletePopup.confirmText}
              onChange={handleDeleteConfirmationChange}
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
    </>
  );
};

export default TrackmanStats;
