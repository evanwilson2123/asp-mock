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

const ManageAthletes = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    // Fetch all athletes
    const fetchAthletes = async () => {
      try {
        const response = await fetch("/api/manage-athletes");
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
  }, []);

  //   const handleBackClick = () => {
  //     if (role === "COACH") {
  //       router.push("/my-team");
  //     } else if (role === "ADMIN") {
  //       router.push("/teams-groups");
  //     } else {
  //       router.push("/"); // Default behavior
  //     }
  //   };

  const handleAthleteClick = (athleteId: string) => {
    // Navigate to athlete details page
    router.push(`/athlete/${athleteId}`);
  };

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage Athletes</h1>
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
            No athletes found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageAthletes;
