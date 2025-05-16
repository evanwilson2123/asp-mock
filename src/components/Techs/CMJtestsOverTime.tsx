"use client";
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import ErrorMessage from '../ErrorMessage';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';

interface TestData {
    peakPowerW: number;
    jmpHeight: number;
    RSImodified: number;
    date: string;
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CMJtestsOverTime = () => {
    const [dataOverTime, setDataOverTime] = useState<TestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();
    const role = user?.publicMetadata.role as string;
    const athleteId = useParams().athleteId as string;
    const router = useRouter();


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/athlete/${athleteId}/forceplates/cmj`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error);
                    return;
                }
                setDataOverTime(data.data);
            } catch (error: any) {
                console.error(error);
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [athleteId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <ErrorMessage message={error} role={role} />;

    // Prepare chart data for each metric
    const labels = dataOverTime.map((d) => d.date);

    const peakPowerData = {
      labels,
      datasets: [
        {
          label: 'Peak Power (W)',
          data: dataOverTime.map((d) => d.peakPowerW),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
        },
      ],
    };
    const jumpHeightData = {
      labels,
      datasets: [
        {
          label: 'Jump Height (cm)',
          data: dataOverTime.map((d) => d.jmpHeight),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
        },
      ],
    };
    const rsiModifiedData = {
      labels,
      datasets: [
        {
          label: 'RSI Modified',
          data: dataOverTime.map((d) => d.RSImodified),
          backgroundColor: 'rgba(251, 191, 36, 0.7)',
        },
      ],
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    };

    return (
      <div className="flex min-h-screen bg-gray-100">
        {/* ---------- sidebars ---------- */}
        {/* mobile */}
        <div className="md:hidden bg-gray-100">
          {role === 'COACH' ? (
            <CoachSidebar />
          ) : role === 'ATHLETE' ? (
            <AthleteSidebar />
          ) : (
            <Sidebar />
          )}
        </div>
        {/* desktop */}
        <div className="hidden md:block w-64 bg-gray-900 text-white">
          {role === 'COACH' ? (
            <CoachSidebar />
          ) : role === 'ATHLETE' ? (
            <AthleteSidebar />
          ) : (
            <Sidebar />
          )}
        </div>
        {/* ---------- main content ---------- */}
        <div className="flex-1 p-6 flex flex-col items-center">
          <div className="flex flex-col gap-8 w-full max-w-3xl relative">
            <button
              onClick={() => router.back()}
              className="absolute top-0 left-0 flex items-center text-blue-600 hover:text-blue-800 font-medium mt-2 ml-2"
              aria-label="Go back"
            >
              <span className="mr-2">←</span> Back
            </button>
            <div className="bg-white rounded-lg shadow-md p-6 pt-12">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Peak Power Over Time</h2>
              <Bar data={peakPowerData} options={barOptions} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Jump Height Over Time</h2>
              <Bar data={jumpHeightData} options={barOptions} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-700 mb-4">RSI Modified Over Time</h2>
              <Bar data={rsiModifiedData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    );
}

export default CMJtestsOverTime