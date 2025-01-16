"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import { useRouter } from "next/navigation";

const TeamsGroups: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push("/sign-in");
      return;
    }

    if (role !== "ADMIN") {
      router.push("/");
      return;
    }

    // Fetch teams from the backend
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/team");
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        } else {
          console.error("Failed to fetch teams");
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
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
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Teams & Groups</h1>
          <button
            onClick={() => router.push("/create-team")}
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
                  <p className="text-gray-600">Age Group: {team.u || "N/A"}</p>
                  <p className="text-gray-600">
                    Coach:{" "}
                    {team.coach
                      ? team.coach.firstName + " " + team.coach.lastName
                      : "N/A"}
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
