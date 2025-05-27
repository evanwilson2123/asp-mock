'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface SessionAverage {
  date: string;
  avgExitVelo: number;
  avgLA: number;
}

interface Session {
  sessionId: string;
  date: string;
  sessionName?: string;
}

interface ZoneAverage {
  sessionId: string;
  date: string;
  pull: { avgExitVelo: number; avgLA: number };
  center: { avgExitVelo: number; avgLA: number };
  oppo: { avgExitVelo: number; avgLA: number };
}

interface BlastTag {
  _id: string;
  name: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
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
                href={`/athlete/${athleteId}/tags/hittrax/${tag._id}`}
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
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                              <div className="font-medium text-gray-900">{tag.name}</div>
                              {tag.description && (
                                <div className="text-sm text-gray-500 mt-0.5">{tag.description}</div>
                              )}
                            </div>
                            {selectedTagId === tag._id && (
                              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {searchTerm ? 'No matching tags found' : 'Start typing to search tags'}
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

const HitTraxStats: React.FC = () => {
  /* ---------------------------- State variables --------------------------- */

  // Global metric states
  const [maxExitVelo, setMaxExitVelo] = useState(0);
  const [hardHitAverage, setHardHitAverage] = useState(0);

  // Distance metric states
  const [maxDistance, setMaxDistance] = useState(0);
  const [maxPullDistance, setMaxPullDistance] = useState(0);
  const [maxCenterDistance, setMaxCenterDistance] = useState(0);
  const [maxOppoDistance, setMaxOppoDistance] = useState(0);

  // Data + UI states
  const [sessionData, setSessionData] = useState<SessionAverage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [zoneData, setZoneData] = useState<ZoneAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline session‑name editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');

  // Tag handling
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

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

  /* ----------------------------- Hooks setup ------------------------------ */

  const router = useRouter();
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  /* -------------------------- Fetch HitTrax data -------------------------- */

  useEffect(() => {
    const fetchHitTraxData = async () => {
      try {
        const isAthleteParam = role === 'ATHLETE' ? 'true' : 'false';
        const response = await fetch(
          `/api/athlete/${athleteId}/reports/hittrax?isAthlete=${isAthleteParam}`
        );

        if (!response.ok) {
          const err =
            response.status === 404
              ? 'HitTrax data could not be found.'
              : response.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          throw new Error(err);
        }

        const data = await response.json();
        setMaxExitVelo(data.maxExitVelo || 0);
        setHardHitAverage(data.hardHitAverage || 0);
        setMaxDistance(data.maxDistance || 0);
        setMaxPullDistance(data.maxPullDistance || 0);
        setMaxCenterDistance(data.maxCenterDistance || 0);
        setMaxOppoDistance(data.maxOppoDistance || 0);
        setSessionData(data.sessionAverages || []);
        setSessions(data.sessions || []);
        setZoneData(data.zoneAverages || []);
        setCoachNotes(data.coachesNotes || []);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHitTraxData();
  }, [athleteId, role]);

  /* --------------------------- Fetch tag data ---------------------------- */

  useEffect(() => {
    if (!athleteId) return;

    const fetchBlastTags = async () => {
      const res = await fetch(`/api/tags/${athleteId}/hittrax`);
      if (res.ok) {
        const data = await res.json();
        setBlastTags(data.tags);
      }
    };

    fetchBlastTags();
  }, [athleteId]);

  useEffect(() => {
    const fetchAvailableTags = async () => {
      const res = await fetch(`/api/tags`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data.tags);
      }
    };
    fetchAvailableTags();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               Early returns                                */
  /* -------------------------------------------------------------------------- */

  if (loading) return <Loader />;

  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /*                                   Helpers                                  */
  /* -------------------------------------------------------------------------- */

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
        techName: 'hittrax',
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

  const handleDeleteSession = async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, techName: 'hittrax' }),
    });
    if (res.ok)
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  };

  const handleAddBlastTag = async (tagId: string) => {
    if (!tagId) return;

    const res = await fetch(`/api/tags/${athleteId}/hittrax`, {
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
    const res = await fetch(`/api/tags/${athleteId}/hittrax/${tagId}`, {
      method: 'DELETE',
    });
    if (res.ok) setBlastTags((prev) => prev.filter((t) => t._id !== tagId));
  };

  const handleNotesSave = async () => {
    const newNote: ICoachNote = {
      coachName: `${user?.publicMetadata?.firstName || 'Coach'} ${
        user?.publicMetadata?.lastName || ''
      }`.trim(),
      coachNote: newNoteText,
      isAthlete: visibleToAthlete,
      section: 'hittrax',
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

  /* -------------------------------------------------------------------------- */
  /*                           Chart configuration                              */
  /* -------------------------------------------------------------------------- */

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
  };

  const chartData = {
    labels: sessionData.map((s) => s.date),
    datasets: [
      {
        label: 'Avg Exit Velo (mph)',
        data: sessionData.map((s) => s.avgExitVelo),
        borderColor: 'rgba(75,192,192,0.8)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2,
        fill: true,
      },
      {
        label: 'Avg Launch Angle (°)',
        data: sessionData.map((s) => s.avgLA),
        borderColor: 'rgba(255,99,132,0.8)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const zoneChartData = {
    labels: zoneData.map((z) => z.date),
    datasets: [
      {
        label: 'Pull Avg Exit Velo (mph)',
        data: zoneData.map((z) => z.pull.avgExitVelo),
        borderColor: 'rgba(75,192,192,0.8)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Center Avg Exit Velo (mph)',
        data: zoneData.map((z) => z.center.avgExitVelo),
        borderColor: 'rgba(255,159,64,0.8)',
        backgroundColor: 'rgba(255,159,64,0.2)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Oppo Avg Exit Velo (mph)',
        data: zoneData.map((z) => z.oppo.avgExitVelo),
        borderColor: 'rgba(153,102,255,0.8)',
        backgroundColor: 'rgba(153,102,255,0.2)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Pull Avg Launch Angle (°)',
        data: zoneData.map((z) => z.pull.avgLA),
        borderColor: 'rgba(75,192,192,0.8)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2,
        fill: false,
        borderDash: [5, 5],
      },
      {
        label: 'Center Avg Launch Angle (°)',
        data: zoneData.map((z) => z.center.avgLA),
        borderColor: 'rgba(255,159,64,0.8)',
        backgroundColor: 'rgba(255,159,64,0.2)',
        tension: 0.2,
        fill: false,
        borderDash: [5, 5],
      },
      {
        label: 'Oppo Avg Launch Angle (°)',
        data: zoneData.map((z) => z.oppo.avgLA),
        borderColor: 'rgba(153,102,255,0.8)',
        backgroundColor: 'rgba(153,102,255,0.2)',
        tension: 0.2,
        fill: false,
        borderDash: [5, 5],
      },
    ],
  };

  /* -------------------------------------------------------------------------- */
  /*                               UI constants                                 */
  /* -------------------------------------------------------------------------- */

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
      label: 'Max All‑Time Distance',
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

  /* -------------------------------------------------------------------------- */
  /*                                 JSX                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen overflow-x-hidden">
        {/* ---------------------- Mobile Sidebar ---------------------- */}
        <div className="md:hidden bg-gray-100">
          {role === 'COACH' ? (
            <CoachSidebar />
          ) : role === 'ATHLETE' ? (
            <AthleteSidebar />
          ) : (
            <Sidebar />
          )}
        </div>

        {/* ---------------------- Desktop Sidebar --------------------- */}
        <div className="hidden md:block w-64 bg-gray-900 text-white">
          {role === 'COACH' ? (
            <CoachSidebar />
          ) : role === 'ATHLETE' ? (
            <AthleteSidebar />
          ) : (
            <Sidebar />
          )}
        </div>

        {/* ----------------------- Main Column ------------------------ */}
        <div className="flex-1 p-6 bg-gray-100 flex flex-col overflow-x-hidden">
          {/* Top navbar */}
          <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
            <button
              onClick={() => router.push(`/athlete/${athleteId}`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
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
            <button
              onClick={() => router.push(`/athlete/${athleteId}/media`)}
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              Media
            </button>
          </nav>

          {/* -------------------- Tag Management -------------------- */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-700 mb-4 md:mb-0">
              HitTrax Overview
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

          {/* ---------------------- Sessions list ---------------------- */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Sessions (Latest → Earliest)
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
                        className="flex-1 border p-1 mr-2"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                      />
                      <button
                        className="px-3 py-1 text-green-600 border border-green-600 mr-2"
                        onClick={() => handleSaveSessionName(session.sessionId)}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 text-red-600 border border-red-600"
                        onClick={() => setEditingSessionId(null)}
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
                        {session.date}{' '}
                        {session.sessionName?.trim() || session.sessionId}
                      </Link>
                      <button
                        className="ml-4 px-3 py-1 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                        onClick={() =>
                          setDeletePopup({
                            show: true,
                            sessionId: session.sessionId,
                            confirmText: '',
                          })
                        }
                      >
                        <TrashIcon className="h-5 w-5 text-gray-900" />
                      </button>
                      <button
                        className="ml-4 px-3 py-1 border-2 border-gray-300 bg-gray-100 hover:bg-gray-200"
                        onClick={() => handleStartEditing(session)}
                      >
                        <PencilIcon className="h-5 w-5 text-gray-900" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------- Global metrics ------------------ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {globalMetrics.map(({ label, value, unit, color }) => (
              <div
                key={label}
                className="bg-white p-6 rounded shadow flex flex-col items-center"
              >
                <span className="text-xl font-bold text-gray-600">{label}</span>
                <div
                  className={`mt-4 rounded-full w-40 h-40 border-8 border-${color}-200 flex items-center justify-center`}
                >
                  <span className={`text-3xl font-semibold text-${color}-600`}>
                    {value.toFixed(1)}
                  </span>
                </div>
                <p className={`mt-2 text-${color}-600 font-medium`}>{unit}</p>
              </div>
            ))}
          </div>

          {/* ------------------ Distance metrics ----------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {distanceMetrics.map(({ label, value, unit, color }) => (
              <div
                key={label}
                className="bg-white p-6 rounded shadow flex flex-col items-center"
              >
                <span className="text-xl font-bold text-gray-600">{label}</span>
                <div
                  className={`mt-4 rounded-full w-40 h-40 border-8 border-${color}-200 flex items-center justify-center`}
                >
                  <span className={`text-3xl font-semibold text-${color}-600`}>
                    {value.toFixed(1)}
                  </span>
                </div>
                <p className={`mt-2 text-${color}-600 font-medium`}>{unit}</p>
              </div>
            ))}
          </div>

          {/* ---------------- Overall chart ---------------- */}
          <div
            className="bg-white p-6 rounded shadow mb-8"
            style={{ minHeight: 300 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Average Exit Velocity &amp; Launch Angle Over Time
            </h2>
            {sessionData.length ? (
              <div className="w-full h-72 md:h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </div>

          {/* -------------- Zone averages chart -------------- */}
          <div
            className="bg-white p-6 rounded shadow mb-8"
            style={{ minHeight: 300 }}
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Zone Averages (Pull, Center &amp; Oppo)
            </h2>
            {zoneData.length ? (
              <div className="w-full h-72 md:h-96">
                <Line data={zoneChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500">No zone data available.</p>
            )}
          </div>

          {/* ------------------- Coach's Notes ------------------- */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-10">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              Coach&apos;s Notes
            </h2>

            {/* Existing notes */}
            {coachNotes.length ? (
              coachNotes.map((note, index) => (
                <div
                  key={note._id?.toString() || index}
                  className="mb-2 p-2 border rounded flex justify-between"
                >
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">{note.coachName}</span> on{' '}
                      {new Date(note.date).toLocaleDateString()}
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
              ))
            ) : (
              <p className="text-gray-500 mb-4">No notes yet.</p>
            )}

            {/* Add new note */}
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
          {/* ---------------- End Coach's Notes ---------------- */}
        </div>
      </div>

      {/* ---------------- Delete confirmation modal ---------------- */}
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
              onChange={(e) =>
                setDeletePopup((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
            />
            <div className="flex justify-end">
              <button
                className="mr-4 px-4 py-2 border rounded text-black"
                onClick={() =>
                  setDeletePopup({
                    show: false,
                    sessionId: '',
                    confirmText: '',
                  })
                }
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded bg-red-500 text-white"
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

export default HitTraxStats;
