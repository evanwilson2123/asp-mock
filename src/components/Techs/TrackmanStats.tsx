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

interface AvgStuffPlus {
  date: string;
  pitchType: string;
  avgStuffPlus: number;
}

interface Session {
  sessionId: string;
  date: string;
  sessionName?: string;
}

interface TrackmanData {
  pitchStats: { pitchType: string; peakSpeed: number }[];
  avgPitchSpeeds: AvgPitchSpeed[];
  avgStuffPlus: AvgStuffPlus[];
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
/*                                   Tag Manager                                */
/* -------------------------------------------------------------------------- */

const TagManager: React.FC<{
  blastTags: BlastTag[];
  availableTags: BlastTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  athleteId: string;
}> = ({ blastTags, availableTags, onAddTag, onRemoveTag, athleteId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');

  const filteredAvailableTags = availableTags.filter(
    (tag) =>
      !blastTags.some((bt) => bt._id === tag._id) &&
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTag = () => {
    if (selectedTagId) {
      onAddTag(selectedTagId);
      setSelectedTagId('');
      setSearchTerm('');
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-3">
        {/* Active Tags */}
        <div className="flex flex-wrap gap-2">
          {blastTags.map((tag) => (
            <div
              key={tag._id}
              className="group relative bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center space-x-2"
            >
              <Link
                href={`/athlete/${athleteId}/tags/trackman/${tag._id}`}
                className="text-blue-700 hover:text-blue-800 font-medium text-sm"
              >
                {tag.name}
              </Link>
              <button
                onClick={() => onRemoveTag(tag._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-3.5 w-3.5 text-blue-500 hover:text-blue-700" />
              </button>
              {tag.description && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {tag.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Tag Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="h-4 w-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Tag
        </button>
      </div>

      {/* Add Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Tags</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSearchTerm('');
                    setSelectedTagId('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Tag List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredAvailableTags.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredAvailableTags.map((tag) => (
                        <button
                          key={tag._id}
                          onClick={() => setSelectedTagId(tag._id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedTagId === tag._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {tag.name}
                              </div>
                              {tag.description && (
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {tag.description}
                                </div>
                              )}
                            </div>
                            {selectedTagId === tag._id && (
                              <svg
                                className="h-5 w-5 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {searchTerm
                        ? 'No matching tags found'
                        : 'Start typing to search tags'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSearchTerm('');
                      setSelectedTagId('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTag}
                    disabled={!selectedTagId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TrackmanStats: React.FC = () => {
  /* ---------------------------- State variables --------------------------- */

  const [peakVelocities, setPeakVelocities] = useState<
    { pitchType: string; peakSpeed: number }[]
  >([]);
  const [averageVelocities, setAverageVelocities] = useState<AvgPitchSpeed[]>(
    []
  );
  const [averageStuffPlus, setAverageStuffPlus] = useState<AvgStuffPlus[]>([]);
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
        setAverageStuffPlus(data.avgStuffPlus || []);
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
  const handleAddBlastTag = async (tagId: string) => {
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

  // Stuff+ chart data
  const uniqueStuffPlusDates = [
    ...new Set(averageStuffPlus.map((d) => d.date)),
  ];
  const stuffPlusDatasets = Object.entries(
    averageStuffPlus.reduce(
      (acc, cur) => {
        if (!acc[cur.pitchType]) acc[cur.pitchType] = [];
        acc[cur.pitchType].push(cur.avgStuffPlus);
        return acc;
      },
      {} as Record<string, number[]>
    )
  ).map(([pitchType, stuffPluses], idx) => ({
    label: pitchType,
    data: stuffPluses,
    borderColor: colors[idx % colors.length],
    backgroundColor: colors[idx % colors.length] + '33',
    tension: 0.3,
    fill: true,
  }));
  const stuffPlusChartData = {
    labels: uniqueStuffPlusDates,
    datasets: stuffPlusDatasets,
  };
  const stuffPlusChartOptions = {
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
              key="athletePage"
              onClick={() => router.push(`/athlete/${athleteId}`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end underline"
            >
              Profile
            </button>
            <button
              key="assessments"
              onClick={() =>
                router.push(`/athlete/${athleteId}/reports/assessments`)
              }
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Assessments
            </button>
            <button
              key="pitching"
              onClick={() => router.push(`/athlete/${athleteId}/pitching`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Pitching
            </button>
            <button
              key="hitting"
              onClick={() => router.push(`/athlete/${athleteId}/hitting`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Hitting
            </button>
            <button
              key="forceplates"
              onClick={() => router.push(`/athlete/${athleteId}/forceplates`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Forceplates
            </button>
            <button
              key="goals"
              onClick={() => router.push(`/athlete/${athleteId}/goals`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Goals
            </button>
            <button
              key="comparison"
              onClick={() => router.push(`/athlete/${athleteId}/comparison`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Comparison
            </button>
            <button
              key="media"
              onClick={() => router.push(`/athlete/${athleteId}/media`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Media
            </button>
            <button
              key="dash-view"
              onClick={() => router.push(`/athlete/${athleteId}/dash-view`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Dash-View
            </button>
          </nav>

          {/* Tag management */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-700 mb-4 md:mb-0">
              Trackman Overview
            </h1>
            <div className="w-full md:w-auto">
              <TagManager
                blastTags={blastTags}
                availableTags={availableTags}
                onAddTag={handleAddBlastTag}
                onRemoveTag={handleRemoveBlastTag}
                athleteId={athleteId as string}
              />
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
              <p className="mt-2 font-medium" style={{ color: colors[0] }}>
                Stuff+
              </p>
            </div>
          </div>

          {/* Averages chart */}
          <div
            className="bg-white p-6 rounded shadow mb-8"
            style={{ minHeight: 300 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              Velocity Averages Over Time
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              A line chart depicting the athlete&apos;s velocity progress over
              time among a selection of pitch types
            </p>
            {averageVelocities.length ? (
              <div className="w-full h-72 md:h-96">
                <Line data={mainChartData} options={mainChartOptions} />
              </div>
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </div>
          {/* */}

          {/* Stuff+ chart */}
          <div
            className="bg-white p-6 rounded shadow mb-8"
            style={{ minHeight: 300 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              Stuff+ Averages Over Time
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              A line chart depicting the athlete&apos;s stuff+ progress over
              time among a selection of pitch types
            </p>
            {averageStuffPlus.length ? (
              <div className="w-full h-72 md:h-96">
                <Line
                  data={stuffPlusChartData}
                  options={stuffPlusChartOptions}
                />
              </div>
            ) : (
              <p className="text-gray-500">No Stuff+ data available.</p>
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
