"use client";

import React from "react";
import { useUser } from "@clerk/nextjs"; // If you're using Clerk
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";

const Loader: React.FC = () => {
  // If you want conditional sidebar logic (e.g. "COACH" role)
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main area for loader */}
      <div className="flex-1 flex items-center justify-center bg-white">
        {/* 
          Tailwind spinner:
          - animate-spin for rotation
          - border-t-blue-700 for the "accent" color
          - rest is a lighter border
        */}
        <div className="animate-spin rounded-full h-16 w-16 border-8 border-blue-200 border-t-blue-700" />
      </div>
    </div>
  );
};

export default Loader;
