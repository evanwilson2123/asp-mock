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

interface TagData {
  name: string;
  description?: string;
  notes: string;
  links?: string[];
}

const ViewTags = () => {
  // Get the URL params.
  const { athleteId, tech } = useParams();
  // Set the state for the tags.
  const [tags, setTags] = useState<IAthleteTag[]>([]);
  const [createTag, setCreateTag] = useState<boolean>(false);
  // New tag state variables.
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagDescription, setNewTagDescription] = useState<string>('');
  const [newTagNotes, setNewTagNotes] = useState<string>('');
  const [newTagLinks, setNewTagLinks] = useState<string>(''); // comma-separated links

  // Set loading and error state.
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Get the role from the user.
  const { user } = useUser();
  const role = user?.publicMetadata.role;
  // Mount the router.
  const router = useRouter();

  // Handle creating a new tag.
  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Create a TagData object based on form input.
    const tagData: TagData = {
      name: newTagName,
      description: newTagDescription ? newTagDescription : undefined,
      notes: newTagNotes,
      links: newTagLinks
        ? newTagLinks.split(',').map((link) => link.trim())
        : undefined,
    };

    // For now, we simply log the new tag data.
    // You can later post this to an API endpoint.
    console.log('New Tag Data:', tagData);
    const res = await fetch(`/api/tags/${athleteId}/blast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.error);
      return;
    }

    tags.push(data.tag);

    // Clear the form fields and close the form.
    setNewTagName('');
    setNewTagDescription('');
    setNewTagNotes('');
    setNewTagLinks('');
    setCreateTag(false);
  };

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

  if (errorMessage) {
    return <ErrorMessage role={role as string} message={errorMessage} />;
  }

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
            Assessments
          </button>
          {['Pitching', 'Hitting', 'Goals'].map((techOption) => (
            <button
              key={techOption}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${techOption.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                techOption === 'Goals' ? 'underline' : ''
              }`}
            >
              {techOption}
            </button>
          ))}
        </nav>
        {/* Tags Header */}
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
        {/* Tag Mapping */}
        <div className="grid grid-cols-1 gap-6">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <div
                key={tag._id.toString()}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  router.push(`/athlete/${athleteId}/tags/blast/${tag._id}`)
                }
              >
                <h2 className="text-xl font-bold text-gray-700">{tag.name}</h2>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">
                No tags found. Create a new tag to get started.
              </p>
            </div>
          )}
        </div>
        {createTag && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 mt-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Create New Tag
            </h2>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={newTagNotes}
                  onChange={(e) => setNewTagNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Links (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTagLinks}
                  onChange={(e) => setNewTagLinks(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Tag
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTags;
