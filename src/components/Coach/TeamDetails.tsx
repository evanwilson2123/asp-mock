'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import { TrashIcon } from '@heroicons/react/24/solid';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * TeamDetails Component
 *
 * This component displays the details of a specific team, including a list of athletes.
 * It supports role-based navigation for both coaches and admins.
 *
 * Features:
 * - Fetches athletes for the selected team from the backend API (`/api/my-teams/:teamId`).
 * - Displays athlete information in a table format with clickable rows for athlete details.
 * - Handles loading and error states gracefully.
 * - Provides a "Back to Teams" button for role-based navigation (Coach, Admin, or default).
 *
 * Roles:
 * - Coaches see the `CoachSidebar`, while admins/users see the standard `Sidebar`.
 */

const TeamDetails = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [headCoaches, setHeadCoaches] = useState<Coach[]>([]);
  const [assistants, setAssistants] = useState<Coach[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { teamId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [fetchingAthletes, setFetchingAthletes] = useState(false);
  const [level, setLevel] = useState<string>('');
  const [athleteSearch, setAthleteSearch] = useState('');

  useEffect(() => {
    // Fetch athletes for the team
    const fetchAthletes = async () => {
      try {
        const response = await fetch(`/api/my-teams/${teamId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch athletes');
        }

        const data = await response.json();
        setAthletes(data.athletes || []);
        setHeadCoaches(data.headCoaches || []);
        setAssistants(data.assistants || []);
        setLevel(data.level || '');
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [teamId]);

  const handleBackClick = () => {
    router.back();
  };

  const openAddModal = async () => {
    setShowAddAthlete(true);
    setFetchingAthletes(true);
    setAddError(null);
    setSelectedAthleteId('');
    try {
      const res = await fetch( `/api/my-teams/${teamId}/add-athlete/${level}`);
      const data = await res.json();
      setAllAthletes(data.athletes || []);
    } catch (e: any) {
      console.log(e);
      setAllAthletes([]);
    }
    setFetchingAthletes(false);
  };

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      const res = await fetch(`/api/my-teams/${teamId}/add-athlete/${level}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: selectedAthleteId }),
      });
      if (!res.ok) {
        setAddError('Failed to add athlete.');
        return;
      }
      const created = await res.json();
      setAthletes((prev) => [...prev, created.athlete || created]);
      setShowAddAthlete(false);
      setSelectedAthleteId('');
    } catch (err: any) {
      setAddError(err.message || 'Failed to add athlete.');
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!window.confirm('Remove this athlete?')) return;
    try {
      const res = await fetch(`/api/my-teams/${teamId}/remove-athlete/${athleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        alert('Failed to remove athlete.');
        return;
      }
      setAthletes((prev) => prev.filter((a) => a._id !== athleteId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove athlete.');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div>Error: {error}</div>;

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
          <h1 className="text-2xl font-bold text-gray-700">Team Details</h1>
          <button
            onClick={handleBackClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back
          </button>
        </div>

        { /* Head Coaches List */}
        <div>
          <h1 className='text-2xl font-bold text-gray-700 justify-center flex mb-4'>Head Coaches</h1>
          {headCoaches.length > 0 ? (
            <table className="min-w-full bg-white rounded-lg shadow-md mb-6">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">First Name</th>
                  <th className="py-2 px-4 text-left">Last Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left"></th> 
                </tr>
              </thead>
              <tbody>
                {headCoaches.map((coach) => (
                  <tr key={coach._id} className="hover:bg-blue-50 cursor-pointer">
                    <td className="text-black py-2 px-4">{coach.firstName}</td>
                    <td className="text-black py-2 px-4">{coach.lastName}</td>
                    <td className="text-black py-2 px-4">{coach.email}</td>
                    <td className="text-black py-2 px-4">{coach.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className='text-lg text-blue-900 text-center mb-6'>No head coaches found for this team.</p>
          )}
        </div>

        { /* Assistants List */}
        {assistants.length > 0 && (
          <div>
            <h1 className='text-2xl font-bold text-gray-700 justify-center flex mb-4'>Assistants</h1>
            <table className="min-w-full bg-white rounded-lg shadow-md mb-6">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">First Name</th>
                  <th className="py-2 px-4 text-left">Last Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  {/* <th className="py-2 px-4 text-left">Phone</th> */}
                </tr>
              </thead>
              <tbody>
                {assistants.map((coach) => (
                  <tr key={coach._id} className="hover:bg-blue-50 cursor-pointer">
                    <td className="text-black py-2 px-4">{coach.firstName}</td>
                    <td className="text-black py-2 px-4">{coach.lastName}</td>
                    <td className="text-black py-2 px-4">{coach.email}</td>
                    <td className="text-black py-2 px-4">{coach.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Athletes List */}
        <h1 className='text-2xl font-bold text-gray-700 justify-center flex mb-4'>Athletes</h1>
        {/* Add Athlete Button and Modal Form */}
        <div className="mb-4">
          {!showAddAthlete && role !== 'ATHLETE' && (
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              + Add Athlete
            </button>
          )}
          {addError && <div className="text-red-600 mt-2">{addError}</div>}
        </div>
        {/* Modal for Add Athlete */}
        {showAddAthlete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <form onSubmit={handleAddAthlete} className="flex flex-col gap-2">
                {fetchingAthletes ? (
                  <div>Loading athletes...</div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={athleteSearch}
                      onChange={e => setAthleteSearch(e.target.value)}
                      className="border p-2 rounded text-black"
                    />
                    <select
                      required
                      value={selectedAthleteId}
                      onChange={e => setSelectedAthleteId(e.target.value)}
                      className="border p-2 rounded text-black"
                    >
                      <option value="" className='text-black'>Select an athlete</option>
                      {allAthletes
                        .filter(a =>
                          athleteSearch.trim() === '' ||
                          a.firstName.toLowerCase().includes(athleteSearch.toLowerCase()) ||
                          a.lastName.toLowerCase().includes(athleteSearch.toLowerCase())
                        )
                        .map(a => (
                          <option key={a._id} value={a._id} className='text-black'>
                            {a.firstName} {a.lastName} ({a.email})
                          </option>
                        ))}
                    </select>
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={!selectedAthleteId}>Add</button>
                  <button type="button" onClick={() => setShowAddAthlete(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
              {addError && <div className="text-red-600 mt-2">{addError}</div>}
            </div>
          </div>
        )}
        {athletes.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-2 px-4 text-left">First Name</th>
                <th className="py-2 px-4 text-left">Last Name</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Level</th>
                <th className="py-2 px-4 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((athlete) => (
                <tr
                  key={athlete._id}
                  onClick={() => router.push(`/athlete/${athlete._id}`)}
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <td className="text-black py-2 px-4">{athlete.firstName}</td>
                  <td className="text-black py-2 px-4">{athlete.lastName}</td>
                  <td className="text-black py-2 px-4">{athlete.email}</td>
                  <td className="text-black py-2 px-4">{athlete.level}</td>
                  <td className="py-2 px-4" onClick={e => e.stopPropagation()}>
                    {role !== 'ATHLETE' && (
                    <button
                      onClick={() => handleRemoveAthlete(athlete._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove Athlete"
                    >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-lg text-blue-900 text-center">
            No athletes found for this team.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamDetails;
