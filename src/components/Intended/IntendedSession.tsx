'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Scatter } from 'react-chartjs-2';
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
import annotationPlugin from 'chartjs-plugin-annotation';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import { useUser } from '@clerk/nextjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Intended {
  id: number;
  sessionId: string;
  athleteId: string;
  pitchType: string;
  intendedX: number;
  intendedY: number;
  actualX: number;
  actualY: number;
  distanceIn: number;
  distancePer: number;
  playLevel: string;
  createdAt: string;
  updatedAt: string;
}

const IntendedSession: React.FC = () => {
  const { sessionId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const [intendedData, setIntendedData] = useState<Intended[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/intended-zone/session/${sessionId}`);
        if (!res.ok) {
          const errMsg =
            res.status === 404
              ? 'Session data not found.'
              : 'An error occurred while fetching session data.';
          setErrorMessage(errMsg);
          return;
        }
        const data = await res.json();
        // Expecting the API to return an object like { intendedData: Intended[] }
        setIntendedData(data.intendedData || []);
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;
  if (!intendedData.length)
    return <div className="p-6">No session data available.</div>;

  // Group data by pitchType
  const dataByPitchType: { [key: string]: Intended[] } = {};
  intendedData.forEach((record) => {
    if (!dataByPitchType[record.pitchType]) {
      dataByPitchType[record.pitchType] = [];
    }
    dataByPitchType[record.pitchType].push(record);
  });

  // Calculate aggregated metrics per pitch type
  const aggregatedMetrics = Object.keys(dataByPitchType).map((pitchType) => {
    const records = dataByPitchType[pitchType];
    const count = records.length;
    const totalDistanceIn = records.reduce(
      (sum, rec) => sum + rec.distanceIn,
      0
    );
    const totalDistancePer = records.reduce(
      (sum, rec) => sum + rec.distancePer,
      0
    );
    const avgDistanceIn = totalDistanceIn / count;
    const avgDistancePer = totalDistancePer / count;

    // Calculate average directional miss (difference between actual and intended)
    const avgDeltaX =
      records.reduce((sum, rec) => sum + (rec.actualX - rec.intendedX), 0) /
      count;
    const avgDeltaY =
      records.reduce((sum, rec) => sum + (rec.actualY - rec.intendedY), 0) /
      count;
    // Compute the angle in degrees (using Math.atan2)
    const avgAngle = (Math.atan2(avgDeltaY, avgDeltaX) * 180) / Math.PI;

    return {
      pitchType,
      count,
      avgDistanceIn: avgDistanceIn.toFixed(2),
      avgDistancePer: avgDistancePer.toFixed(2),
      avgDirection: avgAngle.toFixed(2),
    };
  });

  // Define base color values (RGB only) for each pitch type.
  // Adjust or add more colors as needed.
  const baseColorValues = [
    '255, 99, 132', // Red
    '54, 162, 235', // Blue
    '75, 192, 192', // Green
    '153, 102, 255', // Purple
    '255, 159, 64', // Orange
  ];

  // Prepare scatter datasets: one dataset for intended (circle) and one for actual (triangle) per pitch type.
  const scatterDatasets: any[] = [];
  Object.keys(dataByPitchType).forEach((pitchType, index) => {
    const records = dataByPitchType[pitchType];
    const colorBase = baseColorValues[index % baseColorValues.length];
    // Lighter shade for intended; darker for actual.
    const intendedColor = `rgba(${colorBase}, 0.5)`;
    const actualColor = `rgba(${colorBase}, 0.8)`;

    scatterDatasets.push({
      label: `${pitchType} - Intended`,
      data: records.map((rec) => ({
        x: rec.intendedX,
        y: rec.intendedY,
      })),
      backgroundColor: intendedColor,
      pointStyle: 'circle',
      pointRadius: 6,
    });
    scatterDatasets.push({
      label: `${pitchType} - Actual`,
      data: records.map((rec) => ({
        x: rec.actualX,
        y: rec.actualY,
      })),
      backgroundColor: actualColor,
      pointStyle: 'triangle',
      pointRadius: 6,
    });
  });

  const scatterData = {
    datasets: scatterDatasets,
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' as const },
      annotation: {
        annotations: {
          strikeZone: {
            type: 'box',
            xMin: -0.83,
            xMax: 0.83,
            yMin: 1.513,
            yMax: 3.67,
            borderWidth: 2,
            borderColor: 'rgba(0,0,0,0.7)',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Horizontal Location (ft)' },
        min: -3,
        max: 3,
      },
      y: {
        title: { display: true, text: 'Vertical Location (ft)' },
        min: 0,
        max: 5,
      },
    },
    aspectRatio: 1,
  };

  return (
    <div className="flex flex-col overflow-x-hidden md:flex-row min-h-screen">
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Intended Session Details — Session: {sessionId}
        </h1>

        {/* Aggregated Metrics Table */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Aggregated Metrics by Pitch Type
          </h2>
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-black">
                <th className="py-2 px-4 text-left">Pitch Type</th>
                <th className="py-2 px-4 text-left"># Pitches</th>
                <th className="py-2 px-4 text-left">Avg Miss (inches)</th>
                <th className="py-2 px-4 text-left">Avg Miss (%)</th>
                <th className="py-2 px-4 text-left">Avg Direction (°)</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedMetrics.map((metric) => (
                <tr key={metric.pitchType} className="border-b text-gray-900">
                  <td className="py-2 px-4">{metric.pitchType}</td>
                  <td className="py-2 px-4">{metric.count}</td>
                  <td className="py-2 px-4">{metric.avgDistanceIn}</td>
                  <td className="py-2 px-4">{metric.avgDistancePer}</td>
                  <td className="py-2 px-4">{metric.avgDirection}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scatter Plot: Intended vs. Actual */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Actual vs. Intended Pitch Locations
          </h2>
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
      </div>
    </div>
  );
};

export default IntendedSession;
