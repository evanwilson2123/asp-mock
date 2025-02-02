'use client';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from './Dash/CoachSidebar';
import Sidebar from './Dash/Sidebar';

interface ComingSoonProps {
  description: string;
}

/**
 * ComingSoon Component
 *
 * A simple, animated "Coming Soon" page designed to inform users about features that are
 * currently under development. It includes role-based sidebar rendering, dynamic descriptions,
 * and engaging animations to enhance the user experience.
 *
 * Key Features:
 * - **Role-Based Sidebar Rendering:**
 *   - Displays the `CoachSidebar` if the user role is 'COACH'.
 *   - Displays the default `Sidebar` for all other roles.
 *
 * - **Dynamic Content:**
 *   - Accepts a `description` prop to customize the message for different features/pages.
 *
 * - **Engaging Animations:**
 *   - Animated "🚀 Coming Soon!" text with a bouncing effect to catch attention.
 *   - Pulsing dots animation below the description for a dynamic feel.
 *
 * - **Responsive Design:**
 *   - Optimized for both desktop and mobile views with conditional sidebars.
 *   - Uses Tailwind CSS for responsive layout and styling consistency.
 *
 * Technologies Used:
 * - **React** for component structure and state management.
 * - **Next.js** with Clerk for role-based authentication.
 * - **Tailwind CSS** for responsive design and animations.
 *
 * Props:
 * - `description` (string): The custom message displayed below the "Coming Soon!" header.
 *
 * Usage Example:
 * ```tsx
 * <ComingSoon description="We're working on an exciting new feature to help you track athlete performance like never before. Stay tuned!" />
 * ```
 *
 * Use Cases:
 * - **For New Features:** Display as a placeholder for pages/features still in development.
 * - **For Maintenance:** Notify users when a feature is temporarily unavailable.
 * - **For Product Launches:** Tease upcoming releases within the app.
 */

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
