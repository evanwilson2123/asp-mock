import StrikeZone from '@/components/StrikeZone';
import React from 'react';

const Page = () => {
  // Realistic data representing the percentages for each of the 9 cells in the strike zone.
  // Each value should be between 0 and 100.
  const realisticData = [32, 60, 75, 80, 55, 40, 90, 70, 24];

  return (
    <div>
      <StrikeZone
        width={300}
        height={400}
        x={10}
        y={10}
        strokeWidth={2}
        sections={realisticData}
        fillColor="red"
      />
    </div>
  );
};

export default Page;
