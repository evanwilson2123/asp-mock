'use client';

import React from 'react';

interface NoDataProps {
  message?: string;
}

const NoData: React.FC<NoDataProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <p className="text-gray-500 text-sm">{message || 'No Data Available'}</p>
    </div>
  );
};

export default NoData;
