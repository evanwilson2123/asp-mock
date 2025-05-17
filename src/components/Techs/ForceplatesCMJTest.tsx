"use client";
import { useUser } from '@clerk/clerk-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
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
import ErrorMessage from '../ErrorMessage';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ForceplatesCMJTest = () => {
    // states for the cmj stats
    const [peakPower, setPeakPower] = useState<number>(0);
    const [jumpHeight, setJumpHeight] = useState<number>(0);
    const [rsiModified, setRsiModified] = useState<number>(0);
    const [testDate, setTestDate] = useState<string>('');

    // get the user
    const { user } = useUser();
    const role = user?.publicMetadata.role as string;
    const athleteId = useParams().athleteId as string;
    const testNumber = useParams().testNumber as string;
    const router = useRouter();

    // handle loading and error states
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // get the cmj data
    useEffect(() => {
        const fetchCMJData = async () => {
            try {
            setLoading(true);
            const res = await fetch(`/api/athlete/${athleteId}/forceplates/cmj/${testNumber}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setPeakPower(data.peakPower);
            setJumpHeight(data.jumpHeight);
            setRsiModified(data.rsiModified);
            setTestDate(data.testDate);
            } catch (error: any) {
                console.log(error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCMJData();
    }, [athleteId, testNumber])

    const barData = {
      labels: ['Peak Power (W)', 'Jump Height (cm)', 'RSI Modified'],
      datasets: [
        {
          label: 'CMJ Test Metrics',
          data: [peakPower, jumpHeight, rsiModified],
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(251, 191, 36, 0.7)',
          ],
        },
      ],
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'CMJ Test Metrics' },
      },
      scales: {
        y: { beginAtZero: true },
      },
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <ErrorMessage message={error} role={role} />;

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
            <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center">CMJ Test Results</h1>
            <div className="mb-8">
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
                <p className="text-2xl font-bold text-gray-900">{peakPower} W</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
                <p className="text-2xl font-bold text-gray-900">{jumpHeight} cm</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">RSI Modified</h3>
                <p className="text-2xl font-bold text-gray-900">{rsiModified}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Test Date</h3>
                <p className="text-2xl font-bold text-gray-900">{testDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default ForceplatesCMJTest