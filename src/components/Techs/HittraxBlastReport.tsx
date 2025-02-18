'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import dynamic from 'next/dynamic';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';

// Dynamically import the Line chart to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Session {
  date: string;
  avgSquaredUpRate: number;
}

interface ReportData {
  avgSquaredUpRate: number; // overall average as a fraction (e.g., 0.85 for 85%)
  sessions: Session[];
  percentSwingsAbove80: number; // percentage of swings above 80 squared up
  goal: number; // expected goal (80 in this case)
}

const HittraxBlastReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(
          `/api/athlete/${athleteId}/reports/hittrax-blast`
        );
        if (!response.ok) {
          const errMsg =
            response.status === 404
              ? 'Report not found.'
              : 'An error occurred.';
          setErrorMessage(errMsg);
          return;
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setReportData(data);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [athleteId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  // Ensure reportData is defined before proceeding
  if (!reportData) return null;

  // Prepare data for the line chart (session trends for average squared up rate)
  const sessionDates = reportData.sessions.map((session) => session.date);
  const sessionAvgRates = reportData.sessions.map(
    (session) => session.avgSquaredUpRate
  );

  const chartData = {
    labels: sessionDates,
    datasets: [
      {
        label: 'Average Squared Up Rate',
        data: sessionAvgRates,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
      },
    },
  };

  // Fallback for percentSwingsAbove80 in case it's undefined
  const percentSwings =
    typeof reportData.percentSwingsAbove80 === 'number'
      ? reportData.percentSwingsAbove80
      : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar for mobile and desktop */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      <div className="flex-1 p-6 bg-gray-100 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          HitTrax Blast Overview
        </h1>

        {/* Global Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Average Squared Up Rate (% of all swings) */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center">
            <span className="text-xl font-bold text-gray-600">
              Average Squared Up Rate
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-blue-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-blue-600">
                {(reportData.avgSquaredUpRate || 0).toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-blue-600 font-medium">%</p>
          </div>

          {/* % of Swings Above 80% Squared Up */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center">
            <span className="text-xl font-bold text-gray-600">
              % Of Swings Above 80% Squared Up
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-green-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-green-600">
                {percentSwings.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-green-600 font-medium">%</p>
          </div>
        </div>

        {/* Line Chart for Session Averages */}
        <div
          className="bg-white p-6 rounded shadow mb-8"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Squared Up Rate Over Time
          </h2>
          {reportData.sessions.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HittraxBlastReport;
