"use client"; // Ensure this is a client-side component
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Works in app directory

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCoachesToolsOpen, setIsCoachesToolsOpen] = useState(false); // State to manage dropdown
  const [isReportsOpen, setIsReportsOpen] = useState(false); // State to manage reports drop down

  return (
    <aside className="hidden md:block w-64 bg-gray-900 text-white flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">CSV CENTRAL BABY</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-4">
          {/* Dashboard */}
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/dashboard" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/">Dashboard</Link>
          </li>

          {/* Analytics */}
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/manage-athletes" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/manage-athletes">Manage Athletes</Link>
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
            <span>Reports</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform ${
                isReportsOpen ? "rotate-180" : ""
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
                  pathname === "/blast-motion" ? "bg-gray-700" : ""
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
              pathname === "/chat" ? "bg-gray-700" : ""
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
                isCoachesToolsOpen ? "rotate-180" : ""
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
                  pathname === "/intended-zone" ? "bg-gray-700" : ""
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
              pathname === "/programming" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/programming">Programming</Link>
          </li>

          {/* Logout */}
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/teams-groups" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/teams-groups">Teams/Groups</Link>
          </li>
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/add-members" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/add-members">Add Players/Coaches</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
