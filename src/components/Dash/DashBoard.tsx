import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import CoachSidebar from "./CoachSidebar";
import Sidebar from "./Sidebar";

const DashBoard = () => {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  // const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {});

  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Main Content */}

      <h1>DashBoard</h1>
    </div>
  );
};

export default DashBoard;
