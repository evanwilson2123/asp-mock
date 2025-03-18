'use client';
import { IAthleteTag } from '@/models/athleteTag';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import Loader from '../Loader';
import CoachSidebar from '../Dash/CoachSidebar';
import Sidebar from '../Dash/Sidebar';
import { useRouter } from 'next/navigation';

const ViewTags = () => {
  // Get the url params
  const { athleteId, tech } = useParams();
  // Set the state for the tags
  const [tags, setTags] = useState<IAthleteTag[]>([]);
  const [createTag, setCreateTag] = useState<boolean>(false);
  // Set loading and error state
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Get the role from the user
  const { user } = useUser();
  const role = user?.publicMetadata.role;
  // Mount the router
  const router = useRouter();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/${tech}`);
        const data = await res.json();
        if (!res.ok) {
          console.log(data.error);
          setErrorMessage(data.error);
          return;
        }
        console.log(data.tags);
        setTags(data.tags);
        return;
      } catch (error: any) {
        setErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [athleteId, tech]);

  // If error message exists render the error page
  if (errorMessage) {
    return <ErrorMessage role={role as string} message={errorMessage} />;
  }
  // If Loading, render the loader
  if (loading) {
    return <Loader />;
  }

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
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end"
          >
            Assesments
          </button>
          {['Pitching', 'Hitting', 'Goals'].map((tech) => (
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
          <h1 className="text-3xl text-gray-900 font-bold">
            {tech ? tech[0].toUpperCase() + tech.slice(1) + ' Tags' : 'Tags'}
          </h1>
          <button
            onClick={() => setCreateTag(!createTag)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {createTag ? 'Cancel' : 'Create new Tag'}
          </button>
        </div>
        <div>
          {tags.length > 0 ? (
            <span>Content here</span>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">
                No tags found. Create a new tag to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTags;
