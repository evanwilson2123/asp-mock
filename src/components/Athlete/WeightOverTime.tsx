'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AthleteSidebar from '../Dash/AthleteSidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import { useParams, useRouter } from 'next/navigation';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
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

interface WeightLog {
  id: number;
  athlete: string;
  weight: number;
  date: string; // ISO
}

const WeightOverTime = () => {
  /* ----------------------------- auth / params --------------------------- */
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const router = useRouter();
  const params = useParams();

  const resolvedAthleteId: string | undefined =
    role === 'ATHLETE'
      ? (user?.publicMetadata?.objectId as string)
      : (() => {
          const id = (params as Record<string, string | string[]>).athleteId;
          return Array.isArray(id) ? id[0] : id;
        })();

  /* ------------------------------- state --------------------------------- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  /* ------------------------------ effects -------------------------------- */
  useEffect(() => {
    if (!resolvedAthleteId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/athlete/${resolvedAthleteId}/weight/progress`
        );
        if (!res.ok) throw new Error('Failed to fetch weight logs');
        const data = await res.json();
        const sorted = (data.weightLogs as WeightLog[]).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWeightLogs(sorted);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedAthleteId]);

  /* ------------------------- derive chart data --------------------------- */
  const chartData = {
    labels: weightLogs.map((wl) =>
      new Date(wl.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    ),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weightLogs.map((wl) => wl.weight),
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.25,
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: false, // <— updated for v4
      },
    },
  };

  /* ------------------------------ sidebar -------------------------------- */
  const SidebarComponent =
    role === 'COACH'
      ? CoachSidebar
      : role === 'ATHLETE'
        ? AthleteSidebar
        : Sidebar;

  /* ------------------------------ render --------------------------------- */
  if (loading) return <Loader />;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        <SidebarComponent />
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        <SidebarComponent />
      </div>

      {/* Main */}
      <div className="flex-1 p-4 pb-24 text-gray-800">
        {role !== 'ATHLETE' && (
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
          >
            Back
          </button>
        )}

        <h1 className="text-3xl font-bold mb-6 text-center">Weight Progress</h1>

        {weightLogs.length === 0 ? (
          <p className="text-center text-gray-600">No weight logs yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightOverTime;
