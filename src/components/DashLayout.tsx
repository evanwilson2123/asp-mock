import React from "react";
import Sidebar from "./Dash/Sidebar";

const DashLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content Area */}
      <main className="flex-1 bg-gray-100 p-6">{children}</main>
    </div>
  );
};

export default DashLayout;
