"use client";
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TestData {
    peakPower: number;
    jumpHeight: number;
    rsiModified: number;
    testDate: string;
}

const CMJtestView = () => {

    // state for loading and error
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // state for the test data
    const [testData, setTestData] = useState<TestData | null>(null);

    // obtain the athlete info
    const athleteId = useParams().athleteId as string;
    const testNumber = useParams().testNumber as string;
    const { user } = useUser();
    const role = user?.publicMetadata?.role as string;
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/athlete/${athleteId}/forceplates/cmj/${testNumber}`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error);
                    return;
                }
                setTestData(data);
                console.log(JSON.stringify(data))
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [athleteId, testNumber]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    // Normalization max values
    const MAX_VALUES = {
      peakPower: 7000,
      jumpHeight: 60,
      rsiModified: 1,
    };

    const barData = testData
      ? {
          labels: ['Peak Power (W)', 'Jump Height (cm)', 'RSI Modified'],
          datasets: [
            {
              label: 'CMJ Test (Normalized)',
              data: [
                testData.peakPower / MAX_VALUES.peakPower,
                testData.jumpHeight / MAX_VALUES.jumpHeight,
                testData.rsiModified / MAX_VALUES.rsiModified,
              ],
              backgroundColor: [
                'rgba(37, 99, 235, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(251, 191, 36, 0.7)',
              ],
            },
          ],
        }
      : undefined;

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.2,
            callback: function(tickValue: string | number) {
              const val = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
              return `${(val * 100).toFixed(0)}%`;
            },
          },
        },
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
          <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-2xl mb-8 relative">
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 flex items-center text-blue-600 hover:text-blue-800 font-medium"
              aria-label="Go back"
            >
              <span className="mr-2">←</span> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center">CMJ Test View</h1>
            <div className="mb-8">
              {barData && <Bar data={barData} options={barOptions} />}
            </div>
            {testData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
                  <p className="text-2xl font-bold text-gray-900">{testData.peakPower} W</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
                  <p className="text-2xl font-bold text-gray-900">{testData.jumpHeight} cm</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">RSI Modified</h3>
                  <p className="text-2xl font-bold text-gray-900">{testData.rsiModified}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
}

export default CMJtestView