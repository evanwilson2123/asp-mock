"use client"; // Ensure this is a client-side component
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Works in app directory

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col sm:hidden md:block">
      <div className="sm- p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">CSV CENTRAL BABY</h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-4">
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/dashboard" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/">Dashboard</Link>
          </li>
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/analytics" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/analytics">Analytics</Link>
          </li>
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/csv-upload" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/csv-upload">CSV-Upload</Link>
          </li>
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/settings" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/settings">Settings</Link>
          </li>
          <li
            className={`hover:bg-gray-700 p-3 rounded ${
              pathname === "/logout" ? "bg-gray-700" : ""
            }`}
          >
            <Link href="/logout">Logout</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
