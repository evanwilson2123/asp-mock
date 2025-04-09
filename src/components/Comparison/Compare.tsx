'use client';
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

// interface Data {
//   value: number;
//   date: Date;
// }

// interface LineData {
//   metric: string;
//   values: Data[];
// }

const Compare = () => {
  // get the user's info and loaded state
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  // handle the loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // manage the state for the line data
  // const [lineData, setLineData] = useState<LineData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/comparison');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
        }
        // setLineData(data.line);
      } catch (error: any) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  });

  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-3xl text-red-600">COMPARISON PAGE</h1>
    </div>
  );
};

export default Compare;
