'use client';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import { IGoal } from './Goals';

const ViewGoal = () => {
  const { athleteId, goalId } = useParams();

  // handle state for error and loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // manage the state for the goal
  const [goal, setGoal] = useState<IGoal | null>(null);

  // get user and role
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
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [athleteId, goalId]);

  // handle loading state
  if (isLoading) return <Loader />;
  // handle the error state
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
    </div>
  );
};

export default ViewGoal;
