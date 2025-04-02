import { IAthleteTag } from '@/models/athleteTag';
import { IGoal } from '@/models/goal';
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

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
        setGoals(data.goals); // Set the goals from the API response
      } catch (error: any) {
        setErrorMessage(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashData();
  }, [athleteId]);

  if (loading) return <div className="text-gray-800">Loading...</div>;
  if (errorMessage) return <div className="text-gray-800">{errorMessage}</div>;

  return (
    <div className="container mx-auto p-4 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">Athlete Dashboard</h1>

      {/* Counts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-2">Swing Count</h2>
          <p className="text-4xl text-center">{swingCount}</p>
        </div>
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-2">Pitch Count</h2>
          <p className="text-4xl text-center">{pitchCount}</p>
        </div>
      </div>

      {/* Tags Section */}
      <h2 className="text-2xl font-bold mb-4">Tags</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Hit Tags</h3>
          <ul>
            {hitTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Blast Tags</h3>
          <ul>
            {blastTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Track Tags</h3>
          <ul>
            {trackTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Arm Tags</h3>
          <ul>
            {armTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Force Tags</h3>
          <ul>
            {forceTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Assessment Tags</h3>
          <ul>
            {assessmentTags.map((tag) => (
              <li
                key={tag._id.toString()}
                className="py-1 border-b last:border-0"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Goals Section */}
      <h2 className="text-2xl font-bold mb-4">Goals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div
            key={goal._id.toString()}
            className="bg-white shadow rounded p-4"
          >
            <h3 className="font-semibold mb-2 text-gray-800">
              {goal.goalName}
            </h3>
            <p className="text-gray-700">{goal.tech}</p>
            {/* Add any additional goal fields here */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AthleteDashboard;
