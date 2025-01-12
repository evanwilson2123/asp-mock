"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string; // Example: "Beginner", "Intermediate"
  u?: string; // Optional identifier or age group
}

const TeamDetails = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { teamId } = useParams(); // Extract `teamId` from the route

  useEffect(() => {
    // Fetch athletes for the team
    const fetchAthletes = async () => {
      try {
        const response = await fetch(`/api/my-teams/${teamId}/`);
        if (!response.ok) {
          throw new Error("Failed to fetch athletes");
        }

        const data = await response.json();
        setAthletes(data.athletes || []);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [teamId]);

  const handleAthleteClick = (athleteId: string) => {
    // Future implementation: Redirect to athlete details page
    router.push(`/athlete/${athleteId}`);
  };

  if (loading) return <div>Loading athletes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-700">Team Details</h1>
        <button
          onClick={() => router.push("/my-team")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Back to Teams
        </button>
      </div>

      {/* Athletes List */}
      {athletes.length > 0 ? (
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
            {athletes.map((athlete) => (
              <tr
                key={athlete._id}
                onClick={() => handleAthleteClick(athlete._id)}
                className="hover:bg-blue-50 cursor-pointer"
              >
                <td className="text-black py-2 px-4">{athlete.firstName}</td>
                <td className="text-black py-2 px-4">{athlete.lastName}</td>
                <td className="text-black py-2 px-4">{athlete.email}</td>
                <td className="text-black py-2 px-4">{athlete.level}</td>
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
  );
};

export default TeamDetails;
