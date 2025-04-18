'use client';

import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import SignInPrompt from '../SignInPrompt';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import CoachSidebar from '../Dash/CoachSidebar';
import Sidebar from '../Dash/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import AthleteSidebar from '../Dash/AthleteSidebar';

/**
 *
 * This is a component for the 'Hitting' page, where the users are navigated to from their profile page.
 * This page houses all of the hitting technologies, an overview of what they are and how they are used,
 * along with links to the overview and session pages for each technology.
 */
const Hitting = () => {
  // Check if the user is signed in and get their role
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  // Initialize all of the fields to dynamically render
  const [hasHittrax, setHasHittrax] = useState<boolean>(false);
  const [hasBlast, setHasBlast] = useState<boolean>(false);
  const [hasHittraxBlast, setHasHittraxBlast] = useState<boolean>(false);
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
        const res = await fetch(`/api/athlete/${athleteId}/hitting`);

        if (!res.ok) {
          const errorMessage =
            res.status === 404
              ? 'Hitting data could not be found.'
              : res.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Hitting data:', JSON.stringify(data));
        setHasBlast(data.blast);
        setHasHittrax(data.hittrax);
        setHasHittraxBlast(data.hittraxBlast);
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
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <SignInPrompt />
        )}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ADMIN' ? (
          <Sidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
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
                tech === 'Hitting' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
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
        <div className="flex justify-center text-gray-900 text-3xl font-bold py-3">
          <h1>Hitting Technologies</h1>
        </div>

        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
          {hasBlast && (
            <Link
              href={`/athlete/${athleteId}/reports/blast-motion`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={200}
                  height={200}
                  src="/blastmotionLogo.png"
                  alt="trackman"
                ></Image>
              </h1>
              <p className="text-gray-900">
                Blast Motion is a sensor-based tool that analyzes swing
                mechanics in real time. It measures metrics like bat speed,
                swing path, and timing, providing actionable insights that help
                athletes refine their swings and optimize performance through
                precise mechanical adjustments.
              </p>
              <h1 className="flex justify-center py-4 font-bold text-gray-900 text-2xl ">
                Click Here to view your data
              </h1>
            </Link>
          )}
          {hasHittrax && (
            <Link
              href={`/athlete/${athleteId}/reports/hittrax`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={150}
                  height={150}
                  src="/hittraxLogo.png"
                  alt="hittrax"
                ></Image>
              </h1>
              <p className="text-gray-900">
                HitTrax tracks ball flight and contact metrics—such as exit
                velocity, launch angle, and estimated distance—offering
                objective feedback on hitting performance. It enables players
                and coaches to assess swing outcomes, monitor progress, and
                pinpoint areas for improvement.
              </p>
              <h1 className="flex justify-center py-4 font-bold text-gray-900 text-2xl">
                Click Here to view your data
              </h1>
            </Link>
          )}
          {hasHittraxBlast && (
            <Link
              href={`/athlete/${athleteId}/reports/hittrax-blast`}
              className="block mb-6 p-4 border-8 border-gray-900 rounded hover:bg-gray-200"
            >
              <h1 className="flex justify-center text-2xl font-bold text-gray-900 mb-2">
                <Image
                  width={150}
                  height={150}
                  src="/hittraxBlastLogo.webp"
                  alt="trackman"
                ></Image>
              </h1>
              <p className="text-gray-900">
                When Blast Motion and HitTrax data are compared for the same
                swing, players and coaches receive a holistic view of
                performance. Blast Motion reveals the swing&apos;s mechanics,
                while HitTrax captures the ball&apos;s resulting flight. This
                dual perspective enables targeted improvements by linking swing
                adjustments directly to ball outcomes, enhancing both
                consistency and power.
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

export default Hitting;
