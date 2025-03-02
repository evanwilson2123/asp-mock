'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

// Goal interface as defined in both the front-end and the Mongo model
export interface IGoal {
  _id: string;
  athlete?: string;
  goalName: string;
  metricToTrack: string;
  goalValue: number;
  currentValue: number;
}

/**
 * Goals Component
 *
 * This component allows athletes to track their progress by:
 * 1. Naming a goal.
 * 2. Choosing the metric to track.
 * 3. Using aggregate data (via currentValue) to update progress in real time.
 * 4. Showing the status of the goal (completed vs. in progress).
 */
const Goals = () => {
  // ===== State for managing goals and the create-goal form =====
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [createGoal, setCreateGoal] = useState<boolean>(false);
  // Form state for a new goal
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [newMetric, setNewMetric] = useState<string>('');
  const [newGoalValue, setNewGoalValue] = useState<number>(0);

  // ===== State for loading and error messages =====
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { athleteId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // ===== Fetch Goals =====
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch(`/api/athlete/${athleteId}/goals`);
        if (!response.ok) {
          const error =
            response.status === 400
              ? 'An unexpected issue occurred. Please try again.'
              : 'We encountered an issue on our end. Please try again.';
          setErrorMessage(error);
          return;
        }
        const data = await response.json();
        setGoals(data.goals || []);
        setErrorMessage(null);
      } catch (error: any) {
        setErrorMessage(error.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [athleteId]);

  // ===== Handle Creating a New Goal =====
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGoalData = {
        goalName: newGoalName,
        metricToTrack: newMetric,
        goalValue: newGoalValue,
        currentValue: 0, // initial progress is 0
      };
      const response = await fetch(`/api/athlete/${athleteId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoalData),
      });
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      // Assuming the API returns the created goal:
      const data = await response.json();
      setGoals([...goals, data.goal]);
      // Reset form state
      setNewGoalName('');
      setNewMetric('');
      setNewGoalValue(0);
      setCreateGoal(false);
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
    }
  };

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div>
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Navigation Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          {['Assessments', 'Pitching', 'Hitting', 'Goals'].map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                tech === 'Goals' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
        </nav>

        {/* Goals Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <h1 className="text-3xl text-gray-900 font-bold">Goals</h1>
          <button
            onClick={() => setCreateGoal(!createGoal)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {createGoal ? 'Cancel' : 'Create New Goal'}
          </button>
        </div>

        {/* Create New Goal Form */}
        {createGoal && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">New Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Metric to Track
                </label>
                <input
                  type="text"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  placeholder="e.g., Average Speed, Max Distance"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Value
                </label>
                <input
                  type="number"
                  value={newGoalValue}
                  onChange={(e) => setNewGoalValue(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Goal
              </button>
            </form>
          </div>
        )}

        {/* List of Goals */}
        <div className="grid grid-cols-1 gap-6">
          {goals.length > 0 ? (
            goals.map((goal) => {
              // Determine completion status based on current vs. target value
              const isCompleted = goal.currentValue >= goal.goalValue;
              return (
                <div
                  key={goal._id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">
                      {goal.goalName}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isCompleted
                          ? 'bg-green-200 text-green-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    <strong>Metric:</strong> {goal.metricToTrack}
                  </p>
                  <p className="text-gray-600">
                    <strong>Target:</strong> {goal.goalValue}
                  </p>
                  <p className="text-gray-600">
                    <strong>Current:</strong> {goal.currentValue}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">
                No goals found. Create a new goal to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
