'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '@/components/Loader';
import ErrorMessage from '../ErrorMessage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  BarElement,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line, Scatter, PolarArea, Bar } from 'react-chartjs-2';
import AthleteSidebar from '../Dash/AthleteSidebar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  BarElement,
  annotationPlugin
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

interface EarlyConnectedPercents {
  earlyConnected: number;
  connectedAtImpact: number;
  connected: number;
}

const batSpeedThresholds = {
  "youth": 60,
  "high school": 67,
  "college": 75,
  "pro": 75,
}

/**
 * BlastMotionSessionDetails Component
 *
 * Displays detailed session stats along with interactive charts.
 */
const BlastMotionSessionDetails: React.FC = () => {
  const [swings, setSwings] = useState<BlastMotionSwing[]>([]);
  const [maxBatSpeed, setMaxBatSpeed] = useState<number>(0);
  const [maxHandSpeed, setMaxHandSpeed] = useState<number>(0);
  const [avgPlaneScore, setAvgPlaneScore] = useState<number>(0);
  const [avgConnectionScore, setAvgConnectionScore] = useState<number>(0);
  const [avgRotationScore, setAvgRotationScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const swingsPerPage = 10;

  const { sessionId } = useParams();
  const router = useRouter();
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
        setSwings(data.swings || []);
        setMaxBatSpeed(data.maxBatSpeed);
        setMaxHandSpeed(data.maxHandSpeed);
        setAvgPlaneScore(data.avgPlaneScore);
        setAvgConnectionScore(data.avgConnectionScore);
        setAvgRotationScore(data.avgRotationScore);
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

  // Line Chart Data for Attack Angle over swings
  const attackAngleData = swings.map((s) =>
    s.attackAngle !== null ? s.attackAngle : null
  );
  const attackAngleLabels = swings.map((_, i) => `Swing ${i + 1}`);

  const attackAngleLineChartData = {
    labels: attackAngleLabels,
    datasets: [
      {
        label: 'Attack Angle',
        data: attackAngleData,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.2,
        spanGaps: true,
      },
    ],
  };

  // Calculate percent of swings in the 0-15 attack angle box
  const swingsInBox = attackAngleData.filter(v => v !== null && v >= 0 && v <= 15).length;
  const percentInBox = swings.length > 0 ? (swingsInBox / swings.length) * 100 : 0;

  const attackAngleLineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      annotation: {
        annotations: {
          grayBox: {
            type: 'box' as const,
            yMin: 0,
            yMax: 15,
            backgroundColor: 'rgba(128,128,128,0.3)',
            borderWidth: 0,
          },
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'Attack Angle (°)' },
        min: Math.min(0, ...attackAngleData.filter(v => v !== null)),
        max: Math.max(20, ...attackAngleData.filter(v => v !== null)),
      },
      x: {
        title: { display: true, text: 'Swing Number' },
      },
    },
  };

  // First Scatter Chart: Early Connection vs Connection At Impact
  const scatterDataPoints = swings
    .filter(
      (swing) =>
        swing.earlyConnection !== null && swing.connectionAtImpact !== null
    )
    .map((swing) => ({
      x: swing.earlyConnection as number,
      y: swing.connectionAtImpact as number,
    }));

  const earlyConnectedPercents: EarlyConnectedPercents = (() => {
    if (scatterDataPoints.length === 0) return { earlyConnected: 0, connectedAtImpact: 0, connected: 0 };
    let earlyConnected = 0, connectedAtImpact = 0, connected = 0;
    scatterDataPoints.forEach((pt) => {
      if (pt.x <= 100 && pt.x >= 80 && pt.y <= 100 && pt.y >= 80) connected++;
      if (pt.x <= 100 && pt.x >= 80) earlyConnected++;
      if (pt.y <= 100 && pt.y >= 80) connectedAtImpact++;
    })
    return {
      earlyConnected: (earlyConnected / scatterDataPoints.length) * 100,
      connectedAtImpact: (connectedAtImpact / scatterDataPoints.length) * 100,
      connected: (connected / scatterDataPoints.length) * 100,
    }
  })();

  const regressionDataPoints = (() => {
    if (scatterDataPoints.length === 0) return [];
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = scatterDataPoints.length;
    scatterDataPoints.forEach((pt) => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    const xValues = scatterDataPoints.map((pt) => pt.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    return [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b },
    ];
  })();

  const scatterChartData = {
    datasets: [
      {
        label: 'Early Connection vs Connection At Impact',
        data: scatterDataPoints,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        showLine: false,
      },
      {
        type: 'line' as const,
        label: 'Regression Line',
        data: regressionDataPoints,
        borderColor: 'rgba(0, 0, 255, 0.8)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      } as any,
    ],
  };

  const scatterChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `Early: ${context.parsed.x}, Impact: ${context.parsed.y}`,
        },
      },
      annotation: {
        annotations: {
          // verticalLine: {
          //   type: 'line' as const,
          //   scaleID: 'x',
          //   value: 90,
          //   borderColor: 'rgba(0, 0, 0, 0.8)',
          //   borderWidth: 2,
          // },
          // horizontalLine: {
          //   type: 'line' as const,
          //   scaleID: 'y',
          //   value: 90,
          //   borderColor: 'rgba(0, 0, 0, 0.8)',
          //   borderWidth: 2,
          // },
          shadedBox1: {
            type: 'box' as const,
            xMin: 80,
            xMax: 100,
            yMin: 0,
            yMax: scatterDataPoints.reduce((max, pt) => Math.max(max, pt.y), 0) + 10,
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
          },
          shadedBox2: {
            type: 'box' as const,
            xMin: (scatterDataPoints.reduce((min, pt) => Math.min(min, pt.x), 100) - 10) >= 50 ? 50 : scatterDataPoints.reduce((min, pt) => Math.min(min, pt.x), 100) - 10,
            xMax: (scatterDataPoints.reduce((max, pt) => Math.max(max, pt.x), 0) + 10) <= 150 ? 150 : scatterDataPoints.reduce((max, pt) => Math.max(max, pt.x), 0) + 10,
            yMin: 80,
            yMax: 100,
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
          }
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Early Connection' } },
      y: { title: { display: true, text: 'Connection At Impact' } },
    },
  };

  // Second Scatter Chart: Attack Angle vs On-Plane Efficiency
  const scatterDataPoints2 = swings
    .filter(
      (swing) => swing.attackAngle !== null && swing.onPlaneEfficiency !== null
    )
    .map((swing) => ({
      x: swing.attackAngle as number,
      y: swing.onPlaneEfficiency as number,
    }));

  const regressionDataPoints2 = (() => {
    if (scatterDataPoints2.length === 0) return [];
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = scatterDataPoints2.length;
    scatterDataPoints2.forEach((pt) => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    const xValues = scatterDataPoints2.map((pt) => pt.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    return [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b },
    ];
  })();

  const scatterChartData2 = {
    datasets: [
      {
        label: 'Attack Angle vs On-Plane Efficiency',
        data: scatterDataPoints2,
        backgroundColor: 'rgba(75, 0, 130, 0.8)',
        showLine: false,
      },
      {
        type: 'line' as const,
        label: 'Regression Line',
        data: regressionDataPoints2,
        borderColor: 'rgba(0, 0, 0, 0.8)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      } as any,
    ],
  };

  // Compute percentage of swings falling within the box [x:5-15, y:75-85]
  const inBoxCount = scatterDataPoints2.filter(
    (pt) => pt.x >= 5 && pt.x <= 15 && pt.y >= 75 && pt.y <= 85
  ).length;
  const percentageInBox =
    scatterDataPoints2.length > 0
      ? (inBoxCount / scatterDataPoints2.length) * 100
      : 0;

  const scatterChartOptions2 = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `Attack: ${context.parsed.x}, Efficiency: ${context.parsed.y}`,
        },
      },
      annotation: {
        annotations: {
          shadedBox: {
            type: 'box' as const,
            xMin: 5,
            xMax: 15,
            yMin: 75,
            yMax: 85,
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
            borderColor: 'rgba(128, 128, 128, 1)',
            borderWidth: 1,
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Attack Angle' } },
      y: { title: { display: true, text: 'On-Plane Efficiency' } },
    },
  };

  // Polar Area Chart Data for Average Scores
  const polarData = {
    labels: ['Plane Score', 'Connection Score', 'Rotation Score'],
    datasets: [
      {
        data: [avgPlaneScore, avgConnectionScore, avgRotationScore],
        backgroundColor: [
          'rgba(255, 99, 132, 0.85)',
          'rgba(54, 162, 235, 0.85)',
          'rgba(255, 206, 86, 0.85)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const polarOptions = {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 80,
        ticks: {
          beginAtZero: true,
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Average Scores (out of 80)' },
    },
  };

  // Calculate percentages for each threshold
  const youthThreshold = batSpeedThresholds.youth;
  const highSchoolThreshold = batSpeedThresholds['high school'];
  const collegeProThreshold = batSpeedThresholds.college;

  const swingsAboveYouth = swings.filter(s => (s.batSpeed || 0) >= youthThreshold).length;
  const swingsAboveHighSchool = swings.filter(s => (s.batSpeed || 0) >= highSchoolThreshold).length;
  const swingsAboveCollegePro = swings.filter(s => (s.batSpeed || 0) >= collegeProThreshold).length;

  const percentAboveYouth = (swingsAboveYouth / swings.length) * 100;
  const percentAboveHighSchool = (swingsAboveHighSchool / swings.length) * 100;
  const percentAboveCollegePro = (swingsAboveCollegePro / swings.length) * 100;

  // Get the current play level
  const currentPlayLevel = swings[0]?.playLevel?.toLowerCase() || 'youth';

  // Chart data for bat speeds
  const batSpeedData = {
    labels: swings.map((_, i) => `Swing ${i + 1}`),
    datasets: [
      {
        label: 'Bat Speed (mph)',
        data: swings.map(s => s.batSpeed),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Pagination logic for swing details table
  const indexOfLastSwing = currentPage * swingsPerPage;
  const indexOfFirstSwing = indexOfLastSwing - swingsPerPage;
  const currentSwings = swings.slice(indexOfFirstSwing, indexOfLastSwing);
  const totalPages = Math.ceil(swings.length / swingsPerPage);

  const batSpeedOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          boxWidth: 20,
          padding: 20,
          color: 'rgba(0, 0, 0, 0.8)',
          font: {
            size: 12
          }
        }
      },
      annotation: {
        annotations: {
          youthThreshold: {
            type: 'line',
            yMin: batSpeedThresholds.youth,
            yMax: batSpeedThresholds.youth,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            label: {
              content: 'Youth (50 mph)',
              position: 'start',
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
              color: 'white',
              padding: 4
            }
          },
          highSchoolThreshold: {
            type: 'line',
            yMin: batSpeedThresholds['high school'],
            yMax: batSpeedThresholds['high school'],
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            label: {
              content: 'High School (65 mph)',
              position: 'start',
              backgroundColor: 'rgba(75, 192, 192, 0.8)',
              color: 'white',
              padding: 4
            }
          },
          collegeProThreshold: {
            type: 'line',
            yMin: batSpeedThresholds.college,
            yMax: batSpeedThresholds.college,
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            label: {
              content: 'College/Pro (75 mph)',
              position: 'start',
              backgroundColor: 'rgba(153, 102, 255, 0.8)',
              color: 'white',
              padding: 4
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Bat Speed (mph)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        max: Math.max(...batSpeedData.datasets[0].data as number[], batSpeedThresholds.college) + 5
      },
      x: {
        title: {
          display: true,
          text: 'Swing Number',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  } as const;

  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
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
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Session Details for {swings[0].sessionName}
        </h1>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-8">
          <div className="bg-white p-4 md:p-6 rounded shadow w-full md:w-1/2 border-2 border-gray-300">
            <h2 className="text-base md:text-lg font-bold text-gray-600 justify-center flex">
              Max Bat Speed
            </h2>
            <div className="mt-2 md:mt-4 text-2xl md:text-4xl font-semibold text-blue-900 justify-center flex">
              {maxBatSpeed.toFixed(1)} mph
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded shadow w-full md:w-1/2 border-2 border-gray-300">
            <h2 className="text-base md:text-lg font-bold text-gray-600 justify-center flex">
              Max Hand Speed
            </h2>
            <div className="mt-2 md:mt-4 text-2xl md:text-4xl font-semibold text-blue-900 justify-center flex">
              {maxHandSpeed.toFixed(1)} mph
            </div>
          </div>
        </div>
        {/* Line Chart for Attack Angle Over Swings */}
        <div className="bg-white p-2 md:p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-4">
            Attack Angle Over Swings
          </h2>
          <div className="mb-2 text-gray-700 text-xs md:text-sm font-medium text-center">
            {percentInBox.toFixed(1)}% of swings had an attack angle between 0° and 15°.
          </div>
          <div className="w-full max-w-3xl mx-auto h-[400px]">
            <Line data={attackAngleLineChartData} options={{...attackAngleLineChartOptions, maintainAspectRatio: false}} />
          </div>
        </div>
        {/* First Scatter Chart: Early Connection vs Connection At Impact */}
        <div className="bg-white p-2 md:p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-4">
            Early Connection vs Connection At Impact
          </h2>
          <p className=" flex flex-col mb-4 text-xs md:text-sm text-gray-700 justify-center items-center">
            * {earlyConnectedPercents.earlyConnected.toFixed(1)}% of swings were early connected. <br />
            * {earlyConnectedPercents.connectedAtImpact.toFixed(1)}% of swings were connected at impact. <br />
            * {earlyConnectedPercents.connected.toFixed(1)}% of swings were connected.
          </p>
          {scatterDataPoints.length > 0 ? (
            <div className="w-full max-w-3xl mx-auto h-[400px]">
              <Scatter data={scatterChartData} options={{...scatterChartOptions, maintainAspectRatio: false}} />
            </div>
          ) : (
            <p className="text-gray-500">
              Not enough data to display scatter plot.
            </p>
          )}
        </div>
        {/* Second Scatter Chart: Attack Angle vs On-Plane Efficiency */}
        <div className="bg-white p-2 md:p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-4">
            Attack Angle vs On-Plane Efficiency
          </h2>
          <p className="mb-4 text-xs md:text-sm text-gray-700">
            {percentageInBox.toFixed(1)}% of swings fall within the box (Attack
            Angle: 5-15, Efficiency: 75-85)
          </p>
          {scatterDataPoints2.length > 0 ? (
            <div className="w-full max-w-3xl mx-auto h-[400px]">
              <Scatter data={scatterChartData2} options={{...scatterChartOptions2, maintainAspectRatio: false}} />
            </div>
          ) : (
            <p className="text-gray-500">
              Not enough data to display scatter plot.
            </p>
          )}
        </div>
        {/* Polar Area Chart for Average Scores */}
        <div className="bg-white p-2 md:p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-4">
            Average Scores
          </h2>
          <div className="w-full max-w-2xl mx-auto h-[400px]">
            <PolarArea data={polarData} options={{...polarOptions, maintainAspectRatio: false}} />
          </div>
        </div>
        {/* Bat Speed Bar Chart */}
        <div className="bg-white p-2 md:p-6 rounded shadow mb-8 border-2 border-gray-300">
          <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-2 md:mb-4">
            Fast Swing Rate
          </h2>
          <div className="mb-2 text-gray-700 text-xs md:text-sm font-medium text-center space-y-1">
            <div className={currentPlayLevel === 'youth' ? 'font-bold' : ''}>
              {percentAboveYouth.toFixed(1)}% of swings ({swingsAboveYouth} of {swings.length}) meet or exceed Youth threshold (50 mph)
            </div>
            <div className={currentPlayLevel === 'high school' ? 'font-bold' : ''}>
              {percentAboveHighSchool.toFixed(1)}% of swings ({swingsAboveHighSchool} of {swings.length}) meet or exceed High School threshold (65 mph)
            </div>
            <div className={(currentPlayLevel === 'college' || currentPlayLevel === 'pro') ? 'font-bold' : ''}>
              {percentAboveCollegePro.toFixed(1)}% of swings ({swingsAboveCollegePro} of {swings.length}) meet or exceed College/Pro threshold (75 mph)
            </div>
          </div>
          <div className="w-full max-w-3xl mx-auto h-[400px]">
            <Bar data={batSpeedData} options={batSpeedOptions} />
          </div>
        </div>
        {/* Paginated Table for Swing Details */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto border-2 border-gray-300">
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
