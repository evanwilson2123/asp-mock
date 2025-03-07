'use client';

import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import SignInPrompt from '../SignInPrompt';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import CoachSidebar from '../Dash/CoachSidebar';
import Sidebar from '../Dash/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/**
 * This is the 'Pitching' page, a page user's are directed to from their profile page after selecting 'Pitching' from their technology nav.
 * This page houses all of the pitching technologies, overviews on how they are used, along with links to view overview and session data.
 *
 */
const Pitching = () => {
  // Check if the user is signed in and get their role
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  // Initialize all of the fields to dynamically render
  const [hasIntended, setHasIntended] = useState<boolean>(false);
  const [hasTrackman, setHasTrackman] = useState<boolean>(false);
  const [hasArmCare, setHasArmCare] = useState<boolean>(false);
  // Set error and loading states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Get the athlete ID from the URL params
  const { athleteId } = useParams();

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Call the /api/athlete/[athleteId]/pitching endpoint
        const res = await fetch(`/api/athlete/${athleteId}/pitching`);

        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'Pitching data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Pitching data:', JSON.stringify(data));
        setHasIntended(data.resp.intended);
        setHasTrackman(data.resp.trackman);
        setHasArmCare(data.resp.armCare);
        setLoading(false);
      } catch (error: any) {
        console.error(error);
        setError('There was an issue on our end. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [athleteId]);

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  if (loading) {
    return <Loader />;
  }
  if (error) {
    return <ErrorMessage role={role as string} message={error} />;
  }
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ADMIN' ? (
          <Sidebar />
        ) : (
          <SignInPrompt />
        )}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ADMIN' ? (
          <Sidebar />
        ) : (
          <SignInPrompt />
        )}
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6">
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
                tech === 'Pitching' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
        </nav>
        <div className="flex justify-center text-gray-900 text-3xl font-bold py-5">
          <h1>Pitch Tracking Technologies</h1>
        </div>
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
          {hasIntended && (
            <Link
              href={`/athlete/${athleteId}/reports/intended-zone`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={200}
                  height={200}
                  src="/intendedZone.png"
                  alt="trackman"
                ></Image>
              </h1>
              <p className="text-gray-900">
                This technology captures where a pitcher intends to throw versus
                where the ball actually goes. By comparing target zones to pitch
                locations, it offers immediate feedback on command, helping
                players and coaches fine-tune mechanics and improve accuracy.
              </p>
              <h1 className="flex justify-center py-4 font-bold text-gray-900 text-2xl ">
                Click Here to view your data
              </h1>
            </Link>
          )}
          {hasArmCare && (
            <Link
              href={`/athlete/${athleteId}/reports/armcare`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={150}
                  height={150}
                  src="/armcareLogo.png"
                  alt="trackman"
                ></Image>
              </h1>
              <p className="text-gray-900">
                Arm care assessments employ wearable sensors and biomechanical
                analysis to monitor a pitcher&apos;s arm stress and fatigue.
                This insight helps in designing personalized recovery and
                training programs to prevent injuries and maintain optimal
                performance.
              </p>
              <h1 className="flex justify-center py-4 font-bold text-gray-900 text-2xl">
                Click Here to view your data
              </h1>
            </Link>
          )}
          {hasTrackman && (
            <Link
              href={`/athlete/${athleteId}/reports/trackman`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={200}
                  height={200}
                  src="/trackmanImage.png"
                  alt="trackman"
                ></Image>
              </h1>
              <p className="text-gray-900">
                Trackman uses radar and cameras to record key pitch metrics—such
                as velocity, spin rate, and trajectory—in real time. The
                detailed data allows coaches and athletes to analyze and refine
                pitching mechanics for enhanced performance and movement.
              </p>
              <h1 className="flex justify-center py-4 font-bold text-gray-900 text-2xl hover:text-blue-700">
                Click Here to view your data
              </h1>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pitching;
