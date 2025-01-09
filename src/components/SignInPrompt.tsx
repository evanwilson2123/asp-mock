"use client";

import { SignInButton } from "@clerk/nextjs";
import React from "react";

const SignInPrompt: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome to CSV Central
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Please sign in to access your dashboard.
        </p>
        <div className="flex justify-center">
          {/* Clerk's Sign-In Button */}
          <SignInButton>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
};

export default SignInPrompt;
