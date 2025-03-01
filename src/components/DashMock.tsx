"use client";

import React from "react";
import Sidebar from "./Dash/Sidebar";
import DashboardHeader from "./Dash/Header";
import AthleteRow from "./Dash/AthleteRow";
import { useUser } from "@clerk/nextjs";
import SignInPrompt from "./SignInPrompt";
import CoachSidebar from "./Dash/CoachSidebar";

const athletes = [
  { name: "John Doe", level: "Intermediate", status: "Active" },
  { name: "Jane Smith", level: "Advanced", status: "Inactive" },
  { name: "Alex Johnson", level: "Beginner", status: "Active" },
];

const DashMock: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  return (
    <div className="flex min-h-screen min-w-screen bg-gray-100">
      {/* Sidebar */}
      {role === "COACH" ? <CoachSidebar /> : <Sidebar />}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Athlete Management"
          description="Manage athlete information and membership details."
        />

        {/* Athlete Rows */}
        <section className="flex-1 p-6 flex flex-col gap-4">
          {athletes.map((athlete, index) => (
            <AthleteRow
              key={index}
              name={athlete.name}
              level={athlete.level}
              status={athlete.status}
            />
          ))}
        </section>
      </main>
    </div>
  );
};

export default DashMock;
