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
import { TrashIcon } from '@heroicons/react/24/solid';
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
  const { user } = useUser();
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

  // If no role found, prompt sign-in
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
    plugins: { legend: { position: 'top' as const } },
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

        {/* --- New: Arm Care Tag Management Section --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-700">
            Arm Care Overview
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
                    href={`/athlete/${athleteId}/tags/blast/${tag._id}`}
                  >
                    <span
                      title={tag.description}
                      key={tag._id}
                      className="inline-block bg-gray-200 text-gray-800 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      {tag.name}
                      <button
                        onClick={() => {
                          // --- New: Remove Tag Handler ---
                          (async () => {
                            try {
                              const res = await fetch(
                                `/api/tags/${athleteId}/arm-care/${tag._id}`,
                                { method: 'DELETE' }
                              );
                              if (res.ok) {
                                setBlastTags((prev) =>
                                  prev.filter((bt) => bt._id !== tag._id)
                                );
                              } else {
                                const data = await res.json();
                                setErrorMessage(
                                  data.error || 'Error removing tag'
                                );
                              }
                            } catch (err: any) {
                              console.error(err);
                              setErrorMessage('Internal Server Error');
                            }
                          })();
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
              onChange={async (e) => {
                const tagId = e.target.value;
                if (!tagId) return;
                try {
                  const res = await fetch(`/api/tags/${athleteId}/arm-care`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tagId }),
                  });
                  if (res.ok) {
                    const addedTag = availableTags.find(
                      (tag) => tag._id === tagId
                    );
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
              }}
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

        {/* Session List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Latest to Earliest)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <li
                  key={session.sessionId}
                  className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                >
                  <Link href={`/arm-care/${session.sessionId}`}>
                    {session.date} (Session ID: {session.sessionId})
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </ul>
        </div>

        {/* Example: Display color-coded latest IR, ER, Scaption */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Latest Strength (Color-Coded)
          </h2>
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className={`text-xl ${irClass}`}>
              IR Strength: {irPercent.toFixed(1)}% BW
            </div>
            <div className={`text-xl ${erClass}`}>
              ER Strength: {erPercent.toFixed(1)}% BW
            </div>
            <div className={`text-xl ${scapClass}`}>
              Scaption: {scapPercent.toFixed(1)}% BW
            </div>
            <div className={`text-xl ${sbClass}`}>
              Shoulder Balance (ER:IR): {ratio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* All-time Max & Latest Scores */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            All-Time Max &amp; Latest
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {/* All-time max */}
            <div className="bg-white p-6 rounded shadow flex-1">
              <h3 className="text-md font-bold text-gray-600 mb-4">
                All-Time Max
              </h3>
              <div className="flex flex-col gap-4 text-gray-700">
                <div>
                  <strong>Internal Strength:</strong> {maxInternal} lbs
                </div>
                <div>
                  <strong>External Strength:</strong> {maxExternal} lbs
                </div>
                <div>
                  <strong>Scaption Strength:</strong> {maxScaption} lbs
                </div>
                <div>
                  <strong>Internal ROM:</strong> {internalRom}°
                </div>
                <div>
                  <strong>External ROM:</strong> {externalRom}°
                </div>
                <div>
                  <strong>Shoulder Flexion:</strong> {maxShoulderFlexion}°
                </div>
              </div>
            </div>
            {/* Latest */}
            <div className="bg-white p-6 rounded shadow flex-1">
              <h3 className="text-md font-bold text-gray-600 mb-4">
                Latest Scores
              </h3>
              <div className="flex flex-col gap-4 text-gray-700">
                <div>
                  <strong>Internal Strength:</strong> {latestInternal} lbs
                </div>
                <div>
                  <strong>External Strength:</strong> {latestExternal} lbs
                </div>
                <div>
                  <strong>Scaption Strength:</strong> {latestScaption} lbs
                </div>
                <div>
                  <strong>Internal ROM:</strong> {latestInternalRom}°
                </div>
                <div>
                  <strong>External ROM:</strong> {latestExternalRom}°
                </div>
                <div>
                  <strong>Shoulder Flexion:</strong> {latestShoulderFlexion}°
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Averages Over Time (Line Chart) */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Arm Scores Over Time
          </h2>
          {sessionData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArmCareStats;
