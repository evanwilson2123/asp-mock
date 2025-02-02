'use client';

import React from 'react';
import Link from 'next/link';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MobileSidebar Component
 *
 * A responsive sidebar designed for mobile devices, providing navigation links
 * to key sections of the app. It slides in and out smoothly and allows users
 * to easily close the sidebar with a button click.
 *
 * Features:
 * - **Sliding Animation:** The sidebar slides in from the left when opened and
 *   slides out when closed, providing a smooth user experience.
 * - **Responsive Design:** Optimized for mobile views while remaining hidden on
 *   larger screens (as it's primarily for mobile navigation).
 * - **Navigation Links:** Includes quick access to various app sections like
 *   Dashboard, Manage Athletes, Blast Motion, Hittrax, Trackman, etc.
 * - **Auto-Close Behavior:** Automatically closes the sidebar when a link is clicked.
 * - **Z-Index Management:** Ensures the sidebar appears above other content.
 *
 * Props:
 * - `isOpen` (boolean): Determines whether the sidebar is visible.
 * - `onClose` (function): A callback function to handle closing the sidebar.
 *
 * Usage:
 * - This component is ideal for mobile-first navigation in applications with
 *   multiple pages or dashboards, providing quick access to key sections.
 */

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`absolute top-16 left-0 w-64 bg-gray-900 text-white transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 z-50`}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">CSV Central Baby</h1>
        <button
          onClick={onClose}
          className="text-white focus:outline-none hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
        {' '}
        {/* Enable scrolling */}
        <ul className="space-y-4">
          <li>
            <Link
              href="/"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/manage-athletes"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Manage Athletes
            </Link>
          </li>
          <li>
            <Link
              href="/blast-motion"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Blast Motion
            </Link>
          </li>
          <li>
            <Link
              href="/hittrax"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Hittrax
            </Link>
          </li>
          <li>
            <Link
              href="/trackman"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Trackman
            </Link>
          </li>
          <li>
            <Link
              href="/forceplates"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Forceplates
            </Link>
          </li>
          <li>
            <Link
              href="/arm-care"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              ArmCare.com
            </Link>
          </li>
          <li>
            <Link
              href="/chat"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Chat/Messaging
            </Link>
          </li>
          <li>
            <Link
              href="/intended-zone"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Intended Zone
            </Link>
          </li>
          <li>
            <Link
              href="/stuff-plus"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Stuff Plus Calculator
            </Link>
          </li>
          <li>
            <Link
              href="/programming"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Programming
            </Link>
          </li>
          <li>
            <Link
              href="/teams-groups"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Teams/Groups
            </Link>
          </li>
          <li>
            <Link
              href="/add-members"
              className="block hover:bg-gray-700 p-3 rounded"
              onClick={onClose}
            >
              Add Players/Coaches
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileSidebar;
