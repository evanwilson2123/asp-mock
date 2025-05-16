'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';

import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

interface Test {
  id: number;
  date: string; // ISO string after JSON stringify
  peakPower?: number;
  jumpHeight?: number;
  peakVerticalForce?: number;
  rsi?: number;
}

type TestsByType = {
  sj: Test[];
  cmj: Test[];
  imtp: Test[];
  hop: Test[];
  ppu: Test[];
};

interface TestData {
  cmjData: { peakPower: number; jumpHeight: number };
  sjData: { peakPower: number; jumpHeight: number };
  imtpData: { peakVerticalForce: number };
  hopData: { rsi: number };
  bodyWeight: number;
  ppuData: { takeoffPeakForceN: number };
}

const TEST_TYPES = [
  { key: 'sj', label: 'SJ' },
  { key: 'cmj', label: 'CMJ' },
  { key: 'imtp', label: 'IMTP' },
  { key: 'hop', label: 'Hop' },
  { key: 'ppu', label: 'PPU' },
] as const;

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const ForceplatesOverview: React.FC = () => {
  /* --------------- route + auth --------------- */
  const { athleteId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* --------------- state ---------------------- */
  const [tests, setTests] = useState<TestsByType>({
    sj: [],
    cmj: [],
    imtp: [],
    hop: [],
    ppu: [],
  });
  const [testData, setTestData] = useState<TestData>({
    cmjData: { peakPower: 0, jumpHeight: 0 },
    sjData: { peakPower: 0, jumpHeight: 0 },
    imtpData: { peakVerticalForce: 0 },
    hopData: { rsi: 0 },
    bodyWeight: 0,
    ppuData: { takeoffPeakForceN: 0 },
  });
  const [selectedType, setSelectedType] = useState<
    'sj' | 'cmj' | 'imtp' | 'hop' | 'ppu'
  >('cmj');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --------------- fetch data ----------------- */
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/forceplates`);
        if (!res.ok) {
          setError('Error fetching force-plate data');
          return;
        }
        const json = await res.json();
        const data = json.tests;

        const parsed: TestsByType = {
          sj: data.sjTests ?? [],
          cmj: data.cmjTests ?? [],
          imtp: data.imtpTests ?? [],
          hop: data.hopTests ?? [],
          ppu: data.ppuTests ?? [],
        };

        // Sort each array newest → oldest
        Object.keys(parsed).forEach((k) => {
          parsed[k as keyof TestsByType].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

        setTests(parsed);
        setTestData({
          cmjData: data.cmjData,
          sjData: data.sjData,
          imtpData: data.imtpData,
          hopData: data.hopData,
          bodyWeight: Number(data.bodyWeight) || 0,
          ppuData: { takeoffPeakForceN: data.ppuData?.takeoffPeakForceN || 0 },
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) fetchTests();
  }, [athleteId]);

  /* --------------- render ---------------------- */
  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;

  // Radar chart data setup
  // These max values should be set to reasonable upper bounds for normalization
  const MAX_VALUES = {
    sjPeakPower: 7000, // W
    cmjPeakPower: 7000, // W
    imtpPeakVertForce: 5000, // N
    hopRSI: 4, // RSI
    bodyWeight: 250, // lbs
    ppuTakeoff: 1500, // N
  };

  // Comparison values from the table
  const comparison = {
    min90: {
      sjPeakPower: 4334.8,
      cmjPeakPower: 4099.9,
      bodyWeight: 162.3,
      imtpPeakVertForce: 2148.1,
      hopRSI: 1.7,
      ppuTakeoff: 934.7,
    },
    avg90: {
      sjPeakPower: 5715.3,
      cmjPeakPower: 5963.9,
      bodyWeight: 213.8,
      imtpPeakVertForce: 3526.6,
      hopRSI: 2.6,
      ppuTakeoff: 1334.7,
    },
    avg95: {
      sjPeakPower: 6259.3,
      cmjPeakPower: 6554.6,
      bodyWeight: 226.2,
      imtpPeakVertForce: 3645.2,
      hopRSI: 2.7,
      ppuTakeoff: 1378.9,
    },
  };

  const radarData = {
    labels: [
      'SJ Peak Power (W)',
      'CMJ Peak Power (W)',
      'Body Weight (lbs)',
      'IMTP Peak Vert Force (N)',
      'Hop RSI',
      'Plyo Pushup Takeoff Force (N)',
    ],
    datasets: [
      {
        label: 'Athlete',
        data: [
          testData.sjData.peakPower / MAX_VALUES.sjPeakPower,
          testData.cmjData.peakPower / MAX_VALUES.cmjPeakPower,
          testData.bodyWeight / MAX_VALUES.bodyWeight,
          testData.imtpData.peakVerticalForce / MAX_VALUES.imtpPeakVertForce,
          testData.hopData.rsi / MAX_VALUES.hopRSI,
          testData.ppuData.takeoffPeakForceN / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(37, 99, 235, 1)',
      },
      {
        label: 'Min 90 MPH',
        data: [
          comparison.min90.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.min90.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.min90.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.min90.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.min90.hopRSI / MAX_VALUES.hopRSI,
          comparison.min90.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(55, 65, 81, 0.1)',
        borderColor: 'rgba(55, 65, 81, 0.7)',
        pointBackgroundColor: 'rgba(55, 65, 81, 1)',
        borderDash: [6, 6],
      },
      {
        label: 'Avg 90+ MPH',
        data: [
          comparison.avg90.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.avg90.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.avg90.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.avg90.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.avg90.hopRSI / MAX_VALUES.hopRSI,
          comparison.avg90.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: 'rgba(251, 191, 36, 1)',
        pointBackgroundColor: 'rgba(251, 191, 36, 1)',
      },
      {
        label: 'Avg 95+ MPH',
        data: [
          comparison.avg95.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.avg95.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.avg95.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.avg95.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.avg95.hopRSI / MAX_VALUES.hopRSI,
          comparison.avg95.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            // Show actual value instead of normalized
            const idx = context.dataIndex;
            switch (idx) {
              case 0:
                return `SJ Peak Power: ${testData.sjData.peakPower.toFixed(1)} W`;
              case 1:
                return `CMJ Peak Power: ${testData.cmjData.peakPower.toFixed(1)} W`;
              case 2:
                return `Body Weight: ${Number(testData.bodyWeight).toFixed(1)} lbs`;
              case 3:
                return `IMTP Peak Vert Force: ${testData.imtpData.peakVerticalForce.toFixed(1)} N`;
              case 4:
                return `Hop RSI: ${testData.hopData.rsi.toFixed(2)}`;
              case 5:
                return `Plyo Pushup Takeoff Force: ${testData.ppuData.takeoffPeakForceN.toFixed(1)} N`;
              default:
                return '';
            }
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2,
          callback: function(tickValue: string | number) {
            const val = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
            return `${(val * 100).toFixed(0)}%`;
          },
        },
        pointLabels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };

  // Table data setup
  const tableRows = [
    {
      label: 'SJ Peak Power (w)',
      min90: comparison.min90.sjPeakPower,
      avg90: comparison.avg90.sjPeakPower,
      avg95: comparison.avg95.sjPeakPower,
      athlete: testData.sjData.peakPower,
    },
    {
      label: 'CMJ Peak Power (w)',
      min90: comparison.min90.cmjPeakPower,
      avg90: comparison.avg90.cmjPeakPower,
      avg95: comparison.avg95.cmjPeakPower,
      athlete: testData.cmjData.peakPower,
    },
    {
      label: 'Body Weight (lbs)',
      min90: comparison.min90.bodyWeight,
      avg90: comparison.avg90.bodyWeight,
      avg95: comparison.avg95.bodyWeight,
      athlete: testData.bodyWeight,
    },
    {
      label: 'Reactive Strength - RSI',
      min90: comparison.min90.hopRSI,
      avg90: comparison.avg90.hopRSI,
      avg95: comparison.avg95.hopRSI,
      athlete: testData.hopData.rsi,
    },
    {
      label: 'Plyo Pushup - Peak Takeoff Force (n)',
      min90: comparison.min90.ppuTakeoff,
      avg90: comparison.avg90.ppuTakeoff,
      avg95: comparison.avg95.ppuTakeoff,
      athlete: testData.ppuData.takeoffPeakForceN,
    },
    {
      label: 'IMTP - Net Peak Vertical Force (n)',
      min90: comparison.min90.imtpPeakVertForce,
      avg90: comparison.avg90.imtpPeakVertForce,
      avg95: comparison.avg95.imtpPeakVertForce,
      athlete: testData.imtpData.peakVerticalForce,
    },
  ];

  function percentDiff(a: number, b: number) {
    if (!a) return 0;
    return ((b - a) / a) * 100;
  }

  function getDiffColor(val: number) {
    if (val >= 30) return 'bg-green-400/60';
    if (val >= 8) return 'bg-green-200';
    if (val >= 0) return 'bg-yellow-100';
    if (val >= -10) return 'bg-yellow-300';
    if (val >= -20) return 'bg-orange-300';
    return 'bg-red-400 text-white';
  }

  const renderTestData = () => {
    switch (selectedType) {
      case 'cmj':
        return (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.cmjData.peakPower.toFixed(1)} 
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.cmjData.jumpHeight.toFixed(1)} cm
              </p>
            </div>
          </div>
        );
      case 'sj':
        return (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.sjData.peakPower.toFixed(1)} W
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.sjData.jumpHeight.toFixed(1)} cm
              </p>
            </div>
          </div>
        );
      case 'imtp':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">Peak Vertical Force</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.imtpData.peakVerticalForce.toFixed(1)} N
            </p>
          </div>
        );
      case 'hop':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">RSI</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.hopData.rsi.toFixed(2)}
            </p>
          </div>
        );
      case 'ppu':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">Peak Takeoff Force</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.ppuData.takeoffPeakForceN.toFixed(1)} N
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ---------- sidebars ---------- */}
      {/* mobile */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      {/* desktop */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>

      {/* ---------- main content ---------- */}
      <div className="flex-1 p-6 bg-gray-100 overflow-x-hidden flex-col">
        {/* sticky navbar (mirrors BlastMotionStats) */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Profile
          </button>
          {['Assessments', 'Pitching', 'Hitting', 'Goals'].map((s) => (
            <button
              key={s}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${s.toLowerCase()}`)
              }
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
        </nav>

        {/* page title + type toggles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-700 mb-4">
            Force-Plates Overview
          </h1>

          {/* Radar Chart */}
          <div className="mb-8 w-full max-w-3xl mx-auto aspect-[4/3] min-h-[300px] flex items-center justify-center">
            <Radar data={radarData} options={radarOptions} />
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border text-xs md:text-sm rounded-lg overflow-hidden shadow">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-2 py-2 border">Metric</th>
                  <th className="px-2 py-2 border">Min 90 MPH</th>
                  <th className="px-2 py-2 border">Avg 90+ MPH</th>
                  <th className="px-2 py-2 border">Avg 95+ MPH</th>
                  <th className="px-2 py-2 border">Athlete Data</th>
                  <th className="px-2 py-2 border">% Diff Min90</th>
                  <th className="px-2 py-2 border">% Diff 90+</th>
                  <th className="px-2 py-2 border">% Diff 95+</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {tableRows.map((row) => {
                  const diffMin90 = percentDiff(row.min90, row.athlete);
                  const diff90 = percentDiff(row.avg90, row.athlete);
                  const diff95 = percentDiff(row.avg95, row.athlete);
                  return (
                    <tr key={row.label} className="text-center">
                      <td className="border px-2 py-1 font-medium text-left">{row.label}</td>
                      <td className="border px-2 py-1">{row.min90?.toFixed(1)}</td>
                      <td className="border px-2 py-1">{row.avg90?.toFixed(1)}</td>
                      <td className="border px-2 py-1">{row.avg95?.toFixed(1)}</td>
                      <td className="border px-2 py-1 font-bold">{row.athlete?.toFixed(1)}</td>
                      <td className={`border px-2 py-1 font-semibold ${getDiffColor(diffMin90)}`}>{diffMin90.toFixed(1)}%</td>
                      <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff90)}`}>{diff90.toFixed(1)}%</td>
                      <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff95)}`}>{diff95.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* toggle buttons */}
          <div className="flex flex-wrap gap-3">
            {TEST_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  selectedType === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* tests list for selected type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => router.push(`/athlete/${athleteId}/forceplates/${selectedType}`)}
            className="inline-flex items-center mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-lg font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition cursor-pointer shadow-sm"
            type="button"
          >
            {TEST_TYPES.find((t) => t.key === selectedType)?.label} Tests
            <span className="ml-2 text-blue-400">→</span>
          </button>

          {/* Display test data */}
          {renderTestData()}

          {tests[selectedType].length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tests[selectedType].map((test) => (
                <li key={test.id} className="py-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/athlete/${athleteId}/forceplates/${selectedType}/${test.id}`
                      )
                    }
                    className="w-full text-left text-gray-800 hover:underline"
                  >
                    {new Date(test.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tests recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForceplatesOverview;
