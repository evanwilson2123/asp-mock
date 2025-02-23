'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
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

interface BlastMotionSwing {
  id: number;
  sessionId: string;
  sessionName: string;
  athlete: string;
  date: string;
  swingId: string;
  equipment: string | null;
  handedness: string | null;
  swingDetails: string | null;
  planeScore: number | null;
  connectionScore: number | null;
  rotationScore: number | null;
  batSpeed: number | null;
  rotationalAcceleration: number | null;
  onPlaneEfficiency: number | null;
  attackAngle: number | null;
  earlyConnection: number | null;
  connectionAtImpact: number | null;
  verticalBatAngle: number | null;
  power: number | null;
  timeToContact: number | null;
  peakHandSpeed: number | null;
  createdAt: string;
  updatedAt: string;
  playLevel: string;
}

/**
 * BlastMotionSessionDetails Component
 *
 * This component displays detailed statistics for a specific Blast Motion session,
 * including an interactive line chart and a paginated table of swing data.
 * The table shows all fields except ID, sessionId, sessionName, athlete, date, and swingId.
 */
const BlastMotionSessionDetails: React.FC = () => {
  const [swings, setSwings] = useState<BlastMotionSwing[]>([]);
  const [maxBatSpeed, setMaxBatSpeed] = useState<number>(0);
  const [maxHandSpeed, setMaxHandSpeed] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const swingsPerPage = 10;

  const { sessionId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/blast-motion/session/${sessionId}`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'Blast Motion data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errorMessage);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Save full swing objects (all fields)
        setSwings(data.swings || []);

        // Calculate max values using batSpeed and peakHandSpeed
        const batSpeeds = (data.swings || [])
          .map((s: BlastMotionSwing) => s.batSpeed)
          .filter((s: number | null): s is number => s !== null);
        const handSpeeds = (data.swings || [])
          .map((s: BlastMotionSwing) => s.peakHandSpeed)
          .filter((s: number | null): s is number => s !== null);

        setMaxBatSpeed(batSpeeds.length > 0 ? Math.max(...batSpeeds) : 0);
        setMaxHandSpeed(handSpeeds.length > 0 ? Math.max(...handSpeeds) : 0);
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

  // Prepare chart data
  const labels = swings.map((_, i) => `Swing ${i + 1}`);
  const batSpeedData = swings.map((s) =>
    s.batSpeed !== null ? s.batSpeed : 0
  );
  const handSpeedData = swings.map((s) =>
    s.peakHandSpeed !== null ? s.peakHandSpeed : 0
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Bat Speed',
        data: batSpeedData,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Hand Speed',
        data: handSpeedData,
        borderColor: 'rgba(75, 192, 192, 0.8)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Pagination logic
  const indexOfLastSwing = currentPage * swingsPerPage;
  const indexOfFirstSwing = indexOfLastSwing - swingsPerPage;
  const currentSwings = swings.slice(indexOfFirstSwing, indexOfLastSwing);
  const totalPages = Math.ceil(swings.length / swingsPerPage);

  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Session Details for {sessionId}
        </h1>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow w-full md:w-1/2">
            <h2 className="text-lg font-bold text-gray-600">Max Bat Speed</h2>
            <div className="mt-4 text-4xl font-semibold text-blue-600">
              {maxBatSpeed.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/2">
            <h2 className="text-lg font-bold text-gray-600">Max Hand Speed</h2>
            <div className="mt-4 text-4xl font-semibold text-green-600">
              {maxHandSpeed.toFixed(1)} mph
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Swing Data Over Time
          </h2>
          {swings.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <p className="text-gray-500">No swing data available.</p>
          )}
        </div>

        {/* Paginated Table without ID, sessionId, sessionName, athlete, date, or swingId */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Swing Details
          </h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Equipment',
                  'Handedness',
                  'Swing Details',
                  'Plane Score',
                  'Connection Score',
                  'Rotation Score',
                  'Bat Speed',
                  'Rotational Acceleration',
                  'On-Plane Efficiency',
                  'Attack Angle',
                  'Early Connection',
                  'Connection At Impact',
                  'Vertical Bat Angle',
                  'Power',
                  'Time To Contact',
                  'Peak Hand Speed',
                  // 'Created At',
                  // 'Updated At',
                  'Play Level',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-2 py-1 text-left text-xs font-medium text-black uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSwings.map((swing, idx) => (
                <tr key={indexOfFirstSwing + idx}>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.equipment ?? 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.handedness ?? 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.swingDetails ?? 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.planeScore !== null ? swing.planeScore : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.connectionScore !== null
                      ? swing.connectionScore
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.rotationScore !== null ? swing.rotationScore : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.batSpeed !== null ? swing.batSpeed : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.rotationalAcceleration !== null
                      ? swing.rotationalAcceleration
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.onPlaneEfficiency !== null
                      ? swing.onPlaneEfficiency
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.attackAngle !== null ? swing.attackAngle : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.earlyConnection !== null
                      ? swing.earlyConnection
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.connectionAtImpact !== null
                      ? swing.connectionAtImpact
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.verticalBatAngle !== null
                      ? swing.verticalBatAngle
                      : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.power !== null ? swing.power : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.timeToContact !== null ? swing.timeToContact : 'N/A'}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.peakHandSpeed !== null ? swing.peakHandSpeed : 'N/A'}
                  </td>
                  {/* <td className="px-2 py-1 text-xs text-black">
                    {swing.createdAt}
                  </td>
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.updatedAt}
                  </td> */}
                  <td className="px-2 py-1 text-xs text-black">
                    {swing.playLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlastMotionSessionDetails;
