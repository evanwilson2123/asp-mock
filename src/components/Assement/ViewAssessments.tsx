'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import { useUser } from '@clerk/nextjs';

// Define the Assessment interface
export interface Assessment {
  _id: string;
  templateId: string;
  title: string; // A title or name for the assessment
  createdAt?: string;
}

const ViewAssessments: React.FC = () => {
  const params = useParams();
  //   const router = useRouter();
  const athleteId = params.athleteId as string;

  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const router = useRouter();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!athleteId) return;

    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Adjust the endpoint as needed.
        const res = await fetch(`/api/assesment/${athleteId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch assessments');
        }

        const data = await res.json();
        // Assume data looks like { assessments: [...] }
        setAssessments(data.assessments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [athleteId]);

  if (!athleteId) {
    return <p className="p-4">No athleteId in the URL.</p>;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage role={role as string} message={error} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Profile
          </button>
          <button
            key="assessments"
            onClick={() =>
              router.push(`/athlete/${athleteId}/reports/assessments`)
            }
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end underline"
          >
            Assesments
          </button>
          {['Pitching', 'Hitting', 'Goals'].map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition`}
            >
              {tech}
            </button>
          ))}
        </nav>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments</h1>
          <p className="text-gray-600">Review your past assessments below.</p>
        </div>

        {/* List of Assessments */}
        <div className="grid grid-cols-1 gap-6">
          {assessments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">No assessments found.</p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <Link
                key={assessment._id}
                href={`/athlete/${athleteId}/reports/assessments/${assessment._id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-700">
                    {assessment.title
                      ? assessment.title
                      : `Assessment ${assessment._id}`}
                  </h2>
                  {assessment.createdAt && (
                    <span className="text-sm text-gray-500">
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  Template ID: {assessment.templateId}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAssessments;
