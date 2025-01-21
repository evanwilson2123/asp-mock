"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import Loader from "@/components/Loader";
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
import ErrorMessage from "../ErrorMessage";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Hit {
  velo: number | null;
  dist: number | null;
  LA: number | null;
}

const HitTraxSessionDetails: React.FC = () => {
  const [hits, setHits] = useState<Hit[]>([]);
  const [maxExitVelo, setMaxExitVelo] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [avgLaunchAngle, setAvgLaunchAngle] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sessionId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/hittrax/session/${sessionId}`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? "Hittrax data could not be found."
              : res.status == 500
              ? "We encountered an issue on our end. Please try again later."
              : "An unexpected issue occured. Please try again.";
          setErrorMessage(errorMessage);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setHits(data.hits || []);
        setMaxExitVelo(data.maxExitVelo || 0);
        setMaxDistance(data.maxDistance || 0);
        setAvgLaunchAngle(data.avgLaunchAngle || 0);
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

  const labels = hits.map((_, i) => `Swing ${i + 1}`);
  const exitVeloData = hits.map((h) => (h.velo !== null ? h.velo : 0));
  const distanceData = hits.map((h) => (h.dist !== null ? h.dist : 0));
  const launchAngleData = hits.map((h) => (h.LA !== null ? h.LA : 0));

  const data = {
    labels,
    datasets: [
      {
        label: "Exit Velocity (mph)",
        data: exitVeloData,
        borderColor: "rgba(54, 162, 235, 0.8)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        pointBorderColor: "white",
        pointRadius: 6,
        fill: true,
        tension: 0.2,
      },
      {
        label: "Distance (ft)",
        data: distanceData,
        borderColor: "rgba(75, 192, 192, 0.8)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "white",
        pointRadius: 6,
        fill: true,
        tension: 0.2,
      },
      {
        label: "Launch Angle (°)",
        data: launchAngleData,
        borderColor: "rgba(255, 159, 64, 0.8)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        pointBackgroundColor: "rgba(255, 159, 64, 1)",
        pointBorderColor: "white",
        pointRadius: 6,
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
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Session Details for {sessionId}
        </h1>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">
              Max Exit Velocity
            </h2>
            <div className="mt-4 text-4xl font-semibold text-blue-600">
              {maxExitVelo.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">Max Distance</h2>
            <div className="mt-4 text-4xl font-semibold text-green-600">
              {maxDistance.toFixed(1)} ft
            </div>
          </div>
          <div className="bg-white p-6 rounded shadow w-full md:w-1/3">
            <h2 className="text-lg font-bold text-gray-600">
              Average Launch Angle
            </h2>
            <div className="mt-4 text-4xl font-semibold text-orange-600">
              {avgLaunchAngle.toFixed(1)} °
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Hit Data Over Time
          </h2>
          {hits.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <p className="text-gray-500">No hit data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HitTraxSessionDetails;
