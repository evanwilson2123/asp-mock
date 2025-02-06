'use client';
import React, { useState, useEffect } from 'react';
import Assessment from './Assement';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

const AssesmentPage: React.FC = () => {
  // ===== Athlete Selection State and Effect =====
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesLoading, setAthletesLoading] = useState<boolean>(true);
  const [athletesError, setAthletesError] = useState<string | null>(null);

  // ====== Filter and pagination state for athlete selection =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const res = await fetch('/api/manage-athletes');
        if (!res.ok) {
          throw new Error('Failed to fetch athletes');
        }
        const data = await res.json();
        setAthletes(data.athletes || []);
      } catch (error: any) {
        setAthletesError(error.message || 'An unexpected error occured');
      } finally {
        setAthletesLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // ===== Filter Logic =====
  const filteredAthletes = athletes.filter((athlete) => {
    const fullName = (athlete.firstName + ' ' + athlete.lastName).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesLevel =
      selectedLevel === 'All' || athlete.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalPages = Math.ceil(filteredAthletes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex);

  // ===== Render the athlete selection section if no athlete is selected =====
  if (!selectedAthlete) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">
          Select Athlete
        </h1>
        {athletesLoading ? (
          <p>Loading athletes...</p>
        ) : athletesError ? (
          <p className="text-red-500">Error: {athletesError}</p>
        ) : (
          <>
            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
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
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
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
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 border rounded text-black"
                >
                  {[
                    'All',
                    ...Array.from(new Set(athletes.map((a) => a.level))).sort(),
                  ].map((lvl) => (
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
                        onClick={() => setSelectedAthlete(athlete)}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="text-black py-2 px-4">
                          {athlete.firstName}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.lastName}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.email}
                        </td>
                        <td className="text-black py-2 px-4">
                          {athlete.level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      if (currentPage > 1) setCurrentPage((prev) => prev - 1);
                    }}
                    disabled={currentPage <= 1}
                    className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (currentPage < totalPages)
                        setCurrentPage((prev) => prev + 1);
                    }}
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
          </>
        )}
      </div>
    );
  } else {
    return (
      <div>
        <Assessment {...selectedAthlete} />
      </div>
    );
  }
};

export default AssesmentPage;
