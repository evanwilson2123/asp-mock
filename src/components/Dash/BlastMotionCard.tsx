import React from 'react';
import { Line } from 'react-chartjs-2';

interface BlastSessionAvg {
  date: string;
  avgBatSpeed: number;
  avgHandSpeed: number;
}
interface BlastData {
  maxBatSpeed?: number;
  maxHandSpeed?: number;
  sessionAverages?: BlastSessionAvg[];
}

interface BlastMotionCardProps {
  data: BlastData | null;
}

const BlastMotionCard: React.FC<BlastMotionCardProps> = ({ data }) => {
  const labels = data?.sessionAverages?.map((s) => s.date) ?? [];
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Avg Bat Speed',
        data: data?.sessionAverages?.map((s) => s.avgBatSpeed) ?? [],
        borderColor: 'rgba(54, 162, 235, 0.9)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Avg Hand Speed',
        data: data?.sessionAverages?.map((s) => s.avgHandSpeed) ?? [],
        borderColor: 'rgba(75, 192, 192, 0.9)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
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
          font: {
            size: 12,
          },
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
      <h2 className="text-lg font-semibold mb-2">Blast Motion</h2>
      <div className="relative w-full h-60 sm:h-64 md:h-72">
        {labels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="text-gray-500">No Blast Motion data available.</p>
        )}
      </div>
    </div>
  );
};

export default BlastMotionCard;
