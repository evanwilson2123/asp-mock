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
import SignInPrompt from "../SignInPrompt";

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
  avgExitVelo: number;
}

const HitTraxStats: React.FC = () => {
  const [maxExitVelo, setMaxExitVelo] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [hardHitAverage, setHardHitAverage] = useState<number>(0);
  const [sessionData, setSessionData] = useState<SessionAvg[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchHitTraxData = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/reports/hittrax`);
        if (!res.ok) {
          throw new Error("Failed to fetch HitTrax data");
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setMaxExitVelo(data.maxExitVelo || 0);
        setMaxDistance(data.maxDistance || 0);
        setHardHitAverage(data.hardHitAverage || 0);
        setSessionData(data.sessionAverages || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHitTraxData();
  }, [athleteId]);

  if (loading) {
    return <Loader />;
  }
  if (!role) {
    return <SignInPrompt />;
  }
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Prepare chart data from sessionData
  const labels = sessionData.map((s) => s.date);
  const avgExitVeloData = sessionData.map((s) => s.avgExitVelo);

  // Chart.js dataset config
  const data = {
    labels,
    datasets: [
      {
        label: "Avg Exit Velo",
        data: avgExitVeloData,
        borderColor: "rgba(255, 99, 132, 0.8)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
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
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          HitTrax Report
        </h1>

        {/* All-time stats */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          {/* Max Exit Velo */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Max Exit Velo
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-red-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-red-600">
                {maxExitVelo}
              </span>
            </div>
            <p className="mt-2 text-red-600 font-medium">mph</p>
          </div>

          {/* Max Distance */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Max Distance
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-green-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-green-600">
                {maxDistance}
              </span>
            </div>
            <p className="mt-2 text-green-600 font-medium">ft</p>
          </div>

          {/* Hard Hit Average */}
          <div className="bg-white p-6 rounded shadow flex flex-col items-center w-full md:w-1/3">
            <span className="text-xl font-bold text-gray-600">
              Hard Hit Average
            </span>
            <div className="mt-4 relative rounded-full w-40 h-40 border-8 border-purple-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-purple-600">
                {(hardHitAverage * 100).toFixed(1)}%
              </span>
            </div>
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

export default HitTraxStats;
