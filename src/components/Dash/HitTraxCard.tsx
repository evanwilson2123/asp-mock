import React from 'react';
import { Line } from 'react-chartjs-2';

interface HitTraxSessionAvg {
  date: string;
  avgExitVelo: number;
}
interface HitTraxData {
  maxExitVelo?: number;
  maxDistance?: number;
  hardHitAverage?: number;
  sessionAverages?: HitTraxSessionAvg[];
}

interface HitTraxCardProps {
  data: HitTraxData | null;
}

const HitTraxCard: React.FC<HitTraxCardProps> = ({ data }) => {
  const labels = data?.sessionAverages?.map((s) => s.date) ?? [];
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Avg Exit Velo',
        data: data?.sessionAverages?.map((s) => s.avgExitVelo) ?? [],
        borderColor: 'rgba(255, 99, 132, 0.9)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 14,
          font: { size: 12 },
        },
      },
      tooltip: {
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    elements: {
      line: { borderWidth: 2 },
      point: { radius: 3 },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: { ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-2">HitTrax</h2>
      <div className="relative w-full h-60 sm:h-64 md:h-72">
        {labels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="text-gray-500">No HitTrax data available.</p>
        )}
      </div>
    </div>
  );
};

export default HitTraxCard;
