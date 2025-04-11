'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import { IGoal } from './Goals';
import { Line } from 'react-chartjs-2';
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
import annotationPlugin from 'chartjs-plugin-annotation'; // Import the annotation plugin
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import AthleteSidebar from '../Dash/AthleteSidebar';

// Register Chart.js components and the annotation plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin // Register the annotation plugin
);

interface GoalEntry {
  value: number;
  date: Date;
}

const ViewGoal = () => {
  const { athleteId, goalId } = useParams();
  const router = useRouter();

  // State for error and loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the goal object
  const [goal, setGoal] = useState<IGoal | null>(null);
  // State for the goal entries (chart data)
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);

  // Get the current user and role
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/goals/${goalId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        console.log(data.goal);
        setGoal(data.goal[0]);
        // Convert entry dates to Date objects if needed
        const entries = data.goalEntries.map((entry: GoalEntry) => ({
          ...entry,
          date: new Date(entry.date),
        }));
        setGoalEntries(entries);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [athleteId, goalId]);

  // Prepare data for the chart
  const chartData = {
    labels: goalEntries.map((entry) => {
      const date = new Date(entry.date);
      return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Goal Progress',
        data: goalEntries.map((entry) => entry.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  // Chart configuration options, including the annotation for the goal line
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Goal Progress Over Time',
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line' as const,
            yMin: goal?.goalValue, // Horizontal line at the goal value
            yMax: goal?.goalValue,
            borderColor: 'rgba(0, 128, 0, 1)', // Green line
            borderWidth: 2,
            label: {
              display: true,
              position: 'end' as const,
              backgroundColor: 'rgba(0, 128, 0, 0.8)',
              color: 'white',
              font: { size: 12 },
            },
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date' },
      },
      y: {
        title: { display: true, text: goal?.metricToTrack },
        beginAtZero: true,
      },
    },
  };

  // Render loader or error message when necessary
  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;
  if (!goal) return <div>No goal found.</div>;

  return (
    <div className="flex min-h-screen">
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      {/* Desktop Sidebar */}
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
          className="mb-4 bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition"
        >
          Back
        </button>
        <h1 className="text-4xl font-bold mb-4 text-gray-700">Goal Details</h1>
        <div className="bg-white shadow-md rounded p-4 text-gray-700">
          <p>
            <strong>Name:</strong> {goal.goalName}
          </p>
          <p>
            <strong>Technology:</strong> {goal.tech}
          </p>
          <p>
            <strong>Metric to Track:</strong> {goal.metricToTrack}
          </p>
          <p>
            <strong>Goal Value:</strong> {goal.goalValue}
          </p>
          <p>
            <strong>Current Value:</strong> {goal.currentValue}
          </p>
          <p>
            <strong>Average/Max Type:</strong> {goal.avgMax}
          </p>
          <p>
            <strong>Status:</strong> {goal.complete ? 'Complete' : 'Incomplete'}
          </p>
        </div>

        {/* Goal Progress Chart */}
        {goalEntries.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">
              Goal Progress Chart
            </h2>
            <div className="bg-white shadow-md rounded p-4">
              <div className="w-full h-64 sm:h-80 md:h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 text-gray-700">No goal entries to display.</div>
        )}
      </div>
    </div>
  );
};

export default ViewGoal;
