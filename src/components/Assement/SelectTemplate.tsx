'use client';
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
// import SignInPrompt from '../SignInPrompt';
import ErrorMessage from '../ErrorMessage';
import Loader from '../Loader';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';

interface Template {
  _id: string;
  name: string;
  desc?: string;
}

const SelectTemplate = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const router = useRouter();
  const { athleteId } = useParams(); // Extract athleteId from URL parameters

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/assesment/template');
        if (!res.ok) {
          setError('Error fetching templates');
          return;
        }
        const data = await res.json();
        // Assuming API returns { templates: [...] }
        setTemplates(data.templates);
      } catch (error: any) {
        console.error(error);
        setError(error.error || 'Error fetching templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage role={role as string} message={error} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Navbar */}
        {/* <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Dashboard
          </button>
          <button className="text-gray-700 font-semibold hover:text-gray-900 transition underline">
            Templates
          </button>
        </nav> */}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 font-bold">
              Select a Template
            </h1>
            <p className="text-gray-600">
              Choose a template to fill out the assessment.
            </p>
          </div>
          <button
            onClick={() => router.push('/assesment/create-template')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Create Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <div
                key={template._id}
                onClick={() =>
                  router.push(`/assesment/${athleteId}/${template._id}`)
                }
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {template.name}
                </h2>
                {template.desc && (
                  <p className="text-gray-600">{template.desc}</p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">No templates available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectTemplate;
