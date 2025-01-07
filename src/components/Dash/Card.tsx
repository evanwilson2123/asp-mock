import React from "react";

interface CardProps {
  title: string;
  description: string;
}

const Card: React.FC<CardProps> = ({ title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2">{description}</p>
    </div>
  );
};

export default Card;
