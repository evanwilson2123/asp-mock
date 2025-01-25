"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "../Dash/CoachSidebar";
import Sidebar from "../Dash/Sidebar";
import Loader from "../Loader";
import Link from "next/link";

// Chart Imports
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
import SignInPrompt from "../SignInPrompt";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SessionScore {
  date: string;
  armScore: number;
}

interface Session {
  sessionId: string;
  date: string;
}

// --- COLOR HELPERS ---

const NORMAL_CLASS = "text-blue-600";
const WATCH_CLASS = "text-yellow-600";
const WARNING_CLASS = "text-pink-600";

/**
 * getStrengthColor
 * For IR or ER, thresholds:
 *  - Normal: >20% BW
 *  - Watch: 15-20% BW
 *  - Warning: <15% BW
 * For scaption: normal>15%, watch=10-15%, warning<10%
 */
function getStrengthColor(
  percentBW: number,
  type: "IR" | "ER" | "Scaption" | "Total"
) {
  if (type === "IR" || type === "ER") {
    if (percentBW > 20) return NORMAL_CLASS;
    if (percentBW >= 15) return WATCH_CLASS;
    return WARNING_CLASS;
  } else if (type === "Scaption") {
    if (percentBW > 15) return NORMAL_CLASS;
    if (percentBW >= 10) return WATCH_CLASS;
    return WARNING_CLASS;
  } else if (type === "Total") {
    // E.g. normal>70%, watch=50-70%, warning<50%
    if (percentBW > 70) return NORMAL_CLASS;
    if (percentBW >= 50) return WATCH_CLASS;
    return WARNING_CLASS;
  }
  return "";
}

/**
 * Example for Shoulder Balance (ER:IR ratio):
 *  - Normal: 0.85-1.05
 *  - Watch: 0.70-0.84 or 1.06-1.20
 *  - Warning: <0.70 or >1.20
 */
function getShoulderBalanceColor(ratio: number) {
  if (ratio >= 0.85 && ratio <= 1.05) return NORMAL_CLASS;
  if ((ratio >= 0.7 && ratio < 0.85) || (ratio > 1.05 && ratio <= 1.2))
    return WATCH_CLASS;
  return WARNING_CLASS;
}

const ArmCareStats: React.FC = () => {
  // ===== STATE  =====
  // Body weight
  const [bodyWeight, setBodyWeight] = useState<number>(0);

  // All-time max
  const [maxInternal, setMaxInternal] = useState<number>(0);
  const [maxExternal, setMaxExternal] = useState<number>(0);
  const [maxScaption, setMaxScaption] = useState<number>(0);
  const [internalRom, setInternalRom] = useState<number>(0);
  const [externalRom, setExternalRom] = useState<number>(0);
  const [maxShoulderFlexion, setMaxShoulderFlexion] = useState<number>(0);

  // Latest
  const [latestInternal, setLatestInternal] = useState<number>(0);
  const [latestExternal, setLatestExternal] = useState<number>(0);
  const [latestScaption, setLatestScaption] = useState<number>(0);
  const [latestInternalRom, setLatestInternalRom] = useState<number>(0);
  const [latestExternalRom, setLatestExternalRom] = useState<number>(0);
  const [latestShoulderFlexion, setLatestShoulderFlexion] = useState<number>(0);

  // Session/Chart
  const [sessionData, setSessionData] = useState<SessionScore[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Manage state
  const [loading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Fetch
  useEffect(() => {
    const fetchArmData = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/reports/arm-care`);
        if (!res.ok) {
          const errorMsg =
            res.status === 404
              ? "Arm Care data could not be found."
              : res.status === 500
              ? "We encountered an issue on our end. Please try again later."
              : "An unexpected issue occurred. Please try again.";
          setErrorMessage(errorMsg);
          return;
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Body weight
        setBodyWeight(data.bodyWeight || 0);

        // All-time max
        setMaxInternal(data.maxInternal || 0);
        setMaxExternal(data.maxExternal || 0);
        setMaxScaption(data.maxScaption || 0);
        setInternalRom(data.internalRom || 0);
        setExternalRom(data.externalRom || 0);
        setMaxShoulderFlexion(data.maxShoulderFlexion || 0);

        // Latest
        setLatestInternal(data.latestInternal || 0);
        setLatestExternal(data.latestExternal || 0);
        setLatestScaption(data.latestScaption || 0);
        setLatestInternalRom(data.latestInternalRom || 0);
        setLatestExternalRom(data.latestExternalRom || 0);
        setLatestShoulderFlexion(data.latestShoulderFlexion || 0);

        // Sessions
        setSessionData(data.sessionAverages || []);
        setSessions(data.sessions || []);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArmData();
  }, [athleteId]);

  // If no role found, prompt sign-in
  if (!role) {
    return <SignInPrompt />;
  }

  if (loading) {
    return <Loader />;
  }
  if (errorMessage) {
    return <ErrorMessage role={role as string} message={errorMessage} />;
  }

  // For chart
  const labels = sessionData.map((s) => s.date);
  const scoreData = sessionData.map((s) => s.armScore);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Arm Score",
        data: scoreData,
        borderColor: "rgba(54, 162, 235, 0.8)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.2,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" as const } },
  };

  // --- Compute % of BW for the LATEST strengths ---
  // We'll color-code the LATEST values. (You could also do it for the max if you prefer.)
  const irPercent = bodyWeight ? (latestInternal / bodyWeight) * 100 : 0;
  const erPercent = bodyWeight ? (latestExternal / bodyWeight) * 100 : 0;
  const scapPercent = bodyWeight ? (latestScaption / bodyWeight) * 100 : 0;

  // Example: if you also want total strength (some ArmCare records have totalStrength),
  // you could do totalPercent = (totalStrength / bodyWeight)*100, color-coded as well.

  // Shoulder Balance example: ratio = ER / IR
  const ratio = latestInternal === 0 ? 0 : latestExternal / latestInternal;

  // Determine color classes
  const irClass = getStrengthColor(irPercent, "IR");
  const erClass = getStrengthColor(erPercent, "ER");
  const scapClass = getStrengthColor(scapPercent, "Scaption");
  const sbClass = getShoulderBalanceColor(ratio);

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
          Arm Care Report
        </h1>

        {/* Session List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Sessions (Latest to Earliest)
          </h2>
          <ul className="bg-white p-4 rounded shadow text-black">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <li
                  key={session.sessionId}
                  className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                >
                  <Link href={`/arm-care/${session.sessionId}`}>
                    {session.date} (Session ID: {session.sessionId})
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-gray-500">No session data available.</p>
            )}
          </ul>
        </div>

        {/* Example: Display color-coded latest IR, ER, Scaption */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Latest Strength (Color-Coded)
          </h2>
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className={`text-xl ${irClass}`}>
              IR Strength: {irPercent.toFixed(1)}% BW
            </div>
            <div className={`text-xl ${erClass}`}>
              ER Strength: {erPercent.toFixed(1)}% BW
            </div>
            <div className={`text-xl ${scapClass}`}>
              Scaption: {scapPercent.toFixed(1)}% BW
            </div>

            {/* Example shoulder balance ratio color-coded */}
            <div className={`text-xl ${sbClass}`}>
              Shoulder Balance (ER:IR): {ratio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* All-time Max + Latest (unchanged from earlier) */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            All-Time Max &amp; Latest
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {/* All-time max */}
            <div className="bg-white p-6 rounded shadow flex-1">
              <h3 className="text-md font-bold text-gray-600 mb-4">
                All-Time Max
              </h3>
              <div className="flex flex-col gap-4 text-gray-700">
                <div>
                  <strong>Internal Strength:</strong> {maxInternal} lbs
                </div>
                <div>
                  <strong>External Strength:</strong> {maxExternal} lbs
                </div>
                <div>
                  <strong>Scaption Strength:</strong> {maxScaption} lbs
                </div>
                <div>
                  <strong>Internal ROM:</strong> {internalRom}°
                </div>
                <div>
                  <strong>External ROM:</strong> {externalRom}°
                </div>
                <div>
                  <strong>Shoulder Flexion:</strong> {maxShoulderFlexion}°
                </div>
              </div>
            </div>

            {/* Latest */}
            <div className="bg-white p-6 rounded shadow flex-1">
              <h3 className="text-md font-bold text-gray-600 mb-4">
                Latest Scores
              </h3>
              <div className="flex flex-col gap-4 text-gray-700">
                <div>
                  <strong>Internal Strength:</strong> {latestInternal} lbs
                </div>
                <div>
                  <strong>External Strength:</strong> {latestExternal} lbs
                </div>
                <div>
                  <strong>Scaption Strength:</strong> {latestScaption} lbs
                </div>
                <div>
                  <strong>Internal ROM:</strong> {latestInternalRom}°
                </div>
                <div>
                  <strong>External ROM:</strong> {latestExternalRom}°
                </div>
                <div>
                  <strong>Shoulder Flexion:</strong> {latestShoulderFlexion}°
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Averages Over Time (Line Chart) */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Arm Scores Over Time
          </h2>
          {sessionData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArmCareStats;
