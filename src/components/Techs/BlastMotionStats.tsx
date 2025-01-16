"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import Loader from "@/components/Loader";

// Chart imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SessionAvg {
  date: string;
  avgBatSpeed: number;
  avgHandSpeed: number;
}

const BlastMotionStats: React.FC = () => {
  const [maxBatSpeed, setMaxBatSpeed] = useState<number>(0);
  const [maxHandSpeed, setMaxHandSpeed] = useState<number>(0);
  const [sessionData, setSessionData] = useState<SessionAvg[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Fetch aggregator data on mount
  useEffect(() => {
    const fetchBlastData = async () => {
      try {
        const res = await fetch(
          `/api/athlete/${athleteId}/reports/blast-motion`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch Blast Motion data");
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setMaxBatSpeed(data.maxBatSpeed || 0);
        setMaxHandSpeed(data.maxHandSpeed || 0);
        setSessionData(data.sessionAverages || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlastData();
  }, [athleteId]);

  if (loading) {
    return <Loader />;
  }
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Prepare chart data from sessionData
  const labels = sessionData.map((s) => s.date);
  const batSpeedData = sessionData.map((s) => s.avgBatSpeed);
  const handSpeedData = sessionData.map((s) => s.avgHandSpeed);

  // Chart.js dataset config
  const data = {
    labels,
    datasets: [
      {
        label: "Avg Bat Speed",
        data: batSpeedData,
        borderColor: "rgba(54, 162, 235, 0.8)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.2,
      },
      {
        label: "Avg Hand Speed",
        data: handSpeedData,
        borderColor: "rgba(75, 192, 192, 0.8)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Blast Motion Report
        </h1>

        {/* All-time max speed stats */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          {/* Bat Speed Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/2">
            <span className="text-xl font-bold text-gray-600">
              Max Bat Speed
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-blue-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-blue-600">
                {maxBatSpeed}
              </span>
            </div>
            <p className="mt-2 text-blue-600 font-medium">mph</p>
          </div>

          {/* Hand Speed Card */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/2">
            <span className="text-xl font-bold text-gray-600">
              Max Hand Speed
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-green-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-green-600">
                {maxHandSpeed}
              </span>
            </div>
            <p className="mt-2 text-green-600 font-medium">mph</p>
          </div>
        </div>

        {/* Averages Over Time (Line Chart) */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Averages Over Time
          </h2>
          {sessionData.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlastMotionStats;
