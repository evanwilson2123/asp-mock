'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';

const AssesmentView: React.FC = () => {
  const params = useParams();
  const athleteId = params.athleteId as string;
  const assessmentId = params.assessmentId as string;

  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId || !assessmentId) return;

    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/assesment/${athleteId}/${assessmentId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch assessment');
        }
        const data = await res.json();
        // We expect the API to return { assessment: ..., display: { athleteId, templateId, sections: [...] } }
        setAssessmentData(data.display);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [athleteId, assessmentId]);

  if (!athleteId || !assessmentId) {
    return <p className="p-4">Missing athlete or assessment ID in the URL.</p>;
  }

  if (loading) return <Loader />;

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
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Assessment Details
        </h1>
        {assessmentData &&
        assessmentData.sections &&
        assessmentData.sections.length > 0 ? (
          assessmentData.sections.map((section: any, index: number) => (
            <div key={index} className="mb-6 bg-white p-4 rounded shadow">
              <h2 className="text-black text-2xl font-bold mb-2">
                {section.title}
              </h2>
              {section.responses &&
              Object.keys(section.responses).length > 0 ? (
                // Each response here is assumed to have { fieldId, label, value, type }
                Object.entries(section.responses).map(
                  ([, response]: [string, any], idx: number) => (
                    <div key={idx} className="text-black mb-2">
                      <strong>{response.label}:</strong>{' '}
                      {response.value?.toString()}
                    </div>
                  )
                )
              ) : (
                <p className="text-gray-500">No responses in this section.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No sections available.</p>
        )}
        <Link href={`/athlete/${athleteId}/reports/assessments`}>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Back to Assessments
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AssesmentView;
