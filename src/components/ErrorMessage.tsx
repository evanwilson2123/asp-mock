'use client';

import React from 'react';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import AthleteSidebar from './Dash/AthleteSidebar';

interface ErrorMessageProps {
  message: string; // Error message to display
  role: string | undefined; // Role to determine which sidebar to show
}

/**
 * ErrorMessage Component
 *
 * A reusable error display component designed to handle unexpected errors gracefully.
 * It provides users with a clear message, role-based sidebars, and an option to reload the page.
 *
 * Key Features:
 * - **Role-Based Sidebar Rendering:**
 *   - Displays the `CoachSidebar` if the user's role is 'COACH'.
 *   - Displays the default `Sidebar` for all other roles.
 *
 * - **Dynamic Error Messaging:**
 *   - Accepts a `message` prop to display custom error messages, enhancing debugging and UX.
 *
 * - **User-Friendly Design:**
 *   - Clean, modern UI with a gradient background and card-style error box.
 *   - Clear call-to-action button to reload the page, helping users recover quickly.
 *
 * - **Responsive Design:**
 *   - Optimized for both desktop and mobile views using Tailwind CSS.
 *   - Ensures accessibility with readable fonts and contrast-friendly colors.
 *
 * Technologies Used:
 * - **React** for component structure and interactivity.
 * - **Next.js** with Clerk for role-based authentication.
 * - **Tailwind CSS** for styling, layout, and responsive design.
 *
 * Props:
 * - `message` (string): The error message displayed to the user.
 * - `role` (string | undefined): Determines which sidebar to display based on the user's role.
 *
 * Usage Example:
 * ```tsx
 * <ErrorMessage
 *   message="We encountered an unexpected error while fetching the data."
 *   role={user?.publicMetadata?.role}
 * />
 * ```
 *
 * Use Cases:
 * - **API Errors:** Display when data fetching fails or an unexpected server error occurs.
 * - **Permission Issues:** Notify users if they try to access restricted content.
 * - **General Errors:** Catch-all for unknown application issues, providing a fallback UI.
 */

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, role }) => {
  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
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
