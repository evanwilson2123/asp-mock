import React, { useState } from "react";

interface AthleteRowProps {
  name: string;
  level: string;
  status: string;
}

const AthleteRow: React.FC<AthleteRowProps> = ({ name, level, status }) => {
  const [selectedLevel, setSelectedLevel] = useState(level);
  const [selectedStatus, setSelectedStatus] = useState(status);

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
      {/* Athlete Name */}
      <div className="text-lg font-bold text-gray-700">{name}</div>

      {/* Playing Level Dropdown */}
      <div>
        <label htmlFor={`level-${name}`} className="sr-only">
          Playing Level
        </label>
        <select
          id={`level-${name}`}
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white text-gray-700"
        >
          <option value="Collegiate">Collegiate</option>
          <option value="High School">High School</option>
          <option value="Youth">Youth</option>
        </select>
      </div>

      {/* Membership Status Dropdown */}
      <div>
        <label htmlFor={`status-${name}`} className="sr-only">
          Membership Status
        </label>
        <select
          id={`status-${name}`}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white text-gray-700"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
};

export default AthleteRow;
