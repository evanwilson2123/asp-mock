'use client';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import AthleteSidebar from '../Dash/AthleteSidebar';

// Import Chart.js components and types
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const techOptions = [
  {
    tech: 'Blast Motion',
    metrics: [
      'Plane Score',
      'Connection Score',
      'Rotation Score',
      'Bat Speed',
      'Rotational Acceleration',
      'On Plane Efficiency',
      'Attack Angle',
      'Early Connection',
      'Connection At Impact',
      'Vertical Bat Angle',
      'Power',
      'Time To Contact',
      'Peak Hand Speed',
    ],
  },
  {
    tech: 'Hittrax',
    metrics: ['Exit Velocity', 'Launch Angle', 'Distance'],
  },
  {
    tech: 'Trackman',
    metrics: [
      'Pitch Release Speed',
      'Spin Efficiency',
      'Induced Vertical Break',
      'Horizontal Break',
      'Spin Rate',
    ],
  },
  {
    tech: 'Intended Zone',
    metrics: ['Distance'],
  },
];

// Mapping from display metric to database column names
const metricMapping: Record<string, Record<string, string>> = {
  'Blast Motion': {
    'Plane Score': 'planeScore',
    'Connection Score': 'connectionScore',
    'Rotation Score': 'rotationScore',
    'Bat Speed': 'batSpeed',
    'Rotational Acceleration': 'rotationalAcceleration',
    'On Plane Efficiency': 'onPlaneEfficiency',
    'Attack Angle': 'attackAngle',
    'Early Connection': 'earlyConnection',
    'Connection At Impact': 'connectionAtImpact',
    'Vertical Bat Angle': 'verticalBatAngle',
    Power: 'power',
    'Time To Contact': 'timeToContact',
    'Peak Hand Speed': 'peakHandSpeed',
  },
  Hittrax: {
    'Exit Velocity': 'velo',
    'Launch Angle': 'LA',
    Distance: 'dist',
  },
  Trackman: {
    'Pitch Release Speed': 'pitchReleaseSpeed',
    'Spin Efficiency': 'spinEfficiency',
    'Induced Vertical Break': 'inducedVerticalBreak',
    'Horizontal Break': 'horizontalBreak',
    'Spin Rate': 'spinRate',
  },
  'Intended Zone': {
    Distance: 'distanceIn',
  },
};

// Mapping from display tech names to their database values
const techMapping: Record<string, string> = {
  'Blast Motion': 'blastMotion',
  Hittrax: 'hitTrax',
  Trackman: 'trackman',
  'Intended Zone': 'intended',
};

const AthleteComparisons = () => {
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // Fetched data is expected to be an object with metric1 and metric2 arrays
  const [lineData, setLineData] = useState<any>(null);

  // For Metric 1 selection
  const [tech1, setTech1] = useState<string>('');
  const [selectedMetric1, setSelectedMetric1] = useState<string>('');

  // For Metric 2 selection
  const [tech2, setTech2] = useState<string>('');
  const [selectedMetric2, setSelectedMetric2] = useState<string>('');

  // Date range state
  const [dateFilterMode, setDateFilterMode] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch line data from the API endpoint
  const handleFetchLineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Map display metrics to the database values.
      const dbMetric1 =
        tech1 && selectedMetric1 ? metricMapping[tech1][selectedMetric1] : '';
      const dbMetric2 =
        tech2 && selectedMetric2 ? metricMapping[tech2][selectedMetric2] : '';

      // Map the tech selections to their corresponding database values.
      const dbTech1 = tech1 ? techMapping[tech1] : '';
      const dbTech2 = tech2 ? techMapping[tech2] : '';

      // Construct the endpoint with query parameters.
      let endpoint = `/api/athlete/${athleteId}/comparison?metric1=${encodeURIComponent(
        dbMetric1
      )}&metric2=${encodeURIComponent(dbMetric2)}&tech1=${encodeURIComponent(
        dbTech1
      )}&tech2=${encodeURIComponent(dbTech2)}`;

      // Append date range parameters based on user selection.
      if (dateFilterMode === 'custom') {
        endpoint += `&startDate=${encodeURIComponent(
          startDate
        )}&endDate=${encodeURIComponent(endDate)}`;
      } else {
        endpoint += `&dateRange=all`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch line data.');
      }
      const data = await response.json();
      setLineData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare Chart.js data.
  // If no data is available, we return an empty datasets array so chartData is never undefined.
  const chartData: ChartData<'line', { x: string; y: number }[]> = lineData
    ? {
        datasets: [
          {
            label: `${tech1} ${selectedMetric1}`,
            data: lineData.metric1, // Expected to be in format: [{ x: ISO string, y: number }, ...]
            borderColor: 'blue',
            backgroundColor: 'blue',
            fill: false,
          },
          {
            label: `${tech2} ${selectedMetric2}`,
            data: lineData.metric2,
            borderColor: 'red',
            backgroundColor: 'red',
            fill: false,
          },
        ],
      }
    : { datasets: [] };

  // Define Chart.js options with proper type.
  const options: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Metric Value',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Athlete Comparison',
      },
    },
  };

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

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Athlete Comparison Widget
        </h1>

        {/* Comparison Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Metric 1 Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-700">
                Metric 1
              </h2>
              <div>
                <label
                  htmlFor="tech1"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Tech
                </label>
                <select
                  id="tech1"
                  value={tech1}
                  onChange={(e) => {
                    setTech1(e.target.value);
                    setSelectedMetric1(''); // Reset metric when tech changes
                  }}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- Select Tech --</option>
                  {techOptions.map((option) => (
                    <option key={option.tech} value={option.tech}>
                      {option.tech}
                    </option>
                  ))}
                </select>
              </div>
              {tech1 && (
                <div className="mt-4">
                  <label
                    htmlFor="metric1"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Metric
                  </label>
                  <select
                    id="metric1"
                    value={selectedMetric1}
                    onChange={(e) => setSelectedMetric1(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">-- Select Metric --</option>
                    {techOptions
                      .find((option) => option.tech === tech1)
                      ?.metrics.map((metric) => (
                        <option key={metric} value={metric}>
                          {metric}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Metric 2 Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-700">
                Metric 2
              </h2>
              <div>
                <label
                  htmlFor="tech2"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Tech
                </label>
                <select
                  id="tech2"
                  value={tech2}
                  onChange={(e) => {
                    setTech2(e.target.value);
                    setSelectedMetric2('');
                  }}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- Select Tech --</option>
                  {techOptions.map((option) => (
                    <option key={option.tech} value={option.tech}>
                      {option.tech}
                    </option>
                  ))}
                </select>
              </div>
              {tech2 && (
                <div className="mt-4">
                  <label
                    htmlFor="metric2"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Metric
                  </label>
                  <select
                    id="metric2"
                    value={selectedMetric2}
                    onChange={(e) => setSelectedMetric2(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">-- Select Metric --</option>
                    {techOptions
                      .find((option) => option.tech === tech2)
                      ?.metrics.map((metric) => (
                        <option key={metric} value={metric}>
                          {metric}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All</option>
              <option value="custom">Custom</option>
            </select>
            {dateFilterMode === 'custom' && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleFetchLineData}
              disabled={
                loading ||
                !tech1 ||
                !selectedMetric1 ||
                !tech2 ||
                !selectedMetric2 ||
                (dateFilterMode === 'custom' && (!startDate || !endDate))
              }
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              {loading ? 'Loading...' : 'Fetch Line Data'}
            </button>
          </div>
        </div>

        {/* Display Error */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span>{error}</span>
          </div>
        )}

        {/* Display Raw Data and Line Chart */}
        {lineData && (
          <div>
            {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Raw Data (JSON)
              </h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-gray-800">
                {JSON.stringify(lineData, null, 2)}
              </pre>
            </div> */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Line Chart
              </h2>
              <Line data={chartData} options={options} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteComparisons;
