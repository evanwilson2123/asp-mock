"use client";

import React from "react";
import Link from "next/link";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`absolute top-16 left-0 w-64 bg-gray-900 text-white transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
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
        {" "}
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
