'use client';
import React, { useEffect, useState } from 'react';
import { IAthleteTag } from '@/models/athleteTag';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import AthleteSidebar from '../Dash/AthleteSidebar';
import { TrashIcon } from '@heroicons/react/24/solid';

// Helper to turn YouTube URLs into embedable links
function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    let videoId = url.split('youtu.be/')[1];
    if (videoId.includes('?')) videoId = videoId.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

// For new-image previews before upload
interface ImagePreview {
  file: File;
  preview: string;
}

const ViewTag = () => {
  // ─── State ─────────────────────────────────────────────────────────────
  const [tag, setTag] = useState<IAthleteTag | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTag, setEditedTag] = useState<IAthleteTag | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  // ─── NEW: lightbox state ──────────────────────────────────────────────
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Next.js hooks
  const { tech, tagId } = useParams();
  const router = useRouter();
  // Clerk user & role
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // ─── Fetch the tag ─────────────────────────────────────────────────────
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
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
  }, [tech, tagId]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleEdit = () => {
    setEditedTag(tag);
    setIsEditing(true);
  };
  const handleCancel = () => {
    setEditedTag(null);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadError(null);
    const newPreviews: ImagePreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setUploadError('Only images allowed');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Max size 5MB');
        continue;
      }
      newPreviews.push({ file, preview: URL.createObjectURL(file) });
    }
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (idx: number) => {
    setImagePreviews(prev => {
      const arr = [...prev];
      URL.revokeObjectURL(arr[idx].preview);
      arr.splice(idx, 1);
      return arr;
    });
  };

  const markImageForDeletion = (url: string) => {
    setImagesToDelete(prev => [...prev, url]);
    if (editedTag) {
      setEditedTag({
        ...editedTag,
        media: editedTag.media.filter(u => u !== url),
      });
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, [imagePreviews]);

  const handleSave = async () => {
    if (!editedTag) return;
    setSaveLoading(true);
    try {
      const formData = new FormData();
      Object.entries(editedTag).forEach(([k, v]) => {
        if (k !== 'media' && v !== undefined) {
          formData.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
        }
      });
      imagePreviews.forEach(p => formData.append('images', p.file));
      if (imagesToDelete.length) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }
      const res = await fetch(`/api/tags/tag/${tagId}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error);
        return;
      }
      setTag(data.tag);
      setIsEditing(false);
      setEditedTag(null);
      setImagePreviews([]);
      setImagesToDelete([]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field: keyof IAthleteTag, val: any) => {
    if (!editedTag) return;
    setEditedTag({ ...editedTag, [field]: val });
  };

  const handleLinkChange = (i: number, val: string) => {
    if (!editedTag?.links) return;
    const arr = [...editedTag.links];
    arr[i] = val;
    setEditedTag({ ...editedTag, links: arr });
  };

  const addLink = () => {
    if (!editedTag) return;
    setEditedTag({ ...editedTag, links: [...(editedTag.links||[]), ''] });
  };

  const removeLink = (i: number) => {
    if (!editedTag?.links) return;
    setEditedTag({
      ...editedTag,
      links: editedTag.links.filter((_, idx) => idx !== i),
    });
  };

  // ─── Early returns ────────────────────────────────────────────────────
  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  const flattenedLinks = tag?.links?.flat() || [];
  const videoLinks = flattenedLinks.filter(link => {
    const l = link.toLowerCase();
    return l.includes('youtube.com') || l.includes('youtu.be') || l.endsWith('.mp4');
  });

  // ─── JSX ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar />
         : role === 'ATHLETE' ? <AthleteSidebar />
         : <Sidebar />}
      </div>

      {/* Main */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="text-black hover:underline text-2xl"
            >
              &larr; Back
            </button>
            {!isEditing && !['ATHLETE','COACH'].includes(role as string || '') && (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Tag
              </button>
            )}
            {isEditing && (
              <div className="space-x-2">
                <button
                  onClick={handleCancel}
                  disabled={saveLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* New comment */}

          {/* Title */}
          <div className="bg-gray-900 rounded-t-2xl p-6 shadow-lg flex items-center">
            {isEditing ? (
              <input
                type="text"
                value={editedTag?.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                className="text-4xl font-extrabold text-white bg-transparent border-b-2 border-white focus:outline-none focus:border-blue-500 w-full"
              />
            ) : (
              <h1 className="text-4xl font-extrabold text-white">{tag?.name}</h1>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-2xl shadow-2xl p-8">
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Description
              </h2>
              {isEditing ? (
                <textarea
                  value={editedTag?.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700">{tag?.description}</p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Notes
              </h2>
              {isEditing ? (
                <textarea
                  value={editedTag?.notes || ''}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700">{tag?.notes}</p>
              )}
            </div>

            {/* Media */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-gray-800">Media</h2>
                {isEditing && (
                  <label className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                    Add Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {uploadError && (
                <p className="text-red-500 text-sm mb-2">{uploadError}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tag?.media
                  .filter(url => !imagesToDelete.includes(url))
                  .map((url, i) => (
                    <div key={i} className="relative group">
                      {isEditing ? (
                        <>
                          <img
                            src={url}
                            alt={`Media ${i + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => markImageForDeletion(url)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <img
                          src={url}
                          alt={`Media ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => setLightboxSrc(url)}
                        />
                      )}
                    </div>
                  ))}
              </div>
              {isEditing && imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((p, i) => (
                    <div key={`new-${i}`} className="relative group">
                      <img
                        src={p.preview}
                        alt={`New ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeNewImage(i)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-gray-800">Links</h2>
                {isEditing && (
                  <button
                    onClick={addLink}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Link
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  {editedTag?.links?.map((ln, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={ln}
                        onChange={e => handleLinkChange(idx, e.target.value)}
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeLink(idx)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {tag?.links?.map((ln, idx) => (
                    <li key={idx}>
                      <a
                        href={ln}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {ln}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Videos */}
            {videoLinks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Videos
                </h2>
                {videoLinks.map((vl, idx) => (
                  <div key={idx} className="mb-6">
                    {vl.endsWith('.mp4') ? (
                      <video controls className="w-full rounded-lg">
                        <source src={vl} type="video/mp4" />
                        Your browser does not support video.
                      </video>
                    ) : (
                      <div className="relative pb-[56.25%] h-0">
                        <iframe
                          src={getEmbedUrl(vl)}
                          title={`Video ${idx+1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lightbox Overlay ─────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Expanded"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ViewTag;

