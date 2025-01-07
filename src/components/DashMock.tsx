"use client";

import React from "react";
import Sidebar from "./Dash/Sidebar";
import DashboardHeader from "./Dash/Header";
import AthleteRow from "./Dash/AthlerteRow";

const athletes = [
  { name: "John Doe", level: "Intermediate", status: "Active" },
  { name: "Jane Smith", level: "Advanced", status: "Inactive" },
  { name: "Alex Johnson", level: "Beginner", status: "Active" },
];

const DashMock: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

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
