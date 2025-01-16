"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import Loader from "./Loader";

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

const ManageAthletes: React.FC = () => {
  // -- State for athlete data & request states
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -- State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");

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
    const fetchAthletes = async () => {
      try {
        const res = await fetch("/api/manage-athletes");
        if (!res.ok) {
          throw new Error("Failed to fetch athletes");
        }
        const data = await res.json();
        setAthletes(data.athletes || []);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // -- Filter logic
  const filteredAthletes = athletes.filter((athlete) => {
    // Name search (case-insensitive)
    const fullName = (athlete.firstName + " " + athlete.lastName).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());

    // Level filter (if "All", skip)
    const matchesLevel =
      selectedLevel === "All" || athlete.level === selectedLevel;

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
  const levelOptions = ["All", ...levels];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
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
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-black"
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
