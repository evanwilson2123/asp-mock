'use client';

import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { upload } from '@vercel/blob/client';

interface IMedia {
  _id: string; // Unique identifier (from Mongoose subdocument _id)
  name: string;
  link: string;
  date: string; // ISO string or formatted date
}

const Media = () => {
  // State for media data (arrays of media objects)
  const [images, setImages] = useState<IMedia[]>([]);
  const [videos, setVideos] = useState<IMedia[]>([]);
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Upload form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<string>(''); // 'photo' or 'video'
  const [mediaName, setMediaName] = useState<string>(''); // Custom media name
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Get athleteId, router, and user role
  const { athleteId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Fetch media on mount
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/media`);
        if (!res.ok) {
          setError(
            res.status === 404
              ? 'Could not find data for this athlete'
              : res.status === 400
                ? 'Bad Request'
                : 'Internal Server Error'
          );
          return;
        }
        const data = await res.json();
        setVideos(data.videos || []);
        setImages(data.images || []);
      } catch (error: any) {
        console.error(error);
        setError('An error occurred while fetching media.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [athleteId]);

  // Handle the media upload
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedFile || !mediaType) {
      setError('Please select a file and a media type before uploading.');
      return;
    }
    setUploading(true);
    if (mediaType === 'photo') {
      // Use the existing strategy for photos (multipart upload)
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('mediaType', mediaType);
      formData.append('mediaName', mediaName);
      try {
        const res = await fetch(`/api/athlete/${athleteId}/media`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to upload media');
        } else {
          const data = await res.json();
          setImages((prev) => [...prev, data.media]);
          // Reset form state
          setSelectedFile(null);
          setMediaType('');
          setMediaName('');
          setShowUploadForm(false);
        }
      } catch (error: any) {
        console.error(error);
        setError('An error occurred while uploading media.');
      } finally {
        setUploading(false);
      }
    } else if (mediaType === 'video') {
      // Use client upload for videos.
      try {
        // Dynamically import the upload function from @vercel/blob/client

        // Upload directly from the browser.
        const blobResult = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          contentType: selectedFile.type,
          // The handleUploadUrl should point to your secure client upload route.
          handleUploadUrl: '/api/video/upload',
        });
        // Now send the video metadata to our POST endpoint in JSON.
        const payload = {
          media: blobResult.url,
          mediaType: 'video',
          mediaName: mediaName || selectedFile.name,
        };
        const res = await fetch(`/api/athlete/${athleteId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to upload video metadata');
        } else {
          const data = await res.json();
          setVideos((prev) => [...prev, data.media]);
          // Reset form state
          setSelectedFile(null);
          setMediaType('');
          setMediaName('');
          setShowUploadForm(false);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Video upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle deletion of media (unchanged)
  const handleDeleteMedia = async (
    _id: string,
    mediaCategory: 'photo' | 'video'
  ) => {
    try {
      const res = await fetch(
        `/api/athlete/${athleteId}/media?mediaId=${_id}&mediaType=${mediaCategory}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) {
        setError('Failed to delete media');
        return;
      }
      if (mediaCategory === 'photo') {
        setImages((prev) => prev.filter((item) => item._id !== _id));
      } else if (mediaCategory === 'video') {
        setVideos((prev) => prev.filter((item) => item._id !== _id));
      }
    } catch (error: any) {
      console.error(error);
      setError('An error occurred while deleting media.');
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for Mobile */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      {/* Sidebar for Desktop */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
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
        {/* Navigation Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Profile
          </button>
          <button
            key="assessments"
            onClick={() =>
              router.push(`/athlete/${athleteId}/reports/assessments`)
            }
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Assessments
          </button>
          {['Pitching', 'Hitting', 'Goals', 'Media'].map((page) => (
            <button
              key={page}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${page.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                page === 'Media' ? 'underline' : ''
              }`}
            >
              {page}
            </button>
          ))}
        </nav>

        {/* Media Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <h1 className="text-3xl text-gray-900 font-bold">Media</h1>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {showUploadForm ? 'Cancel' : 'Upload New Media'}
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Upload Media
            </h2>
            <form onSubmit={handleUploadMedia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Media Name
                </label>
                <input
                  type="text"
                  value={mediaName}
                  onChange={(e) => setMediaName(e.target.value)}
                  placeholder="Enter a custom name for your media"
                  className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Media Type
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Media Type --</option>
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        )}

        {/* Display Media */}
        <div className="grid grid-cols-1 gap-6">
          {/* Images Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl text-gray-900 font-bold mb-4">Images</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <img
                      src={img.link}
                      alt={img.name}
                      className="w-full h-auto rounded"
                    />
                    <p className="mt-2 text-sm text-gray-700">{img.name}</p>
                    <button
                      onClick={() => handleDeleteMedia(img._id, 'photo')}
                      className="mt-1 text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images found.</p>
            )}
          </div>

          {/* Videos Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl text-gray-900 font-bold mb-4">Videos</h2>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((vid, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <video controls className="w-full rounded">
                      <source src={vid.link} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <p className="mt-2 text-sm text-gray-700">{vid.name}</p>
                    <button
                      onClick={() => handleDeleteMedia(vid._id, 'video')}
                      className="mt-1 text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No videos found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Media;
