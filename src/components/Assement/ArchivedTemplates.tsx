'use client';
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ErrorMessage from '../ErrorMessage';
import Loader from '../Loader';
import Sidebar from '@/components/Dash/Sidebar';
import { FolderIcon } from '@heroicons/react/24/solid';

interface Template {
  _id: string;
  name: string;
  desc?: string;
}

const ArchivedTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const router = useRouter();

  // Unarchive handler function.
  const handleUnarchive = async (
    e: React.MouseEvent<HTMLButtonElement>,
    templateId: string
  ) => {
    e.stopPropagation(); // Prevents the click from triggering the card's onClick.
    console.log(`Unarchive template ${templateId}`);
    try {
      const res = await fetch(`/api/assesment/template/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // Optionally, include a body to indicate unarchive action if needed:
        // body: JSON.stringify({ action: 'unarchive' }),
      });
      if (res.ok) {
        // Remove the unarchived template from the list.
        setTemplates((prevTemplates) =>
          prevTemplates.filter((t) => t._id !== templateId)
        );
      } else {
        console.error('Error unarchiving template');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchArchivedTemplates = async () => {
      try {
        const res = await fetch('/api/assesment/template/archived');
        if (!res.ok) {
          setError('Error fetching archived templates');
          return;
        }
        const data = await res.json();
        // Assuming the API returns { templates: [...] }
        setTemplates(data.templates);
      } catch (error: any) {
        console.error(error);
        setError(error.error || 'Error fetching archived templates');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedTemplates();
  }, []);

  // Only allow ADMIN to view this page.
  if (role !== 'ADMIN') {
    return <div>You are not authorized to view this page.</div>;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage role={role as string} message={error} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        <Sidebar />
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 font-bold">
              Archived Templates
            </h1>
            <p className="text-gray-600">These templates have been archived.</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/assesment/create-template')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Create Template
            </button>
            <button
              onClick={() => router.push('/assesment/template')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              View Active Templates
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <div
                key={template._id}
                className="relative bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition"
                onClick={() =>
                  router.push(`/assesment/archived/${template._id}`)
                }
              >
                <button
                  onClick={(e) => handleUnarchive(e, template._id)}
                  className="absolute top-2 right-2 text-green-600 hover:text-green-800 transition"
                >
                  <FolderIcon className="h-6 w-6" />
                </button>
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
              <p className="text-gray-500">No archived templates available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedTemplates;
