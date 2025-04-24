'use client';

import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

const UpdateMetrics = () => {
  // handle weight and height statistics
  const [currentBodyWeight, setCurrentBodyWeight] = useState<number | null>(
    null
  );
  const [currentHeight, setCurrentHeight] = useState<string | null>(null);
  // handle error and loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // get role and athleteId
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const { athleteId } = useParams();

  useEffect(() => {
    const fetchCurrentBW = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/bw`);
        if (!res.ok) {
          setError('Error fetching athlete bodyweight stats');
          return;
        }
        const data = await res.json();
        setCurrentBodyWeight(data.bw);
        setCurrentHeight(data.height);
        console.log(JSON.stringify(data));
      } catch (error: any) {
        console.log(error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentBW();
  }, [athleteId]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;
  return (
    <div>
      <h1>BODY WEIGHT / HEIGHT TRACKING</h1>
      <p>
        {currentBodyWeight} {currentHeight}
      </p>
    </div>
  );
};

export default UpdateMetrics;
