'use client'; // Ensure this is a client-side component
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Works in app directory
import { useUser } from '@clerk/nextjs';

/**
 * CoachSidebar Component
 *
 * This component renders a responsive sidebar specifically designed for coaches.
 * It provides easy navigation to key tools and resources within the application.
 *
 * Features:
 * - **Responsive Design:** Hidden on small screens and visible on medium and larger screens.
 * - **Dynamic Active Links:** Highlights the active page based on the current pathname.
 * - **Collapsible Sections:** Supports dropdowns for "Reports" and "Coaches Tools" with smooth toggle animations.
 * - **Role-Based Content:** Displays coach-specific navigation options like Manage Athletes, Reports, and Programming.
 * - **Clean UI:** Minimalistic layout with hover effects and clear visual hierarchy.
 *
 * Usage:
 * - This sidebar is intended to be used on dashboard or coach-related pages.
 * - It supports Next.js routing via `Link` from `next/link` and uses `usePathname` for dynamic highlighting.
 */

const AthleteSidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCoachesToolsOpen, setIsCoachesToolsOpen] = useState(false); // State to manage dropdown
  const [isReportsOpen, setIsReportsOpen] = useState(false); // State to manage reports drop down

  const { user, isLoaded } = useUser();
  const athleteId = user?.publicMetadata?.objectId;

  if (isLoaded) {
    return (
      <aside className="fixed overflow-y-auto z-20 hidden md:block w-64 bg-gray-900 text-white flex flex-col min-h-screen">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">TOOLS</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-4">
            {/* Dashboard */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/dashboard' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/">Dashboard</Link>
            </li>

            {/* Analytics */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === `/athlete/${athleteId}` ? 'bg-gray-700' : ''
              }`}
            >
              <Link href={`/athlete/${athleteId}`}>Profile</Link>
            </li>

            {/* CSV Upload */}
            {/* <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/csv-upload" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/csv-upload">CSV-Upload</Link>
          </li> */}
            {/* Reports Section */}
            <li
              className="p-3 rounded hover:bg-gray-700 text-base flex justify-between items-center cursor-pointer"
              onClick={() => setIsReportsOpen(!isReportsOpen)}
            >
              <span>My Reports</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transform transition-transform ${
                  isReportsOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </li>

            {/* Dropdown Options For Reports*/}
            {isReportsOpen && (
              <ul className="mt-2 space-y-2 pl-4">
                <li
                  className={`p-2 rounded ${
                    pathname === '/blast-motion' ? 'bg-gray-700' : ''
                  } hover:bg-gray-700`}
                >
                  <Link href="/blast-motion">Blast Motion</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/hittrax">Hittrax</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/trackman">Trackman</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/forceplates">Forceplates</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/arm-care">ArmCare.com</Link>
                </li>
              </ul>
            )}

            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/chat' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/chat">Chat/Messaging</Link>
            </li>

            {/* Coaches Tools Section */}
            <li
              className="p-3 rounded hover:bg-gray-700 text-base flex justify-between items-center cursor-pointer"
              onClick={() => setIsCoachesToolsOpen(!isCoachesToolsOpen)}
            >
              <span>Coaches Tools</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transform transition-transform ${
                  isCoachesToolsOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </li>

            {/* Dropdown Options for Coaches Tools*/}
            {isCoachesToolsOpen && (
              <ul className="mt-2 space-y-2 pl-4">
                <li
                  className={`p-2 rounded ${
                    pathname === '/intended-zone' ? 'bg-gray-700' : ''
                  } hover:bg-gray-700`}
                >
                  <Link href="/intended-zone">Intended Zone</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/stuff-plus">Stuff Plus Calculator</Link>
                </li>
                {/* <li className="p-2 rounded hover:bg-gray-700">
                <Link href="/program-planner">Program Planner</Link>
              </li> */}
              </ul>
            )}

            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/programming' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/programming">Programming</Link>
            </li>

            {/* Logout */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/my-team' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/my-team">My Teams/Groups</Link>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }
};

export default AthleteSidebar;
