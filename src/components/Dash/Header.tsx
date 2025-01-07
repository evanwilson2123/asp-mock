import React from "react";

interface DashboardHeaderProps {
  title: string;
  description: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
}) => {
  return (
    <header className="bg-white shadow p-6">
      <h1 className="text-2xl font-bold text-gray-700">{title}</h1>
      <p className="text-gray-500">{description}</p>
    </header>
  );
};

export default DashboardHeader;
