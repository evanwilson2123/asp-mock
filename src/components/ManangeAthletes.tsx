'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from './Loader';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

/**
 * ManageAthletes Component
 *
 * The `ManageAthletes` component provides an interface to view, filter, and manage athletes.
 * It features a responsive layout with a sidebar, search functionality, level-based filtering,
 * pagination, and navigation to individual athlete profiles.
 *
 * Features:
 * - **Dynamic Sidebar:** Displays `CoachSidebar` for coaches and `Sidebar` for other roles.
 * - **Data Fetching:** Retrieves athlete data from the `/api/manage-athletes` endpoint.
 * - **Search and Filter:** Allows filtering athletes by name (case-insensitive) and level.
 * - **Pagination:** Displays athletes in pages with controls to navigate between them.
 * - **Navigation:** Clicking an athlete row redirects to their detailed page (`/athlete/:id`).
 *
 * Technologies Used:
 * - **React:** Uses functional components and hooks (`useState`, `useEffect`).
 * - **Next.js:** Utilizes `useRouter` for navigation and `useParams` for dynamic routing.
 * - **Clerk:** Handles user roles for conditional rendering.
 * - **Tailwind CSS:** Provides responsive design, layout, and utility-based styling.
 *
 * Props:
 * - None (all data is fetched internally).
 *
 * State Management:
 * - **athletes:** Stores the fetched list of athletes.
 * - **loading:** Indicates data fetching status.
 * - **error:** Holds error messages if data fetching fails.
 * - **searchTerm:** Stores the user's search input for name filtering.
 * - **selectedLevel:** Tracks the selected level for filtering.
 * - **currentPage:** Manages the current page for pagination.
 *
 * API Calls:
 * - **GET `/api/manage-athletes`:** Fetches the list of athletes.
 *   - Expected response: `{ athletes: Athlete[] }`
 *   - Error handling displays messages for failed requests.
 *
 * Key Components:
 * - `CoachSidebar` and `Sidebar`: Rendered based on the user's role.
 * - `Loader`: Shown during data loading.
 * - **Pagination Controls:** "Previous", "Next", and numeric page buttons.
 *
 * Usage Example:
 * ```tsx
 * <ManageAthletes />
 * ```
 *
 * UI Components:
 * - **Filter Section:** Includes search input and level dropdown.
 * - **Athletes Table:** Displays first name, last name, email, and level.
 * - **Pagination:** Provides navigation for large datasets.
 *
 * Customization:
 * - **Page Size:** Change `pageSize` to adjust items per page (default is 5).
 * - **Filters:** Add more filters as needed (e.g., age, performance metrics).
 * - **Role Logic:** Adapt `role` handling to new user roles if introduced.
 *
 * Accessibility:
 * - Keyboard-accessible buttons and focus styles.
 * - Clear visual feedback for hover, focus, and disabled states.
 *
 * Error Handling:
 * - Displays a user-friendly message when data fetching fails.
 * - Handles both client-side (network) and server-side errors.
 *
 * Edge Cases:
 * - Shows a message if no athletes match the search/filter criteria.
 * - Disables pagination buttons when on the first or last page.
 */

const ManageAthletes: React.FC = () => {
  // -- State for athlete data & request states
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -- State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // -- State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // how many items per page

  // -- Router & user
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // -- Fetch athletes once, on mount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (role === 'ATHLETE') {
      router.push('/');
    }
    const fetchAthletes = async () => {
      try {
        const res = await fetch('/api/manage-athletes');
        if (!res.ok) {
          throw new Error('Failed to fetch athletes');
        }
        const data = await res.json();
        setAthletes(data.athletes || []);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [role, router]);

  // -- Filter logic
  const filteredAthletes = athletes.filter((athlete) => {
    // Name search (case-insensitive)
    const fullName = (athlete.firstName + ' ' + athlete.lastName).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());

    // Level filter (if "All", skip)
    const matchesLevel =
      selectedLevel === 'All' || athlete.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  // -- Pagination logic
  const totalPages = Math.ceil(filteredAthletes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex);

  // -- Table row click -> athlete details page
  const handleAthleteClick = (athleteId: string) => {
    router.push(`/athlete/${athleteId}`);
  };

  // -- Pagination navigation
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Build numeric page links
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  // -- Loading
  if (loading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  // -- Error
  if (error) {
    return <div>Error: {error}</div>;
  }

  // -- Unique levels for the dropdown
  const levels = Array.from(new Set(athletes.map((a) => a.level))).sort();
  const levelOptions = ['All', ...levels];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage Athletes</h1>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
          {/* Text Search */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-gray-700 font-semibold mb-1"
            >
              Search by Name:
            </label>
            <input
              id="search"
              type="text"
              placeholder="e.g. John"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to page 1 after new search
              }}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          {/* Level Filter */}
          <div className="flex-1">
            <label
              htmlFor="level-filter"
              className="block text-gray-700 font-semibold mb-1"
            >
              Filter by Level:
            </label>
            <select
              id="level-filter"
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1); // reset to page 1
              }}
              className="w-full p-2 border rounded text-black"
            >
              {levelOptions.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Athletes Table */}
        {paginatedAthletes.length > 0 ? (
          <>
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">First Name</th>
                  <th className="py-2 px-4 text-left">Last Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Level</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAthletes.map((athlete) => (
                  <tr
                    key={athlete._id}
                    onClick={() => handleAthleteClick(athlete._id)}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="text-black py-2 px-4">
                      {athlete.firstName}
                    </td>
                    <td className="text-black py-2 px-4">{athlete.lastName}</td>
                    <td className="text-black py-2 px-4">{athlete.email}</td>
                    <td className="text-black py-2 px-4">{athlete.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-center space-x-4">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={currentPage <= 1}
                className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>

              {/* Numeric Page Links */}
              <div className="space-x-2">
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-black'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-lg text-blue-900 text-center mt-4">
            No athletes found matching your filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageAthletes;
