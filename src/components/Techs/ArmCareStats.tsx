'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '../Dash/CoachSidebar';
import Sidebar from '../Dash/Sidebar';
import Loader from '../Loader';
import Link from 'next/link';
import SignInPrompt from '../SignInPrompt';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ErrorMessage from '../ErrorMessage';
import { TrashIcon } from '@heroicons/react/24/outline';
import AthleteSidebar from '../Dash/AthleteSidebar';
// --- COLOR HELPERS ---

const NORMAL_CLASS = 'text-blue-600';
const WATCH_CLASS = 'text-yellow-600';
const WARNING_CLASS = 'text-pink-600';

/**
 * getStrengthColor
 * For IR or ER, thresholds:
 *  - Normal: >20% BW
 *  - Watch: 15-20% BW
 *  - Warning: <15% BW
 * For Scaption: Normal >15%, Watch: 10-15%, Warning: <10%
 */
function getStrengthColor(
  percentBW: number,
  type: 'IR' | 'ER' | 'Scaption' | 'Total'
) {
  if (type === 'IR' || type === 'ER') {
    if (percentBW > 20) return NORMAL_CLASS;
    if (percentBW >= 15) return WATCH_CLASS;
    return WARNING_CLASS;
  } else if (type === 'Scaption') {
    if (percentBW > 15) return NORMAL_CLASS;
    if (percentBW >= 10) return WATCH_CLASS;
    return WARNING_CLASS;
  } else if (type === 'Total') {
    if (percentBW > 70) return NORMAL_CLASS;
    if (percentBW >= 50) return WATCH_CLASS;
    return WARNING_CLASS;
  }
  return '';
}

/**
 * getShoulderBalanceColor
 * For Shoulder Balance (ER:IR ratio):
 *  - Normal: 0.85-1.05
 *  - Watch: 0.70-0.84 or 1.06-1.20
 *  - Warning: <0.70 or >1.20
 */
function getShoulderBalanceColor(ratio: number) {
  if (ratio >= 0.85 && ratio <= 1.05) return NORMAL_CLASS;
  if ((ratio >= 0.7 && ratio < 0.85) || (ratio > 1.05 && ratio <= 1.2))
    return WATCH_CLASS;
  return WARNING_CLASS;
}

interface SessionScore {
  date: string;
  armScore: number;
}

interface Session {
  sessionId: string;
  date: string;
}

// --- New: Interface for Tag Management ---
interface BlastTag {
  _id: string;
  name: string;
  description: string;
}

// Add TagManager component
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
                href={`/athlete/${athleteId}/tags/arm-care/${tag._id}`}
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

// Update Chart.js registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ArmCareStats Component
 *
 * This component displays detailed arm care statistics for a specific athlete.
 * It includes strength metrics, range of motion (ROM) data, session data, and an interactive chart.
 * Tag management (adding/removing tags) has been added below.
 */
const ArmCareStats: React.FC = () => {
  // ===== STATE  =====
  // Body weight
  const [bodyWeight, setBodyWeight] = useState<number>(0);

  // All-time max
  const [maxInternal, setMaxInternal] = useState<number>(0);
  const [maxExternal, setMaxExternal] = useState<number>(0);
  const [maxScaption, setMaxScaption] = useState<number>(0);
  const [internalRom, setInternalRom] = useState<number>(0);
  const [externalRom, setExternalRom] = useState<number>(0);
  const [maxShoulderFlexion, setMaxShoulderFlexion] = useState<number>(0);

  // Latest
  const [latestInternal, setLatestInternal] = useState<number>(0);
  const [latestExternal, setLatestExternal] = useState<number>(0);
  const [latestScaption, setLatestScaption] = useState<number>(0);
  const [latestInternalRom, setLatestInternalRom] = useState<number>(0);
  const [latestExternalRom, setLatestExternalRom] = useState<number>(0);
  const [latestShoulderFlexion, setLatestShoulderFlexion] = useState<number>(0);

  // Session/Chart
  const [sessionData, setSessionData] = useState<SessionScore[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Manage state
  const [loading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- New: Tag Management States ---
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

  // Auth
  const { athleteId } = useParams();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;

  // Router
  const router = useRouter();

  // Fetch arm care data
  useEffect(() => {
    const fetchArmData = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/reports/arm-care`);
        if (!res.ok) {
          const errorMsg =
            res.status === 404
              ? 'Arm Care data could not be found.'
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

        // Body weight
        setBodyWeight(data.bodyWeight || 0);

        // All-time max
        setMaxInternal(data.maxInternal || 0);
        setMaxExternal(data.maxExternal || 0);
        setMaxScaption(data.maxScaption || 0);
        setInternalRom(data.internalRom || 0);
        setExternalRom(data.externalRom || 0);
        setMaxShoulderFlexion(data.maxShoulderFlexion || 0);

        // Latest
        setLatestInternal(data.latestInternal || 0);
        setLatestExternal(data.latestExternal || 0);
        setLatestScaption(data.latestScaption || 0);
        setLatestInternalRom(data.latestInternalRom || 0);
        setLatestExternalRom(data.latestExternalRom || 0);
        setLatestShoulderFlexion(data.latestShoulderFlexion || 0);

        // Sessions
        setSessionData(data.sessionAverages || []);
        setSessions(data.sessions || []);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArmData();
  }, [athleteId]);

  // --- New: Fetch athlete's Arm Care tags ---
  useEffect(() => {
    const fetchArmCareTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/arm-care`);
        if (res.ok) {
          const data = await res.json();
          setBlastTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching arm care tags:', err);
      }
    };
    if (athleteId) fetchArmCareTags();
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

  // Update the auth check to include loading state
  if (!isLoaded) {
    return <Loader />;
  }

  if (!role) {
    return <SignInPrompt />;
  }

  if (loading) {
    return <Loader />;
  }

  if (errorMessage) {
    return <ErrorMessage role={role as string} message={errorMessage} />;
  }

  // For chart
  const labels = sessionData.map((s) => s.date);
  const scoreData = sessionData.map((s) => s.armScore);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Arm Score',
        data: scoreData,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        type: 'category' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  // --- Compute % of BW for the LATEST strengths ---
  const irPercent = bodyWeight ? (latestInternal / bodyWeight) * 100 : 0;
  const erPercent = bodyWeight ? (latestExternal / bodyWeight) * 100 : 0;
  const scapPercent = bodyWeight ? (latestScaption / bodyWeight) * 100 : 0;

  // Shoulder Balance example: ratio = ER / IR
  const ratio = latestInternal === 0 ? 0 : latestExternal / latestInternal;

  // Determine color classes
  const irClass = getStrengthColor(irPercent, 'IR');
  const erClass = getStrengthColor(erPercent, 'ER');
  const scapClass = getStrengthColor(scapPercent, 'Scaption');
  const sbClass = getShoulderBalanceColor(ratio);

  // Add these handlers for tag management
  const handleAddBlastTag = async (tagId: string) => {
    if (!tagId) return;
    try {
      const res = await fetch(`/api/tags/${athleteId}/arm-care`, {
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
      const res = await fetch(`/api/tags/${athleteId}/arm-care/${tagId}`, {
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
            Asessments
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
        </nav>

        {/* Overview and Tags Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-700 mb-4 md:mb-0">
              Arm Care Overview
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
        </div>

        {/* Session List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Sessions
          </h2>
          <ul className="divide-y divide-gray-200">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <li
                  key={session.sessionId}
                  className="py-3 hover:bg-gray-50 transition-colors"
                >
                  <Link 
                    href={`/arm-care/${session.sessionId}`}
                    className="block px-4 text-gray-700 hover:text-blue-600"
                  >
                    {new Date(session.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Link>
                </li>
              ))
            ) : (
              <li className="py-3 px-4 text-gray-500">No session data available.</li>
            )}
          </ul>
        </div>

        {/* Latest Strength Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Latest Strength Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Latest Strength Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Internal Rotation</span>
                <span className={`text-lg font-semibold ${irClass}`}>
                  {irPercent.toFixed(1)}% BW
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">External Rotation</span>
                <span className={`text-lg font-semibold ${erClass}`}>
                  {erPercent.toFixed(1)}% BW
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Scaption</span>
                <span className={`text-lg font-semibold ${scapClass}`}>
                  {scapPercent.toFixed(1)}% BW
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Shoulder Balance (ER:IR)</span>
                <span className={`text-lg font-semibold ${sbClass}`}>
                  {ratio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* All-time Max Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              All-Time Max
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Internal Strength</div>
                <div className="text-lg font-semibold text-gray-900">{maxInternal} lbs</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">External Strength</div>
                <div className="text-lg font-semibold text-gray-900">{maxExternal} lbs</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Scaption Strength</div>
                <div className="text-lg font-semibold text-gray-900">{maxScaption} lbs</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Internal ROM</div>
                <div className="text-lg font-semibold text-gray-900">{internalRom}°</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">External ROM</div>
                <div className="text-lg font-semibold text-gray-900">{externalRom}°</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Shoulder Flexion</div>
                <div className="text-lg font-semibold text-gray-900">{maxShoulderFlexion}°</div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Scores Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Latest Scores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Internal Strength</div>
              <div className="text-lg font-semibold text-gray-900">{latestInternal} lbs</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">External Strength</div>
              <div className="text-lg font-semibold text-gray-900">{latestExternal} lbs</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Scaption Strength</div>
              <div className="text-lg font-semibold text-gray-900">{latestScaption} lbs</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Internal ROM</div>
              <div className="text-lg font-semibold text-gray-900">{latestInternalRom}°</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">External ROM</div>
              <div className="text-lg font-semibold text-gray-900">{latestExternalRom}°</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Shoulder Flexion</div>
              <div className="text-lg font-semibold text-gray-900">{latestShoulderFlexion}°</div>
            </div>
          </div>
        </div>

        {/* Arm Scores Over Time Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Arm Scores Over Time
          </h2>
          <div className="h-[400px]">
            {sessionData.length > 0 ? (
              <Line 
                data={chartData} 
                options={chartOptions}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No session data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArmCareStats;
