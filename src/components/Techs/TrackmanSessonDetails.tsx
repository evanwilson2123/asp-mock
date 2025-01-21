"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import Loader from "@/components/Loader";
import Sidebar from "@/components/Dash/Sidebar";
import CoachSidebar from "../Dash/CoachSidebar";
import ErrorMessage from "../ErrorMessage";
import { useUser } from "@clerk/nextjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

const TrackmanSessionDetails: React.FC = () => {
  const [dataByPitchType, setDataByPitchType] = useState<{
    [key: string]: {
      speeds: number[];
      spinRates: number[];
      horizontalBreaks: number[];
      verticalBreaks: number[];
      locations: { x: number; y: number }[];
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sessionId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/trackman/session/${sessionId}`);
        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? "Trackman data could not be found."
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
    "#5DADE2", // Soft blue
    "#58D68D", // Soft green
    "#F5B041", // Soft orange
    "#AF7AC5", // Soft purple
    "#F1948A", // Soft pink
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
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
                aspectRatio: 1, // Makes it a square plot
                plugins: {
                  legend: { position: "top" },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Speed (mph)" },
                  },
                  y: {
                    title: { display: true, text: "Spin Rate (rpm)" },
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
                aspectRatio: 1, // Makes it a square plot
                plugins: {
                  legend: { position: "top" },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Horizontal Break (inches)" },
                    min: -30,
                    max: 30,
                    grid: {
                      //   drawBorder: true, // Ensures the axis line is drawn
                      //   borderWidth: 2, // Line thickness
                      color: (ctx) =>
                        ctx.tick.value === 0 ? "#000000" : "#CCCCCC", // Black line at 0, light grid elsewhere
                    },
                    ticks: {
                      color: "#000000", // Ensures tick labels are visible
                    },
                  },
                  y: {
                    title: { display: true, text: "Vertical Break (inches)" },
                    min: -30,
                    max: 30,
                    grid: {
                      //   drawBorder: true, // Ensures the axis line is drawn
                      //   borderWidth: 2, // Line thickness
                      color: (ctx) =>
                        ctx.tick.value === 0 ? "#000000" : "#CCCCCC", // Black line at 0, light grid elsewhere
                    },
                    ticks: {
                      color: "#000000", // Ensures tick labels are visible
                    },
                  },
                },
              }}
            />
          </div>

          {/* Location Scatter Plot with Strike Zone */}
          <div className="lg:col-span-2 bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Pitch Location (Strike Zone)
            </h2>
            <Scatter
              data={{
                datasets: pitchTypes.map((pitchType, index) => ({
                  label: pitchType,
                  data: dataByPitchType[pitchType].locations.map(
                    ({ x, y }) => ({
                      x,
                      y,
                    })
                  ),
                  backgroundColor: softColors[index % softColors.length],
                  pointRadius: 6,
                })),
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  annotation: {
                    annotations: {
                      strikeZone: {
                        type: "box",
                        xMin: -0.355, // Adjusted for plate width
                        xMax: 0.355,
                        yMin: 1.5, // Bottom of the strike zone
                        yMax: 3.5, // Top of the strike zone
                        borderWidth: 2,
                        borderColor: "black",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Horizontal Location (ft)" },
                    min: -3,
                    max: 3,
                  },
                  y: {
                    title: { display: true, text: "Vertical Location (ft)" },
                    min: 0,
                    max: 5,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackmanSessionDetails;
