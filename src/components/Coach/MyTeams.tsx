'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { useUser } from '@clerk/nextjs';

interface Team {
  _id: string;
  name: string;
  u?: string; // Age group or other identifier
}

/**
 * MyTeams Component
 *
 * This component displays a list of teams associated with the logged-in user.
 * It supports both coaches and admins by conditionally rendering the appropriate sidebar.
 *
 * Features:
 * - Fetches teams from the backend API (`/api/my-teams`).
 * - Displays teams with basic information (name, age group).
 * - Redirects users to the sign-in page if not authenticated.
 * - Handles loading and error states gracefully.
 * - Navigates to the team details page on team card click.
 *
 * Roles:
 * - Coaches see the `CoachSidebar`, while admins/users see the standard `Sidebar`.
 */

const MyTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/sign-in');
      return;
    }

    // Fetch teams from the backend
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/my-teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        } else {
          throw new Error('Failed to fetch teams');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">My Teams</h1>
        </div>

        {/* Teams List */}
        {loading ? (
          <p className="text-gray-500">Loading teams...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team._id}
                className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:bg-blue-50"
                onClick={() => router.push(`/my-team/${team._id}`)}
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-700">
                    {team.name}
                  </h2>
                  <p className="text-gray-600">Age Group: {team.u || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lg text-blue-900 text-center">
            No teams found. Add teams to see them here.
          </p>
        )}
      </div>
    </div>
  );
};

export default MyTeams;
