'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AthleteSidebar from '../Dash/AthleteSidebar';
import { IAthleteTag } from '@/models/athleteTag';
import { IGoal } from '@/models/goal';
import Loader from '../Loader';
import { useRouter } from 'next/navigation';

const AthleteDashboard = () => {
  // State for error and loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // States for counts
  const [swingCount, setSwingCount] = useState<number>(0);
  const [pitchCount, setPitchCount] = useState<number>(0);
  // States for tags
  const [hitTags, setHitTags] = useState<IAthleteTag[]>([]);
  const [blastTags, setBlastTags] = useState<IAthleteTag[]>([]);
  const [trackTags, setTrackTags] = useState<IAthleteTag[]>([]);
  const [armTags, setArmTags] = useState<IAthleteTag[]>([]);
  const [forceTags, setForceTags] = useState<IAthleteTag[]>([]);
  const [assessmentTags, setAssessmentTags] = useState<IAthleteTag[]>([]);
  // State for the goals
  const [goals, setGoals] = useState<IGoal[]>([]);

  // Mount the router
  const router = useRouter();

  // Get athlete ID from clerk public metadata
  const { user } = useUser();
  const athleteId = user?.publicMetadata?.objectId;

  useEffect(() => {
    if (!athleteId) return;
    const fetchDashData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/athlete/${athleteId}/dash`);
        if (!res.ok) {
          throw new Error('Error fetching athlete dashboard data');
        }
        const data = await res.json();
        setSwingCount(data.swingCount);
        setPitchCount(data.pitchCount);
        setHitTags(data.hitTags);
        setBlastTags(data.blastTags);
        setTrackTags(data.trackTags);
        setArmTags(data.armTags);
        setForceTags(data.forceTags);
        setAssessmentTags(data.assessmentTags);
        setGoals(data.goals);
      } catch (error: any) {
        setErrorMessage(
          error.message || 'Error fetching athlete dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashData();
  }, [athleteId]);

  if (loading) return <Loader />;
  if (errorMessage) return <div className="text-gray-800">{errorMessage}</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        <AthleteSidebar />
      </div>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        <AthleteSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center">My Stats</h1>

        {/* Counts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Swing Count
            </h2>
            <p className="text-4xl font-semibold text-gray-800 text-center">
              {swingCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Pitch Count
            </h2>
            <p className="text-4xl font-semibold text-gray-800 text-center">
              {pitchCount}
            </p>
          </div>
        </div>

        {/* Tags Section */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Hit Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">Hit Tags</h3>
            <ul>
              {hitTags.map((tag) => (
                <li
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(`/athlete/${athleteId}/tags/hittrax/${tag._id}`)
                  }
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
          {/* Blast Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">Blast Tags</h3>
            <ul>
              {blastTags.map((tag) => (
                <div
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(`/athlete/${athleteId}/tags/blast/${tag._id}`)
                  }
                >
                  {tag.name}
                </div>
              ))}
            </ul>
          </div>
          {/* Track Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">Track Tags</h3>
            <ul>
              {trackTags.map((tag) => (
                <li
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(
                      `/athlete/${athleteId}/tags/trackman/${tag._id}`
                    )
                  }
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
          {/* Arm Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">Arm Tags</h3>
            <ul>
              {armTags.map((tag) => (
                <li
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(`/athlete/${athleteId}/tags/armcare/${tag._id}`)
                  }
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
          {/* Force Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">Force Tags</h3>
            <ul>
              {forceTags.map((tag) => (
                <li
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(
                      `/athlete/${athleteId}/tags/forceplates/${tag._id}`
                    )
                  }
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
          {/* Assessment Tags Card */}
          <div className="bg-white rounded-lg shadow p-4 border-2 border-gray-300">
            <h3 className="font-semibold mb-2 text-gray-800">
              Assessment Tags
            </h3>
            <ul>
              {assessmentTags.map((tag) => (
                <li
                  key={tag._id.toString()}
                  className="py-1 border-b last:border-0 text-white outline flex justify-center items-center rounded-md  bg-gray-700 hover:bg-gray-600 cursor-auto"
                  onClick={() =>
                    router.push(
                      `/athlete/${athleteId}/tags/assessment/${tag._id}`
                    )
                  }
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Goals Section */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div
              key={goal._id.toString()}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-300"
              onClick={() =>
                router.push(`/athlete/${athleteId}/goals/${goal._id}`)
              }
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {goal.goalName}
              </h3>
              <p className="text-gray-700">{goal.tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
