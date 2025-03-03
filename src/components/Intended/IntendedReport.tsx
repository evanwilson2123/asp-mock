'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import Link from 'next/link';
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

interface IntendedAvg {
  date: string;
  pitches: {
    pitchType: string;
    avgMiss: number;
    avgHorz: number;
    avgVert: number;
  }[];
}

interface GlobalAverage {
  pitchType: string;
  avgMiss: number;
  avgHorz: number;
  avgVert: number;
}

interface Session {
  sessionId: string;
  date: string;
}

const IntendedReport: React.FC = () => {
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const [intendedData, setIntendedData] = useState<IntendedAvg[]>([]);
  const [globalAverages, setGlobalAverages] = useState<GlobalAverage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchIntendedReport = async () => {
      try {
        const response = await fetch(
          `/api/athlete/${athleteId}/reports/intended-zone`
        );
        if (!response.ok) {
          const errorMessage =
            response.status === 404
              ? 'Intended-Zone data could not be found.'
              : response.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again later.';
          setError(errorMessage);
          return;
        }

        const data = await response.json();
        setIntendedData(data.intendedData);
        setGlobalAverages(data.globalAverages);
        setSessions(data.sessions);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntendedReport();
  }, [athleteId]);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={error} />
      </div>
    );
  }

  // Prepare data for the chart
  const labels = intendedData.map((d) => d.date);
  const avgMissData = intendedData.map(
    (d) => d.pitches.reduce((sum, p) => sum + p.avgMiss, 0) / d.pitches.length
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Average Miss Over Time',
        data: avgMissData,
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

  return (
    <div className="flex flex-col overflow-x-hidden md:flex-row min-h-screen">
      {/* Sidebar for mobile and desktop */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Profile
          </button>
          {['Assessments', 'Pitching', 'Hitting', 'Goals'].map((tech) => (
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
        <h1 className="text-3xl font-bold text-gray-700 mb-6 flex justify-center">
          Intended Overview
        </h1>

        {/* Global Averages by Pitch Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {globalAverages.map(
            ({ pitchType, avgMiss, avgHorz, avgVert }, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded shadow flex flex-col items-center"
              >
                <h2 className="text-lg font-semibold text-gray-600">
                  {pitchType}
                </h2>
                <div className="mt-4 text-xl text-black">
                  <p>
                    <strong>Avg Miss:</strong> {avgMiss.toFixed(2)} in
                  </p>
                  <p>
                    <strong>Avg Horz:</strong> {avgHorz.toFixed(2)} in
                  </p>
                  <p>
                    <strong>Avg Vert:</strong> {avgVert.toFixed(2)} in
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Clickable Session List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Latest to Earliest)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.map((session) => (
              <li
                key={session.sessionId}
                className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
              >
                <Link href={`/intended-zone/${session.sessionId}`}>
                  {session.date} (Session ID: {session.sessionId})
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Chart for Average Miss Over Time */}
        <div
          className="bg-white p-6 rounded shadow"
          style={{ minHeight: '300px' }}
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Average Miss Over Time
          </h2>
          {intendedData.length > 0 ? (
            <div className="w-full h-72 md:h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-500">No intended data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntendedReport;
