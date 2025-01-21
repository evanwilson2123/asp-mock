"use client";

import React from "react";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";

interface ErrorMessageProps {
  message: string; // Error message to display
  role: string | undefined; // Role to determine which sidebar to show
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, role }) => {
  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <div className="max-w-lg w-full p-8 bg-white border border-gray-300 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Oops! Something went wrong
          </h1>
          <p className="text-center text-gray-600 mb-6">{message}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
