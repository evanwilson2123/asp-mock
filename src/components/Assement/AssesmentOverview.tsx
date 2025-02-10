'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
// Import your sidebar components and a Loader if you have one
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';

interface Assesment {
  id: string;
  blobUrl: string;
  createdAt: string;
  // ...other properties if needed
}

const AssesmentOverview = () => {
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const [assesments, setAssesments] = useState<Assesment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAssesments = async () => {
      try {
        const res = await fetch(`/api/assesment/${athleteId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch assessments');
        }
        const data = await res.json();
        setAssesments(data);
      } catch (err: any) {
        setError(
          err.message || 'An error occurred while fetching assessments.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchAssesments();
    }
  }, [athleteId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 flex min-h-screen items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for mobile and desktop */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Assessment Overview
        </h1>

        {assesments.length === 0 ? (
          <p className="text-lg text-blue-900 text-center mt-4">
            No assessments found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assesments.map((assesment) => (
              <div
                key={assesment.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="mb-2">
                  {/* Embed the PDF preview – adjust the height as needed */}
                  <embed
                    src={assesment.blobUrl}
                    type="application/pdf"
                    className="w-full h-64 rounded"
                  />
                </div>
                <div className="flex justify-between items-center">
                  {assesment.createdAt && (
                    <span className="text-gray-600 text-sm">
                      {new Date(assesment.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  <a
                    href={assesment.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssesmentOverview;
