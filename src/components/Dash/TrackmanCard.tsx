import React from 'react';
import { Line } from 'react-chartjs-2';

interface TrackmanPitchStat {
  pitchType: string;
  peakSpeed: number;
}
interface TrackmanAvgSpeed {
  date: string;
  pitchType: string;
  avgSpeed: number;
}
interface TrackmanData {
  pitchStats?: TrackmanPitchStat[];
  avgPitchSpeeds?: TrackmanAvgSpeed[];
}

interface TrackmanCardProps {
  data: TrackmanData | null;
}

const TrackmanCard: React.FC<TrackmanCardProps> = ({ data }) => {
  const avgPitchSpeeds = data?.avgPitchSpeeds ?? [];
  // Gather all unique dates
  const allDates = Array.from(
    new Set(avgPitchSpeeds.map((item) => item.date))
  ).sort();

  // Build mapping: pitchType => array of speeds aligned with allDates
  const pitchSpeedMap: Record<string, Array<number | null>> = {};
  avgPitchSpeeds.forEach((item) => {
    if (!pitchSpeedMap[item.pitchType]) {
      pitchSpeedMap[item.pitchType] = new Array(allDates.length).fill(null);
    }
  });
  avgPitchSpeeds.forEach((item) => {
    const dateIndex = allDates.indexOf(item.date);
    pitchSpeedMap[item.pitchType][dateIndex] = item.avgSpeed;
  });

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];
  const datasets = Object.entries(pitchSpeedMap).map(
    ([pitchType, speeds], i) => ({
      label: pitchType,
      data: speeds,
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '33',
      fill: true,
      tension: 0.3,
    })
  );

  const chartData = {
    labels: allDates,
    datasets: datasets,
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
    <div className="bg-white rounded shadow p-4 flex flex-col md:col-span-2 xl:col-span-1 mb-20">
      <h2 className="text-lg font-semibold mb-2">Trackman</h2>
      <div className="relative w-full h-60 sm:h-64 md:h-72">
        {allDates.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="text-gray-500">No Trackman data available.</p>
        )}
      </div>
    </div>
  );
};

export default TrackmanCard;
