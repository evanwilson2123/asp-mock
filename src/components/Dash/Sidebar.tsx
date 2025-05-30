'use client'; // Ensure this is a client-side component
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Works in app directory
import MobileSidebar from './MobileSidebar';

/**
 * Sidebar Component
 *
 * A responsive sidebar for both desktop and mobile devices. This component
 * provides quick navigation to various tools and sections within the application.
 *
 * Features:
 * - **Responsive Design:**
 *   - On larger screens (md and up), a fixed sidebar is displayed.
 *   - On mobile devices, the sidebar is hidden by default and can be toggled with a button.
 * - **Expandable Dropdowns:**
 *   - "Reports" and "Coaches Tools" sections have expandable/collapsible dropdowns for additional links.
 * - **Active Link Highlighting:**
 *   - Highlights the currently active page for easy identification.
 * - **Mobile Sidebar Integration:**
 *   - Works with the `MobileSidebar` component for mobile-friendly navigation.
 *
 * Props:
 * - None (state is managed internally for toggles and active links).
 *
 * Usage:
 * - This sidebar is used for dashboard layouts or applications that require
 *   persistent navigation links.
 * - The mobile view ensures a clean UI with a hamburger menu for easy access.
 */

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCoachesToolsOpen, setIsCoachesToolsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false); // New state for Manage dropdown
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false); // New state for Admin Tools
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="items-center justify-between bg-WHITE text-white p-4 md:hidden">
        <button
          className="text-black text-2xl focus:outline-none"
          onClick={() => setIsMobileOpen(true)}
        >
          ☰
        </button>
      </div>
      <div className="md:hidden">
        <MobileSidebar
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />
      </div>
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

            {/* Manage Dropdown */}
            <li
              className="p-3 rounded hover:bg-gray-700 text-base flex justify-between items-center cursor-pointer"
              onClick={() => setIsManageOpen(!isManageOpen)}
            >
              <span>Manage</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transform transition-transform ${
                  isManageOpen ? 'rotate-180' : ''
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

            {/* Manage Dropdown Options */}
            {isManageOpen && (
              <ul className="mt-2 space-y-2 pl-4">
                <li
                  className={`p-2 rounded ${
                    pathname === '/manage-athletes' ? 'bg-gray-700' : ''
                  } hover:bg-gray-700`}
                >
                  <Link href="/manage-athletes">Manage Athletes</Link>
                </li>
                <li
                  className={`p-2 rounded ${
                    pathname === '/manage-coaches' ? 'bg-gray-700' : ''
                  } hover:bg-gray-700`}
                >
                  <Link href="/manage-coaches">Manage Coaches</Link>
                </li>
              </ul>
            )}

            {/* Reports */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/reports' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/reports">Reports</Link>
            </li>

            {/* Chat/Messaging */}
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

            {/* Dropdown Options for Coaches Tools */}
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
              </ul>
            )}

            {/* Admin Tools Section */}
            <li
              className="p-3 rounded hover:bg-gray-700 text-base flex justify-between items-center cursor-pointer"
              onClick={() => setIsAdminToolsOpen(!isAdminToolsOpen)}
            >
              <span>Admin Tools</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transform transition-transform ${
                  isAdminToolsOpen ? 'rotate-180' : ''
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

            {/* Dropdown Options for Admin Tools */}
            {isAdminToolsOpen && (
              <ul className="mt-2 space-y-2 pl-4">
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/manage-tags">Manage Athlete Tags</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/file-room">File Room</Link>
                </li>
                <li className="p-2 rounded hover:bg-gray-700">
                  <Link href="/forceplates-upload">Forceplates Upload</Link>
                </li>
              </ul>
            )}

            {/* Programming */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/programming' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/programming">Programming</Link>
            </li>

            {/* Teams/Groups */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/teams-groups' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/teams-groups">Teams/Groups</Link>
            </li>

            {/* Add Players/Coaches */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/add-members' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/add-members">Add Players/Coaches</Link>
            </li>

            {/* Assessments */}
            <li
              className={`hover:bg-gray-700 p-3 rounded ${
                pathname === '/assesment' ? 'bg-gray-700' : ''
              }`}
            >
              <Link href="/assesment">Assessments</Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
