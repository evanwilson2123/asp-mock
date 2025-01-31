import React from 'react';

interface LevelSelectorProps {
  level: string;
  setLevel: (level: string) => void;
  levels: string[];
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  level,
  setLevel,
  levels,
}) => {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-lg font-semibold">Select Level</label>
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        className="p-2 border rounded"
      >
        {levels.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LevelSelector;
