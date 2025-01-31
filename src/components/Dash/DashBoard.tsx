'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from './CoachSidebar';
import Sidebar from './Sidebar';
import SignInPrompt from '../SignInPrompt';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';

// Chart imports
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Example levels
const levels = ['High School', 'College', 'Pro'];

// ------------------ Type Definitions ------------------
interface BlastSessionAvg {
  date: string;
  avgBatSpeed: number;
  avgHandSpeed: number;
}
interface BlastData {
  maxBatSpeed?: number;
  maxHandSpeed?: number;
  sessionAverages?: BlastSessionAvg[];
}

interface HitTraxSessionAvg {
  date: string;
  avgExitVelo: number;
}
interface HitTraxData {
  maxExitVelo?: number;
  maxDistance?: number;
  hardHitAverage?: number; // if 0-1, multiply by 100 in display
  sessionAverages?: HitTraxSessionAvg[];
}

interface TrackmanPitchStat {
  pitchType: string;
  peakSpeed: number;
}
interface TrackmanAvgSpeed {
  date: string;
  pitchType: string;
  avgSpeed: number;
}
interface TrackmanData {
  pitchStats?: TrackmanPitchStat[];
  avgPitchSpeeds?: TrackmanAvgSpeed[];
}

interface AthleteNums {
  athleteCount: number;
  athletePCount: number;
  athleteHCount: number;
  athletePHCount: number;
  athleteSCCount: number;
  pitchCount: number;
  blastCount: number;
  hitCount: number;
  armCount: number;
}

const Dashboard: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  const [level, setLevel] = useState<string>('High School');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aggregated data states
  const [blastData, setBlastData] = useState<BlastData | null>(null);
  const [hitTraxData, setHitTraxData] = useState<HitTraxData | null>(null);
  const [trackmanData, setTrackmanData] = useState<TrackmanData | null>(null);
  // New state for athlete numbers
  const [athleteNums, setAthleteNums] = useState<AthleteNums | null>(null);

  // ====================== Fetch Data ======================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Call all aggregator endpoints for the chosen level
        const [blastRes, hitTraxRes, trackmanRes, athleteNumsRes] =
          await Promise.all([
            fetch(`/api/admin/dashboard/blast-motion?level=${level}`),
            fetch(`/api/admin/dashboard/hittrax?level=${level}`),
            fetch(`/api/admin/dashboard/trackman?level=${level}`),
            fetch('/api/admin/dashboard'),
          ]);

        if (
          !blastRes.ok ||
          !hitTraxRes.ok ||
          !trackmanRes.ok ||
          !athleteNumsRes.ok
        ) {
          throw new Error('Failed to fetch data. Please try again.');
        }

        const [blastJson, hitTraxJson, trackmanJson, athleteNumsJson] =
          await Promise.all([
            blastRes.json(),
            hitTraxRes.json(),
            trackmanRes.json(),
            athleteNumsRes.json(),
          ]);

        console.log('Athlete nums res', athleteNumsJson);

        setBlastData(blastJson);
        setHitTraxData(hitTraxJson);
        setTrackmanData(trackmanJson);
        setAthleteNums(athleteNumsJson); // Store athlete numbers data
        setErrorMessage(null);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [level]);

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

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

  // ====================== BLAST MOTION ======================
  const blastLabels = blastData?.sessionAverages?.map((s) => s.date) ?? [];
  const blastChartData = {
    labels: blastLabels,
    datasets: [
      {
        label: 'Avg Bat Speed',
        data: blastData?.sessionAverages?.map((s) => s.avgBatSpeed) ?? [],
        borderColor: 'rgba(54, 162, 235, 0.9)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Avg Hand Speed',
        data: blastData?.sessionAverages?.map((s) => s.avgHandSpeed) ?? [],
        borderColor: 'rgba(75, 192, 192, 0.9)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // ====================== HITTRAX ======================
  const hitTraxLabels = hitTraxData?.sessionAverages?.map((s) => s.date) ?? [];
  const hitTraxChartData = {
    labels: hitTraxLabels,
    datasets: [
      {
        label: 'Avg Exit Velo',
        data: hitTraxData?.sessionAverages?.map((s) => s.avgExitVelo) ?? [],
        borderColor: 'rgba(255, 99, 132, 0.9)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // ====================== TRACKMAN ======================
  // We'll do "one line per pitch type" over time
  const pitchStats = trackmanData?.pitchStats ?? [];
  const avgPitchSpeeds = trackmanData?.avgPitchSpeeds ?? [];

  // 1) Gather all unique dates from avgPitchSpeeds
  const allDates = Array.from(
    new Set(avgPitchSpeeds.map((item) => item.date))
  ).sort();

  // 2) Build a structure mapping pitchType -> array of speeds (aligned with allDates)
  const pitchSpeedMap: Record<string, Array<number | null>> = {};
  // Initialize each pitchType's array
  avgPitchSpeeds.forEach((item) => {
    if (!pitchSpeedMap[item.pitchType]) {
      pitchSpeedMap[item.pitchType] = new Array(allDates.length).fill(null);
    }
  });
  // Fill in the correct speed for the correct date index
  avgPitchSpeeds.forEach((item) => {
    const dateIndex = allDates.indexOf(item.date);
    pitchSpeedMap[item.pitchType][dateIndex] = item.avgSpeed;
  });

  // 3) Convert pitchSpeedMap into multiple datasets
  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];
  const trackmanDatasets = Object.entries(pitchSpeedMap).map(
    ([pitchType, speeds], i) => ({
      label: pitchType,
      data: speeds,
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '33',
      fill: true,
      tension: 0.3,
    })
  );

  const trackmanChartData = {
    labels: allDates,
    datasets: trackmanDatasets,
  };

  // ====================== Chart Options ======================
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 14,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 3,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // ====================== JSX Output ======================
  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      <div className="flex-1 p-4 text-gray-800">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

        {/* Level Selector */}
        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold">
            Select Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="p-2 border rounded"
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Athlete Numbers Card - Centered & Organized */}
        {athleteNums && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Athlete Numbers
              </h2>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">Total Athletes</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.athleteCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">Pitching</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.athletePCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">Hitting</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.athleteHCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">
                    Pitching + Hitting
                  </span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.athletePHCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">S &amp; C</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.athleteSCCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {athleteNums && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Totals</h2>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">Pitches Tracked</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.pitchCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">
                    Blast-Swings Tracked
                  </span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.blastCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">HitTrax Tracked</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.hitCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600">
                    ArmCares Tracked
                  </span>
                  <span className="mt-1 text-3xl font-semibold text-gray-800">
                    {athleteNums.armCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid of cards for each "tech" */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* BLAST MOTION */}
          <div className="bg-white rounded shadow p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Blast Motion</h2>
            {/* Max Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center bg-gray-50 p-3 rounded shadow">
                <span className="text-sm text-gray-600 font-medium">
                  Max Bat Speed
                </span>
                <div className="mt-2 relative rounded-full w-20 h-20 border-4 border-blue-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {blastData?.maxBatSpeed ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-xs text-blue-600 font-medium">mph</p>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-3 rounded shadow">
                <span className="text-sm text-gray-600 font-medium">
                  Max Hand Speed
                </span>
                <div className="mt-2 relative rounded-full w-20 h-20 border-4 border-green-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">
                    {blastData?.maxHandSpeed ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-xs text-green-600 font-medium">mph</p>
              </div>
            </div>

            {/* Chart Container */}
            <div className="relative w-full h-60 sm:h-64 md:h-72">
              {blastChartData.labels.length > 0 ? (
                <Line data={blastChartData} options={chartOptions} />
              ) : (
                <p className="text-gray-500">No Blast Motion data available.</p>
              )}
            </div>
          </div>

          {/* HITTRAX */}
          <div className="bg-white rounded shadow p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-2">HitTrax</h2>
            {/* Max Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="flex flex-col items-center bg-gray-50 p-2 rounded shadow">
                <span className="text-sm text-gray-600 font-medium">
                  Max Exit Velo
                </span>
                <div className="mt-2 relative rounded-full w-16 h-16 border-4 border-blue-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {hitTraxData?.maxExitVelo?.toFixed(1) ?? '0'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-blue-600 font-medium">mph</p>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-2 rounded shadow">
                <span className="text-sm text-gray-600 font-medium">
                  Max Distance
                </span>
                <div className="mt-2 relative rounded-full w-16 h-16 border-4 border-green-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">
                    {hitTraxData?.maxDistance?.toFixed(1) ?? '0'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-green-600 font-medium">ft</p>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-2 rounded shadow">
                <span className="text-sm text-gray-600 font-medium">
                  Hard Hit Avg
                </span>
                <div className="mt-2 relative rounded-full w-16 h-16 border-4 border-red-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">
                    {hitTraxData?.hardHitAverage
                      ? (hitTraxData.hardHitAverage * 100).toFixed(1)
                      : '0'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-red-600 font-medium">%</p>
              </div>
            </div>

            {/* Chart Container */}
            <div className="relative w-full h-60 sm:h-64 md:h-72">
              {hitTraxChartData.labels.length > 0 ? (
                <Line data={hitTraxChartData} options={chartOptions} />
              ) : (
                <p className="text-gray-500">No HitTrax data available.</p>
              )}
            </div>
          </div>

          {/* TRACKMAN */}
          <div className="bg-white rounded shadow p-4 flex flex-col md:col-span-2 xl:col-span-1">
            <h2 className="text-lg font-semibold mb-2">Trackman</h2>
            {/* Peak Velocities */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {pitchStats.map((stat) => (
                <div
                  key={stat.pitchType}
                  className="flex flex-col items-center bg-gray-50 p-2 rounded shadow"
                >
                  <span className="text-sm text-gray-600 font-medium">
                    {stat.pitchType} Peak
                  </span>
                  <div className="mt-2 relative rounded-full w-16 h-16 border-4 border-blue-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {stat.peakSpeed}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-blue-600 font-medium">mph</p>
                </div>
              ))}
            </div>

            {/* Chart Container */}
            <div className="relative w-full h-60 sm:h-64 md:h-72">
              {trackmanChartData.labels.length > 0 ? (
                <Line data={trackmanChartData} options={chartOptions} />
              ) : (
                <p className="text-gray-500">No Trackman data available.</p>
              )}
            </div>
          </div>
          <div className="mb-44"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
