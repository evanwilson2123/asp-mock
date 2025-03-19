'use client';
import React, { useEffect, useState } from 'react';
import { IAthleteTag } from '@/models/athleteTag';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { TrashIcon } from '@heroicons/react/24/solid';

interface TagData {
  name: string;
  tech: string;
  description?: string;
  notes: string;
  links?: string[];
}

interface DeletePopupState {
  show: boolean;
  tagId: string;
  confirmText: string;
}

const ManageTags = () => {
  const [tags, setTags] = useState<IAthleteTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createTag, setCreateTag] = useState<boolean>(false);

  // New tag form state
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagDescription, setNewTagDescription] = useState<string>('');
  const [newTagNotes, setNewTagNotes] = useState<string>('');
  const [newTagLinks, setNewTagLinks] = useState<string>(''); // comma-separated links

  // Use a single state to track the open tag's id (for expanding details)
  const [openTagId, setOpenTagId] = useState<string | null>(null);

  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState<DeletePopupState>({
    show: false,
    tagId: '',
    confirmText: '',
  });

  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Fetch tags once when the component mounts.
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (!res.ok) {
          setErrorMessage('Error fetching tags');
          return;
        }
        const data = await res.json();
        setTags(data.tags);
      } catch (error: any) {
        console.error(error);
        setErrorMessage('Internal Server Error');
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  // Toggle open state for a given tag.
  const toggleTagDetails = (tagId: string) => {
    setOpenTagId((prevId) => (prevId === tagId ? null : tagId));
  };

  // Show delete confirmation popup for a given tag.
  const showDeletePopup = (tagId: string) => {
    setDeletePopup({ show: true, tagId, confirmText: '' });
  };

  // Handle deletion of a tag after confirmation.
  const handleDeleteTag = async () => {
    try {
      const res = await fetch(`/api/tags/tag/${deletePopup.tagId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Error deleting tag');
        return;
      }
      setTags((prevTags) =>
        prevTags.filter((tag) => tag._id.toString() !== deletePopup.tagId)
      );
      // Clear openTagId if the deleted tag was open.
      if (openTagId === deletePopup.tagId) setOpenTagId(null);
      // Close the popup
      setDeletePopup({ show: false, tagId: '', confirmText: '' });
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  // Handle creation of a new tag.
  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tagData: TagData = {
      name: newTagName,
      tech: '', // Set tech appropriately if needed
      description: newTagDescription || undefined,
      notes: newTagNotes,
      links: newTagLinks
        ? newTagLinks.split(',').map((link) => link.trim())
        : undefined,
    };

    console.log('New Tag Data:', tagData);

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error creating tag');
        return;
      }
      // Append new tag to local state
      setTags((prev) => [...prev, data.tag]);
      // Clear form and hide it
      setNewTagName('');
      setNewTagDescription('');
      setNewTagNotes('');
      setNewTagLinks('');
      setCreateTag(false);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  return (
    <div className="flex min-h-screen">
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Manage Tags Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <h1 className="text-3xl text-gray-900 font-bold">Manage Tags</h1>
          <button
            onClick={() => setCreateTag(!createTag)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {createTag ? 'Cancel' : 'Create New Tag'}
          </button>
        </div>

        {/* Tag Listing - Stacked List */}
        <div className="space-y-6 mb-6">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <div
                key={tag._id.toString()}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-700">
                    {tag.name}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleTagDetails(tag._id.toString())}
                      className="text-gray-500 hover:text-gray-700 transition"
                    >
                      {openTagId === tag._id.toString() ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => showDeletePopup(tag._id.toString())}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {openTagId === tag._id.toString() && (
                  <div className="mt-4 text-gray-600">
                    {tag.description && (
                      <p>
                        <strong>Description:</strong> {tag.description}
                      </p>
                    )}
                    <p>
                      <strong>Notes:</strong> {tag.notes}
                    </p>
                    {tag.links && tag.links.length > 0 && (
                      <div className="mt-2">
                        <strong>Links:</strong>
                        <ul className="list-disc list-inside">
                          {tag.links.map((link, i) => (
                            <li key={i}>
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
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">
                No tags found. Create one to get started.
              </p>
            </div>
          )}
        </div>

        {/* New Tag Creation Form */}
        {createTag && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
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
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save Tag
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletePopup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4 text-black">
              Confirm Deletion
            </h3>
            <p className="mb-2 text-black">
              Type <strong>DELETE</strong> to confirm deletion.
            </p>
            <input
              type="text"
              placeholder="DELETE"
              value={deletePopup.confirmText}
              onChange={(e) =>
                setDeletePopup((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
              className="border p-2 mb-4 w-full text-black"
            />
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setDeletePopup({
                    show: false,
                    tagId: '',
                    confirmText: '',
                  })
                }
                className="mr-4 px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletePopup.confirmText !== 'DELETE') {
                    alert("Please type 'DELETE' to confirm deletion.");
                    return;
                  }
                  await handleDeleteTag();
                }}
                className="px-4 py-2 border rounded bg-red-500 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTags;
