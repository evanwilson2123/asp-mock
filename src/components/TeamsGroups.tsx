'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { useRouter } from 'next/navigation';
import ErrorMessage from './ErrorMessage';
import { TrashIcon } from '@heroicons/react/24/solid';

/**
 * TeamsGroups Component
 *
 * Displays a list of teams or groups with updated fields:
 * - Team name
 * - Playing Level (from team.level)
 * - Head Coach (an array of head coaches, whose names are joined by commas)
 *
 * Only users with ADMIN or COACH roles can access this page.
 */
const TeamsGroups: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for delete confirmation popup
  const [deletePopup, setDeletePopup] = useState<{
    show: boolean;
    teamId: string;
    confirmText: string;
  }>({
    show: false,
    teamId: '',
    confirmText: '',
  });

  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/sign-in');
      return;
    }

    // Fetch teams from the backend API
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/team');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        } else {
          console.error('Failed to fetch teams');
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setErrorMessage('There was an error, please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isSignedIn, role, router]);

  const handleDeleteTeam = async (teamId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/team/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        setErrorMessage('Error deleting team');
        return;
      }
      setTeams(teams.filter((t: any) => t._id !== teamId));
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    } finally {
      setLoading(false);
    }
  };

  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  if (!isSignedIn) return null;

  if (role !== 'ADMIN' && role !== 'COACH') {
    router.push('/');
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Teams & Groups</h1>
          <button
            onClick={() => router.push('/create-team')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Create Team/Group
          </button>
        </div>

        {/* Teams List */}
        {loading ? (
          <p className="text-gray-500">Loading teams...</p>
        ) : teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map((team: any) => (
              <div
                key={team._id}
                className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between cursor-pointer hover:bg-blue-50"
                onClick={() => router.push(`/my-team/${team._id}`)}
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-700">
                    {team.name}
                  </h2>
                  <p className="text-gray-600">
                    Playing Level: {team.level || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    Head Coach:{' '}
                    {team.headCoaches && team.headCoaches.length > 0
                      ? team.headCoaches
                          .filter((coach: any) => coach)
                          .map(
                            (coach: any) =>
                              coach.firstName + ' ' + coach.lastName
                          )
                          .join(', ')
                      : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletePopup({
                      show: true,
                      teamId: team._id,
                      confirmText: '',
                    });
                  }}
                >
                  <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lg text-blue-900 text-center">
            No teams found. Add teams to see them here.
          </p>
        )}
      </div>
      {deletePopup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4 text-black">
              Confirm Deletion
            </h3>
            <p className="mb-2 text-black">
              Type <strong>DELETE</strong> to confirm deletion.
            </p>
            <input
              type="text"
              placeholder="DELETE"
              value={deletePopup.confirmText}
              onChange={(e) =>
                setDeletePopup((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
              className="border p-2 mb-4 w-full text-black"
            />
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setDeletePopup({
                    show: false,
                    teamId: '',
                    confirmText: '',
                  })
                }
                className="mr-4 px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletePopup.confirmText !== 'DELETE') {
                    alert("Please type 'DELETE' to confirm deletion.");
                    return;
                  }
                  await handleDeleteTeam(deletePopup.teamId);
                  setDeletePopup({
                    show: false,
                    teamId: '',
                    confirmText: '',
                  });
                }}
                className="px-4 py-2 border rounded bg-red-500 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsGroups;
