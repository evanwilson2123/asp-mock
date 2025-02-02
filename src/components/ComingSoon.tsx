'use client';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from './Dash/CoachSidebar';
import Sidebar from './Dash/Sidebar';

interface ComingSoonProps {
  description: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ description }) => {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white min-h-screen">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
        <h1 className="text-5xl font-extrabold mb-4 tracking-wide animate-bounce text-gray-900">
          🚀 Coming Soon!
        </h1>
        <p className="text-xl text-center max-w-2xl leading-relaxed mb-6 text-gray-900">
          {description}
        </p>
        <div className="flex space-x-4">
          <div className="w-4 h-4 bg-gray-900 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-gray-900 rounded-full animate-pulse delay-150"></div>
          <div className="w-4 h-4 bg-gray-900 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
