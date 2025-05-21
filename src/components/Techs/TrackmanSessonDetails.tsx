'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scatter, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LineController,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import Loader from '@/components/Loader';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '../Dash/CoachSidebar';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import AthleteSidebar from '../Dash/AthleteSidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

/**
 * TrackmanSessionDetails Component
 *
 * This component provides detailed visual analytics for a specific pitching session
 * using Trackman data. It allows coaches and athletes to analyze pitch characteristics,
 * including speed, spin rate, movement, and pitch location, offering valuable insights
 * into performance trends and pitch effectiveness.
 */
const TrackmanSessionDetails: React.FC = () => {
  const [dataByPitchType, setDataByPitchType] = useState<{
    [key: string]: {
      speeds: number[];
      spinRates: number[];
      horizontalBreaks: number[];
      verticalBreaks: number[];
      locations: { x: number; y: number }[];
      stuffPlus?: number[];
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sessionId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/trackman/session/${sessionId}`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'Trackman data could not be found.'
              : res.status == 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occured. Please try again.';
          setErrorMessage(errorMessage);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setDataByPitchType(data.dataByPitchType || {});
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div className="text-red-500">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );
  if (!dataByPitchType) return <div>No data available for this session.</div>;

  const pitchTypes = Object.keys(dataByPitchType);
  const softColors = [
    '#5DADE2', // Soft blue
    '#58D68D', // Soft green
    '#F5B041', // Soft orange
    '#AF7AC5', // Soft purple
    '#F1948A', // Soft pink
  ];

  // Find the max number of pitches for any type
  const maxStuffPlusLength = Math.max(
    ...pitchTypes.map((pitchType) => (dataByPitchType[pitchType].stuffPlus || []).length)
  );
  const stuffPlusLabels = Array.from({ length: maxStuffPlusLength }, (_, i) => i + 1);

  const stuffPlusChartData = {
    labels: stuffPlusLabels,
    datasets: pitchTypes.map((pitchType, index) => ({
      label: pitchType,
      data: dataByPitchType[pitchType].stuffPlus || [],
      borderColor: softColors[index % softColors.length],
      backgroundColor: softColors[index % softColors.length],
      fill: false,
      tension: 0.2,
    })),
  };

  const stuffPlusChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Stuff+ Score by Pitch Number' },
    },
    scales: {
      x: {
        title: { display: true, text: 'Pitch Number' },
      },
      y: {
        title: { display: true, text: 'Stuff+ Score' },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
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
      <div className="flex-1 p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Trackman Session Details
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Speed vs. Spin Rate Scatter Plot */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Speed vs. Spin Rate
            </h2>
            <Scatter
              data={{
                datasets: pitchTypes.map((pitchType, index) => ({
                  label: pitchType,
                  data: dataByPitchType[pitchType].speeds.map((speed, i) => ({
                    x: speed,
                    y: dataByPitchType[pitchType].spinRates[i],
                  })),
                  backgroundColor: softColors[index % softColors.length],
                  pointRadius: 6,
                })),
              }}
              options={{
                responsive: true,
                aspectRatio: 1,
                plugins: {
                  legend: { position: 'top' },
                },
                scales: {
                  x: {
                    title: { display: true, text: 'Speed (mph)' },
                  },
                  y: {
                    title: { display: true, text: 'Spin Rate (rpm)' },
                  },
                },
              }}
            />
          </div>

          {/* Horizontal vs Vertical Break Scatter Plot */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Horizontal vs. Vertical Break
            </h2>
            <Scatter
              data={{
                datasets: pitchTypes.map((pitchType, index) => ({
                  label: pitchType,
                  data: dataByPitchType[pitchType].horizontalBreaks.map(
                    (hBreak, i) => ({
                      x: hBreak,
                      y: dataByPitchType[pitchType].verticalBreaks[i],
                    })
                  ),
                  backgroundColor: softColors[index % softColors.length],
                  pointRadius: 6,
                })),
              }}
              options={{
                responsive: true,
                aspectRatio: 1,
                plugins: {
                  legend: { position: 'top' },
                },
                scales: {
                  x: {
                    title: { display: true, text: 'Horizontal Break (inches)' },
                    min: -30,
                    max: 30,
                    grid: {
                      color: (ctx) =>
                        ctx.tick.value === 0 ? '#000000' : '#CCCCCC',
                    },
                    ticks: {
                      color: '#000000',
                    },
                  },
                  y: {
                    title: { display: true, text: 'Vertical Break (inches)' },
                    min: -30,
                    max: 30,
                    grid: {
                      color: (ctx) =>
                        ctx.tick.value === 0 ? '#000000' : '#CCCCCC',
                    },
                    ticks: {
                      color: '#000000',
                    },
                  },
                },
              }}
            />
          </div>

          {/* Pitch Location Scatter Plot with Strike Zone */}
          <div className="flex justify-center items-center lg:col-span-2 bg-white p-6 rounded shadow">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Pitch Location (Strike Zone)
              </h2>
              <div
                style={{
                  width: '600px',
                  height: '600px',
                }}
              >
                <Scatter
                  data={{
                    datasets: pitchTypes.map((pitchType, index) => ({
                      label: pitchType,
                      data: dataByPitchType[pitchType].locations,
                      backgroundColor: softColors[index % softColors.length],
                      pointRadius: 6,
                    })),
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: 'top' },
                      annotation: {
                        annotations: {
                          outerStrikeZone: {
                            type: 'box',
                            xMin: -0.83,
                            xMax: 0.83,
                            yMin: 1.513,
                            yMax: 3.67,
                            borderWidth: 2,
                            borderColor: 'rgba(0, 0, 0, 0.7)',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          },
                          innerStrikeZone: {
                            type: 'box',
                            xMin: -0.703,
                            xMax: 0.703,
                            yMin: 1.64,
                            yMax: 3.55,
                            borderWidth: 1,
                            borderColor: 'rgba(0, 0, 0, 0.7)',
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Horizontal Location (ft)',
                        },
                        min: -3,
                        max: 3,
                        ticks: { stepSize: 1 },
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Vertical Location (ft)',
                        },
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1 },
                      },
                    },
                    layout: {
                      padding: {
                        top: 20,
                      },
                    },
                    aspectRatio: 1,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stuff+ Score by Pitch Line Chart */}
          <div className="bg-white p-6 rounded shadow lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Stuff+ Score by Pitch
            </h2>
            <Line data={stuffPlusChartData} options={stuffPlusChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackmanSessionDetails;
