'use client';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';

// TODO: Implement a page to view a single goal
const ViewGoal = () => {
  const { athleteId, goalId } = useParams();

  // handle state for error and loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (error: any) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [athleteId, goalId]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;

  return (
    <div className="flex justify-center items-center">
      <h1 className="text-red-600 text-4xl">VIEW GOAL</h1>
    </div>
  );
};

export default ViewGoal;
