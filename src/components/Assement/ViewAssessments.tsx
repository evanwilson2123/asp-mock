'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import { useUser } from '@clerk/nextjs';
import { TrashIcon } from '@heroicons/react/24/solid';
import AthleteSidebar from '../Dash/AthleteSidebar';

// Define the Assessment interface
export interface Assessment {
  _id: string;
  templateId: string;
  title: string; // A title or name for the assessment
  createdAt?: string;
}

// --- New: Interface for Tag Management ---
interface BlastTag {
  _id: string;
  name: string;
  description: string;
}

// Add TagManager component
const TagManager: React.FC<{
  blastTags: BlastTag[];
  availableTags: BlastTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  athleteId: string;
}> = ({ blastTags, availableTags, onAddTag, onRemoveTag, athleteId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');

  const filteredAvailableTags = availableTags.filter(
    (tag) =>
      !blastTags.some((bt) => bt._id === tag._id) &&
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTag = () => {
    if (selectedTagId) {
      onAddTag(selectedTagId);
      setSelectedTagId('');
      setSearchTerm('');
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-3">
        {/* Active Tags */}
        <div className="flex flex-wrap gap-2">
          {blastTags.map((tag) => (
            <div
              key={tag._id}
              className="group relative bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center space-x-2"
            >
              <Link
                href={`/athlete/${athleteId}/tags/assessments/${tag._id}`}
                className="text-blue-700 hover:text-blue-800 font-medium text-sm"
              >
                {tag.name}
              </Link>
              <button
                onClick={() => onRemoveTag(tag._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-3.5 w-3.5 text-blue-500 hover:text-blue-700" />
              </button>
              {tag.description && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {tag.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Tag Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      {/* Add Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Tags</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSearchTerm('');
                    setSelectedTagId('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Tag List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredAvailableTags.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredAvailableTags.map((tag) => (
                        <button
                          key={tag._id}
                          onClick={() => setSelectedTagId(tag._id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedTagId === tag._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{tag.name}</div>
                              {tag.description && (
                                <div className="text-sm text-gray-500 mt-0.5">{tag.description}</div>
                              )}
                            </div>
                            {selectedTagId === tag._id && (
                              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {searchTerm ? 'No matching tags found' : 'Start typing to search tags'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSearchTerm('');
                      setSelectedTagId('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTag}
                    disabled={!selectedTagId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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

  // --- New: Tag Management States ---
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

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

  // --- New: Fetch athlete's Assessment Tags ---
  useEffect(() => {
    const fetchAssessmentTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/assessments`);
        if (res.ok) {
          const data = await res.json();
          setBlastTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching assessment tags:', err);
      }
    };
    if (athleteId) fetchAssessmentTags();
  }, [athleteId]);

  // --- New: Fetch available tags ---
  useEffect(() => {
    const fetchAvailableTags = async () => {
      try {
        const res = await fetch(`/api/tags`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching available tags:', err);
      }
    };
    fetchAvailableTags();
  }, []);

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

  // --- New: Handlers for Tag Management ---
  const handleAddBlastTag = async (tagId: string) => {
    if (!tagId) return;
    try {
      const res = await fetch(`/api/tags/${athleteId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) {
        const addedTag = availableTags.find((tag) => tag._id === tagId);
        if (addedTag) {
          setBlastTags((prev) => [...prev, addedTag]);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Error adding tag');
      }
    } catch (err: any) {
      console.error(err);
      setError('Internal Server Error');
    }
  };

  const handleRemoveBlastTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/tags/${athleteId}/assessments/${tagId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBlastTags((prev) => prev.filter((tag) => tag._id !== tagId));
      } else {
        const data = await res.json();
        setError(data.error || 'Error removing tag');
      }
    } catch (err: any) {
      console.error(err);
      setError('Internal Server Error');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
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
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              {tech}
            </button>
          ))}
          <button
            key="forceplates"
            onClick={() => router.push(`/athlete/${athleteId}/forceplates`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Forceplates
          </button>
          <button
            key="comparison"
            onClick={() => router.push(`/athlete/${athleteId}/comparison`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Comparison
          </button>
          <button
            key="media"
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
          <button
            key="dash-view"
            onClick={() => router.push(`/athlete/${athleteId}/dash-view`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Dash-View
          </button>
        </nav>

        {/* Update the tag management section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-700 mb-4 md:mb-0">
            Assessments
          </h1>
          <div className="w-full md:w-auto">
            <TagManager
              blastTags={blastTags}
              availableTags={availableTags}
              onAddTag={handleAddBlastTag}
              onRemoveTag={handleRemoveBlastTag}
              athleteId={athleteId}
            />
          </div>
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