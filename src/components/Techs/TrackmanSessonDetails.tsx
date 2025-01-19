"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
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
import Loader from "@/components/Loader";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TrackmanSessionDetails: React.FC = () => {
  const [dataByPitchType, setDataByPitchType] = useState<Record<
    string,
    {
      speeds: number[];
      spinRates: number[];
      horizontalBreaks: number[];
      verticalAngles: number[];
      timestamps: string[];
    }
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sessionId } = useParams();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const res = await fetch(`/api/trackman/session/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch session data");
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setDataByPitchType(data.dataByPitchType || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!dataByPitchType) return <div>No data available for this session.</div>;

  const pitchTypes = Object.keys(dataByPitchType);

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">
        Trackman Session Details
      </h1>

      {/* Graphs for Each Pitch Type */}
      {pitchTypes.map((pitchType) => {
        const {
          speeds,
          spinRates,
          horizontalBreaks,
          verticalAngles,
          timestamps,
        } = dataByPitchType[pitchType];

        return (
          <div key={pitchType} className="mb-8 bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {pitchType} Details
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Speed Graph */}
              <div>
                <h3 className="text-md font-semibold text-gray-600 mb-2">
                  Pitch Speeds Over Time
                </h3>
                <Line
                  data={{
                    labels: timestamps,
                    datasets: [
                      {
                        label: "Pitch Speed (mph)",
                        data: speeds,
                        borderColor: "rgba(75, 192, 192, 0.8)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        tension: 0.2,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              </div>

              {/* Spin Rate Graph */}
              <div>
                <h3 className="text-md font-semibold text-gray-600 mb-2">
                  Spin Rates Over Time
                </h3>
                <Line
                  data={{
                    labels: timestamps,
                    datasets: [
                      {
                        label: "Spin Rate (rpm)",
                        data: spinRates,
                        borderColor: "rgba(255, 99, 132, 0.8)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        tension: 0.2,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              </div>

              {/* Horizontal Break Graph */}
              <div>
                <h3 className="text-md font-semibold text-gray-600 mb-2">
                  Horizontal Break Over Time
                </h3>
                <Line
                  data={{
                    labels: timestamps,
                    datasets: [
                      {
                        label: "Horizontal Break (inches)",
                        data: horizontalBreaks,
                        borderColor: "rgba(54, 162, 235, 0.8)",
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        tension: 0.2,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              </div>

              {/* Vertical Angle Graph */}
              <div>
                <h3 className="text-md font-semibold text-gray-600 mb-2">
                  Vertical Approach Angle Over Time
                </h3>
                <Line
                  data={{
                    labels: timestamps,
                    datasets: [
                      {
                        label: "Vertical Angle (degrees)",
                        data: verticalAngles,
                        borderColor: "rgba(153, 102, 255, 0.8)",
                        backgroundColor: "rgba(153, 102, 255, 0.2)",
                        tension: 0.2,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackmanSessionDetails;
