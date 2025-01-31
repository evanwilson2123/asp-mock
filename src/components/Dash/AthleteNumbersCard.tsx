import React from 'react';

interface AthleteNums {
  athleteCount: number;
  athletePCount: number;
  athleteHCount: number;
  athletePHCount: number;
  athleteSCCount: number;
}

interface AthleteNumbersCardProps {
  data: AthleteNums;
}

const AthleteNumbersCard: React.FC<AthleteNumbersCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-9">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        Athlete Numbers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
        <div>
          <span className="block text-sm text-gray-600">Total Athletes</span>
          <span className="mt-1 text-3xl font-semibold text-gray-800">
            {data.athleteCount}
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-600">Pitching</span>
          <span className="mt-1 text-3xl font-semibold text-gray-800">
            {data.athletePCount}
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-600">Hitting</span>
          <span className="mt-1 text-3xl font-semibold text-gray-800">
            {data.athleteHCount}
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-600">
            Pitching + Hitting
          </span>
          <span className="mt-1 text-3xl font-semibold text-gray-800">
            {data.athletePHCount}
          </span>
        </div>
        <div className="col-span-2 md:col-span-3">
          <span className="block text-sm text-gray-600">
            Strength &amp; Conditioning
          </span>
          <span className="mt-1 text-3xl font-semibold text-gray-800">
            {data.athleteSCCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AthleteNumbersCard;
