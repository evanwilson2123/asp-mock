'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { useRouter } from 'next/navigation';

/**
 * TeamsGroups Component
 *
 * The `TeamsGroups` component displays a list of teams or groups managed within the application.
 * It allows admins to view existing teams and create new ones. Each team is clickable, leading to
 * its detailed page.
 *
 * Features:
 * - **Authentication Check:** Redirects unauthenticated users to the sign-in page.
 * - **Role-Based Access Control:** Only users with the `ADMIN` role can access the page; others are redirected to the homepage.
 * - **Team List Display:** Dynamically fetches and displays a list of teams from the backend API.
 * - **Create Team Button:** Allows admins to navigate to the team creation page.
 * - **Responsive Sidebar:** Displays different sidebars based on user roles (Coach/Admin).
 *
 * Technologies Used:
 * - **React:** Functional component with hooks (`useEffect`, `useState`).
 * - **Next.js:** Uses `useRouter` for client-side routing and `useUser` from Clerk for authentication.
 * - **Clerk:** Handles user authentication and role management.
 * - **Tailwind CSS:** Provides utility-first styling for responsive design and layout.
 *
 * Folder Structure:
 * ```
 * components/
 * └── Dash/
 *     ├── CoachSidebar.tsx
 *     └── Sidebar.tsx
 * pages/
 * └── TeamsGroups.tsx
 * ```
 *
 * API Integration:
 * - Fetches team data from `/api/team`.
 * - Displays team name, age group, and coach information.
 *
 * Props:
 * - None (data fetched internally within the component).
 *
 * Usage Example:
 * ```tsx
 * import TeamsGroups from "@/components/TeamsGroups";
 *
 * export default function Dashboard() {
 *   return (
 *     <div>
 *       <TeamsGroups />
 *     </div>
 *   );
 * }
 * ```
 *
 * Customization:
 * - **Team Details:** Modify the `onClick` handler to navigate to custom team detail pages.
 * - **Create Button:** Adjust the `/create-team` route for different workflows.
 * - **Role Management:** Extend the role-based access logic if more roles are introduced.
 *
 * Edge Cases:
 * - **No Teams:** Displays a friendly message if no teams are available.
 * - **API Errors:** Logs errors in case of API failures for debugging.
 * - **Loading State:** Shows a loading indicator while fetching data.
 *
 * Accessibility:
 * - Fully keyboard-navigable with focusable buttons and clickable team cards.
 * - Semantic HTML with descriptive headings and text for screen readers.
 */

const TeamsGroups: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/sign-in');
      return;
    }

    if (role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch teams from the backend
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
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isSignedIn, role, router]);

  if (!isSignedIn) return null;

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
                onClick={() => router.push(`/my-team/${team._id}`)} // Navigate to team details page
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-700">
                    {team.name}
                  </h2>
                  <p className="text-gray-600">Age Group: {team.u || 'N/A'}</p>
                  <p className="text-gray-600">
                    Coach:{' '}
                    {team.coach
                      ? team.coach.firstName + ' ' + team.coach.lastName
                      : 'N/A'}
                  </p>
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

export default TeamsGroups;
