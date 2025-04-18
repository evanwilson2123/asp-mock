'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AthleteSidebar from '../Dash/AthleteSidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { IAthleteTag } from '@/models/athleteTag';
import { IGoal } from '@/models/goal';
import Loader from '../Loader';
import { useParams, useRouter } from 'next/navigation';
import { ICoachNote } from '@/models/coachesNote';

/**
 * AthleteDashboard
 * ----------------------------------------------------
 * Displays summary statistics, tags, goals, and coaches' notes
 * for an individual athlete. Sidebar adapts to viewer role:
 *  - ATHLETE → AthleteSidebar
 *  - COACH   → CoachSidebar
 *  - others  → Sidebar
 */
const AthleteDashboard = () => {
  /* ----------------------------- hooks / auth ----------------------------- */
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  // If viewer is the athlete themself, use their own objectId.
  // Otherwise (coach/admin), use the `[athleteId]` route param.
  const resolvedAthleteId: string | undefined =
    role === 'ATHLETE'
      ? (user?.publicMetadata?.objectId as string)
      : (() => {
          const id = (params as Record<string, string | string[]>).athleteId;
          return Array.isArray(id) ? id[0] : id;
        })();

  /* ------------------------------ state ----------------------------------- */
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Counts
  const [swingCount, setSwingCount] = useState(0);
  const [pitchCount, setPitchCount] = useState(0);

  // Tags
  const [hitTags, setHitTags] = useState<IAthleteTag[]>([]);
  const [blastTags, setBlastTags] = useState<IAthleteTag[]>([]);
  const [trackTags, setTrackTags] = useState<IAthleteTag[]>([]);
  const [armTags, setArmTags] = useState<IAthleteTag[]>([]);
  const [forceTags, setForceTags] = useState<IAthleteTag[]>([]);
  const [assessmentTags, setAssessmentTags] = useState<IAthleteTag[]>([]);

  // Goals
  const [goals, setGoals] = useState<IGoal[]>([]);

  // Notes
  const [blastNotes, setBlastNotes] = useState<ICoachNote[]>([]);
  const [hittraxNotes, setHittraxNotes] = useState<ICoachNote[]>([]);
  const [trackmanNotes, setTrackmanNotes] = useState<ICoachNote[]>([]);
  const [profileNotes, setProfileNotes] = useState<ICoachNote[]>([]);

  const [activeTab, setActiveTab] = useState<
    'blast' | 'hittrax' | 'trackman' | 'profile'
  >('blast');

  /* ------------------------------ helpers --------------------------------- */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  /* ------------------------------ effects --------------------------------- */
  useEffect(() => {
    if (!resolvedAthleteId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/athlete/${resolvedAthleteId}/dash`);
        if (!res.ok) throw new Error('Error fetching athlete dashboard data');
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

        setBlastNotes(data.blastNotes);
        setHittraxNotes(data.hittraxNotes);
        setTrackmanNotes(data.trackmanNotes);
        setProfileNotes(data.profileNotes);
      } catch (err: any) {
        setErrorMessage(err.message ?? 'Error fetching athlete dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedAthleteId]);

  /* --------------------------- early returns ------------------------------ */
  if (loading) return <Loader />;
  if (errorMessage) return <div className="text-gray-800">{errorMessage}</div>;

  /* ----------------------------- render ----------------------------------- */
  const noteTabs = [
    { key: 'blast', title: 'Blast', notes: blastNotes },
    { key: 'hittrax', title: 'HitTrax', notes: hittraxNotes },
    { key: 'trackman', title: 'Trackman', notes: trackmanNotes },
    { key: 'profile', title: 'Profile', notes: profileNotes },
  ] as const;

  const SidebarComponent =
    role === 'COACH'
      ? CoachSidebar
      : role === 'ATHLETE'
        ? AthleteSidebar
        : Sidebar;

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Sidebar (mobile & desktop) */}
      <div className="md:hidden bg-gray-100">
        <SidebarComponent />
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        <SidebarComponent />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-24 text-gray-800">
        {role !== 'ATHLETE' && (
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
          >
            Back
          </button>
        )}
        <h1 className="text-3xl font-bold mb-6 text-center">My Stats</h1>

        {/* Counts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: 'Swing Count', value: swingCount },
            { label: 'Pitch Count', value: pitchCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-300"
            >
              <h2 className="text-xl font-bold mb-4">{label}</h2>
              <p className="text-4xl font-semibold text-center">{value}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <h2 className="text-2xl font-bold mb-4">Tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Hit Tags', tags: hitTags, path: 'hittrax' },
            { title: 'Blast Tags', tags: blastTags, path: 'blast' },
            { title: 'Track Tags', tags: trackTags, path: 'trackman' },
            { title: 'Arm Tags', tags: armTags, path: 'armcare' },
            { title: 'Force Tags', tags: forceTags, path: 'forceplates' },
            {
              title: 'Assessment Tags',
              tags: assessmentTags,
              path: 'assessment',
            },
          ].map(({ title, tags, path }) => (
            <div
              key={title}
              className="bg-white rounded-lg shadow p-4 border-2 border-gray-300"
            >
              <h3 className="font-semibold mb-2">{title}</h3>
              <ul>
                {tags.filter(Boolean).map((tag) => (
                  <li
                    key={tag._id.toString()}
                    className="py-1 border-b last:border-0 text-white bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer flex justify-center"
                    onClick={() =>
                      router.push(
                        `/athlete/${resolvedAthleteId}/tags/${path}/${tag._id}`
                      )
                    }
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Goals */}
        <h2 className="text-2xl font-bold mb-4">Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal) => (
            <div
              key={goal._id.toString()}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-300 cursor-pointer"
              onClick={() =>
                router.push(`/athlete/${resolvedAthleteId}/goals/${goal._id}`)
              }
            >
              <h3 className="text-lg font-semibold mb-2">{goal.goalName}</h3>
              <p className="text-gray-700">{goal.tech}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg ring-2 ring-offset-2 p-6 ring-offset-white ring-gray-300 bg-white">
          {/* Coaches Notes */}
          <h2 className="text-2xl font-bold mb-6">Coaches Notes</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {noteTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md font-semibold transition-colors duration-150 ${
                  activeTab === tab.key
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="overflow-x-auto border border-gray-300 rounded-md">
            {noteTabs.map((tab) => {
              if (tab.key !== activeTab) return null;

              if (tab.notes.length === 0) {
                return (
                  <p key={tab.key} className="p-4 text-gray-600 italic">
                    No notes for {tab.title}.
                  </p>
                );
              }

              return (
                <table
                  key={tab.key}
                  className="min-w-full divide-y divide-gray-300 bg-white"
                >
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left whitespace-nowrap">
                        Coach
                      </th>
                      <th className="px-4 py-2 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tab.notes.map((note) => (
                      <tr
                        key={note._id?.toString()}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatDate(note.date.toString())}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {note.coachName}
                        </td>
                        <td className="px-4 py-2">{note.coachNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
