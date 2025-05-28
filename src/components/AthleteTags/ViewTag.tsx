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

// Helper function to transform YouTube links to embed links.
function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    let videoId = url.split('youtu.be/')[1];
    // Remove any query parameters from the video ID.
    if (videoId.includes('?')) {
      videoId = videoId.split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

// Add ImagePreview interface
interface ImagePreview {
  file: File;
  preview: string;
}

const ViewTag = () => {
  const [tag, setTag] = useState<IAthleteTag | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTag, setEditedTag] = useState<IAthleteTag | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Next.js navigation hooks.
  const { tech, tagId } = useParams();
  const router = useRouter();

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

  const handleEdit = () => {
    setEditedTag(tag);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedTag(null);
    setIsEditing(false);
  };

  // Add image handling functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadError(null);
    const newPreviews: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        continue;
      }

      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview });
    }

    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const markImageForDeletion = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
    if (editedTag) {
      setEditedTag(prev => prev ? {
        ...prev,
        media: prev.media.filter(url => url !== imageUrl)
      } : null);
    }
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, [imagePreviews]);

  const handleSave = async () => {
    if (!editedTag) return;
    
    setSaveLoading(true);
    try {
      const formData = new FormData();
      
      // Add all tag data
      Object.entries(editedTag).forEach(([key, value]) => {
        if (key !== 'media' && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add new images
      imagePreviews.forEach((preview) => {
        formData.append('images', preview.file);
      });

      // Add images to delete
      if (imagesToDelete.length > 0) {
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
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field: keyof IAthleteTag, value: any) => {
    if (!editedTag) return;
    setEditedTag(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleLinkChange = (index: number, value: string) => {
    if (!editedTag?.links) return;
    const newLinks = [...editedTag.links];
    newLinks[index] = value;
    setEditedTag(prev => prev ? { ...prev, links: newLinks } : null);
  };

  const addLink = () => {
    if (!editedTag) return;
    setEditedTag(prev => prev ? { 
      ...prev, 
      links: [...(prev.links || []), ''] 
    } : null);
  };

  const removeLink = (index: number) => {
    if (!editedTag?.links) return;
    const newLinks = editedTag.links.filter((_, i) => i !== index);
    setEditedTag(prev => prev ? { ...prev, links: newLinks } : null);
  };

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  // Flatten tag.links by one level:
  const flattenedLinks = tag?.links?.flat() || [];
  const videoLinks = flattenedLinks.filter((link) => {
    const lowerLink = link.toLowerCase();
    return (
      lowerLink.includes('youtube.com') ||
      lowerLink.includes('youtu.be') ||
      lowerLink.endsWith('.mp4')
    );
  });

  console.log(videoLinks);
  console.log('All tag links:', tag?.links);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for medium and larger screens */}
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
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="text-black hover:underline text-2xl"
            >
              &larr; Back
            </button>
            {!isEditing && role !== 'ATHLETE' && role !== 'COACH' ? (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Tag
              </button>
            ) : isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ): null}
          </div>

          <div className="bg-gray-900 rounded-t-2xl p-6 shadow-lg flex items-center">
            {isEditing ? (
              <input
                type="text"
                value={editedTag?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-4xl font-extrabold text-white bg-transparent border-b-2 border-white focus:outline-none focus:border-blue-500 w-full"
              />
            ) : (
              <h1 className="text-4xl font-extrabold text-white">{tag?.name}</h1>
            )}
          </div>

          <div className="bg-white rounded-b-2xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Description
              </h2>
              {isEditing ? (
                <textarea
                  value={editedTag?.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="text-black w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{tag?.description}</p>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Notes
              </h2>
              {isEditing ? (
                <textarea
                  value={editedTag?.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="text-black w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{tag?.notes}</p>
              )}
            </div>

            {/* Media Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-gray-800">Media</h2>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <label className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                      Add Images
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-red-500 text-sm mb-2">{uploadError}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Existing Images - Filter out images marked for deletion */}
                {tag?.media?.filter(imageUrl => !imagesToDelete.includes(imageUrl)).map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Tag media ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {isEditing && (
                      <button
                        onClick={() => markImageForDeletion(imageUrl)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {/* New Images */}
                {isEditing && imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={preview.preview}
                      alt={`New image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Links Section */}
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
                  {editedTag?.links?.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={link}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter link URL"
                      />
                      <button
                        onClick={() => removeLink(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {tag?.links?.map((link, index) => (
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
              )}
            </div>

            {/* Video Embed Section */}
            {videoLinks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Videos
                </h2>
                {videoLinks.map((videoLink, index) => (
                  <div key={index} className="mb-6">
                    {videoLink.endsWith('.mp4') ? (
                      <video controls className="w-full rounded-lg">
                        <source src={videoLink} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="relative pb-[56.25%] h-0">
                        <iframe
                          src={getEmbedUrl(videoLink)}
                          title={`Video Player ${index + 1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                        ></iframe>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTag;
