'use client';
import React, { useEffect, useState } from 'react';
import { IAthleteTag } from '@/models/athleteTag';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

const ViewTag = () => {
  const [tag, setTag] = useState<IAthleteTag | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get URL parameters.
  const { tech, tagId } = useParams();
  // Get user data and role.
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchTag = async () => {
      try {
        const res = await fetch(`/api/tags/tag/${tagId}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error);
          return;
        }
        setTag(data.tag);
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTag();
  }, [tech, tagId]);

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (visible on medium and larger screens) */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">{tag?.name}</h1>
          {tag?.description && (
            <p className="text-gray-700 mb-4">
              <strong>Description: </strong>
              {tag.description}
            </p>
          )}
          <p className="text-gray-700 mb-4">
            <strong>Notes: </strong>
            {tag?.notes}
          </p>
          {tag?.links && tag.links.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                Links
              </h2>
              <ul className="list-disc list-inside">
                {tag.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTag;
