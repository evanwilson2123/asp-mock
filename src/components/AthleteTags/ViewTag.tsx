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

const ViewTag = () => {
  const [tag, setTag] = useState<IAthleteTag | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
          {/* Header with gradient background and back button */}
          <button
            onClick={() => router.back()}
            className="text-black mr-4 hover:underline text-2xl mb-4"
          >
            &larr; Back
          </button>
          <div className="bg-gray-900 rounded-t-2xl p-6 shadow-lg flex items-center">
            <h1 className="text-4xl font-extrabold text-white">{tag?.name}</h1>
          </div>
          {/* Content card */}
          <div className="bg-white rounded-b-2xl shadow-2xl p-8">
            {tag?.description && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Description
                </h2>
                <p className="text-gray-700">{tag.description}</p>
              </div>
            )}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Notes
              </h2>
              <p className="text-gray-700">{tag?.notes}</p>
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
            {tag?.links && tag.links.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Links
                </h2>
                <ul className="space-y-2">
                  {tag.links.flat().map((link, index) => (
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
    </div>
  );
};

export default ViewTag;
