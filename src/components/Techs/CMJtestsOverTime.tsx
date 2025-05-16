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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';

interface TestData {
    peakPowerW: number;
    jmpHeight: number;
    RSImodified: number;
    date: string;
}

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} role={role} />;

    // Prepare chart data for each metric
    const labels = dataOverTime.map((d) => d.date);

    // Helper to calculate percent change
    function percentChange(arr: number[]) {
      return arr.map((val, i) => {
        if (i === 0) return null;
        const prev = arr[i - 1];
        if (!prev) return null;
        return ((val - prev) / prev) * 100;
      });
    }

    // Helper to calculate linear regression (trend) line values
    function regressionLine(arr: number[]) {
      const n = arr.length;
      if (n === 0) return [];
      // x = [0, 1, 2, ...]
      const x = arr.map((_, i) => i);
      const y = arr;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;
      return x.map((xi) => slope * xi + intercept);
    }

    const peakPowerArr = dataOverTime.map((d) => d.peakPowerW);
    const jumpHeightArr = dataOverTime.map((d) => d.jmpHeight);
    const rsiArr = dataOverTime.map((d) => d.RSImodified);

    const peakPowerChange = percentChange(peakPowerArr);
    const jumpHeightChange = percentChange(jumpHeightArr);
    const rsiChange = percentChange(rsiArr);

    // Calculate regression lines and halve their values for display
    const peakPowerTrend = regressionLine(peakPowerArr).map(v => v / 2);
    const jumpHeightTrend = regressionLine(jumpHeightArr).map(v => v / 2);
    const rsiTrend = regressionLine(rsiArr).map(v => v / 2);

    const peakPowerData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Peak Power (W)',
          data: peakPowerArr,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: peakPowerTrend,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          yAxisID: 'y',
          spanGaps: true,
          pointRadius: 0,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
        },
      ],
    };
    const jumpHeightData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Jump Height (cm)',
          data: jumpHeightArr,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: jumpHeightTrend,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          yAxisID: 'y',
          spanGaps: true,
          pointRadius: 0,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
        },
      ],
    };
    const rsiModifiedData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'RSI Modified',
          data: rsiArr,
          backgroundColor: 'rgba(251, 191, 36, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: rsiTrend,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          yAxisID: 'y',
          spanGaps: true,
          pointRadius: 0,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
        },
      ],
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Value' } },
      },
    };

    // Table rendering helper
    function renderProgressionTable(dates: string[], changes: (number|null)[]) {
      return (
        <table className="min-w-[160px] ml-4 text-xs md:text-sm border rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">% Change</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {dates.map((date, i) => (
              <tr key={date} className="text-center">
                <td className="border px-2 py-1">{date}</td>
                <td className={`border px-2 py-1 font-semibold ${i === 0 ? '' : changes[i] !== null && changes[i] > 0 ? 'text-green-600' : changes[i] !== null && changes[i] < 0 ? 'text-red-600' : ''}`}>{i === 0 ? '—' : changes[i] !== null ? `${changes[i].toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

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
            <div className="bg-white rounded-lg shadow-md p-6 pt-12 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Peak Power Over Time</h2>
                <Bar data={peakPowerData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, peakPowerChange)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Jump Height Over Time</h2>
                <Bar data={jumpHeightData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, jumpHeightChange)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">RSI Modified Over Time</h2>
                <Bar data={rsiModifiedData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, rsiChange)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default CMJtestsOverTime