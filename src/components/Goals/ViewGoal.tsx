'use client';
import { useParams } from 'next/navigation';
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

// Register Chart.js components and the annotation plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin // Add this line to register the plugin
);

interface GoalEntry {
  value: number;
  date: Date;
}

const ViewGoal = () => {
  const { athleteId, goalId } = useParams();

  // Handle state for error and loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Manage the state for the goal
  const [goal, setGoal] = useState<IGoal | null>(null);
  // Manage state for the goal entries graph
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);

  // Get user and role
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
        // Ensure dates are Date objects
        const entries = data.goalEntries.map((entry: GoalEntry) => ({
          ...entry,
          date: new Date(entry.date), // Convert to Date object if it's a string
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Goal Progress Over Time',
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line' as const,
            yMin: goal?.goalValue, // Y-axis value for the line (goalValue)
            yMax: goal?.goalValue, // Same as yMin for a horizontal line
            borderColor: 'rgba(0, 128, 0, 1)', // Green line
            borderWidth: 2,
            label: {
              display: true,
              // content: `Goal Value: ${goal?.goalValue}`, // Label text
              position: 'end' as const, // Position the label at the end of the line
              backgroundColor: 'rgba(0, 128, 0, 0.8)',
              color: 'white',
              font: {
                size: 12,
              },
            },
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: goal?.metricToTrack,
        },
        beginAtZero: true,
      },
    },
  };

  // Handle loading state
  if (isLoading) return <Loader />;
  // Handle the error state
  if (error) return <ErrorMessage role={role as string} message={error} />;
  if (!goal) return <div>No goal found.</div>;

  return (
    <div className="container mx-auto p-4">
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

      {/* Add the line chart */}
      {goalEntries.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">
            Goal Progress Chart
          </h2>
          <div className="bg-white shadow-md rounded p-4">
            <div className="w-full h-64 sm:h-80 md:h-96">
              {' '}
              {/* Responsive height */}
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-gray-700">No goal entries to display.</div>
      )}
    </div>
  );
};

export default ViewGoal;
