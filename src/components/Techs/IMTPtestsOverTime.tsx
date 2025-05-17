"use client";
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import ErrorMessage from '../ErrorMessage';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface TestData {
    netPeakVerticalForce: number;
    peakVerticalForce: number;
    forceAt100ms: number;
    date?: string;
}

const IMTPtestsOverTime = () => {
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
                const res = await fetch(`/api/athlete/${athleteId}/forceplates/imtp`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error);
                    return;
                }
                setDataOverTime(data.data);
            } catch (error: any) {
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
    const labels = dataOverTime.map((d) => d.date || '');

    // Regression line helper
    function regressionLine(arr: number[]) {
      const n = arr.length;
      if (n === 0) return [];
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

    // Percent change helper
    function percentChange(arr: number[]) {
      return arr.map((val, i) => {
        if (i === 0) return null;
        const prev = arr[i - 1];
        if (!prev) return null;
        return ((val - prev) / prev) * 100;
      });
    }

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

    // Data arrays
    const netPeakArr = dataOverTime.map((d) => d.netPeakVerticalForce);
    const peakArr = dataOverTime.map((d) => d.peakVerticalForce);
    const force100Arr = dataOverTime.map((d) => d.forceAt100ms);

    // Regression lines (halved)
    const netPeakTrend = regressionLine(netPeakArr).map(v => v / 2);
    const peakTrend = regressionLine(peakArr).map(v => v / 2);
    const force100Trend = regressionLine(force100Arr).map(v => v / 2);

    // Percent changes
    const netPeakChange = percentChange(netPeakArr);
    const peakChange = percentChange(peakArr);
    const force100Change = percentChange(force100Arr);

    const netPeakData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Net Peak Vertical Force (N)',
          data: netPeakArr,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: netPeakTrend,
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
    const peakData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Peak Vertical Force (N)',
          data: peakArr,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: peakTrend,
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
    const force100msData = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Force at 100ms (N)',
          data: force100Arr,
          backgroundColor: 'rgba(251, 191, 36, 0.7)',
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Trend',
          data: force100Trend,
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
            <div className="bg-white rounded-lg shadow-md p-6 pt-12 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Net Peak Vertical Force Over Time</h2>
                <Bar data={netPeakData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, netPeakChange)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Peak Vertical Force Over Time</h2>
                <Bar data={peakData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, peakChange)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Force at 100ms Over Time</h2>
                <Bar data={force100msData as any} options={barOptions} />
              </div>
              <div className="mt-6 md:mt-0 md:w-56">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Progression Table</h3>
                {renderProgressionTable(labels, force100Change)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default IMTPtestsOverTime