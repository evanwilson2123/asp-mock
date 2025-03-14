'use client';
import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required Chart.js components, including PointElement for line charts.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface GraphConfig {
  title: string;
  type: 'bar' | 'line' | 'pie';
  fieldIds: string[];
}

export interface FieldMapping {
  [fieldId: string]: { label: string; value: number };
}

interface GraphRendererProps {
  graphConfig: GraphConfig;
  fieldMapping: FieldMapping;
  // Optional: allow passing custom chart options
  options?: any;
}

const GraphRenderer: React.FC<GraphRendererProps> = ({
  graphConfig,
  fieldMapping,
  options,
}) => {
  // Build labels and dataset values based on the provided field mapping.
  const labels = graphConfig.fieldIds.map((id) =>
    fieldMapping[id] ? fieldMapping[id].label : id
  );
  const dataValues = graphConfig.fieldIds.map((id) =>
    fieldMapping[id] ? fieldMapping[id].value : 0
  );

  // Define three distinct colors for Pie charts.
  const pieColors = [
    'rgba(255, 99, 132, 0.6)', // Red
    'rgba(54, 162, 235, 0.6)', // Blue
    'rgba(255, 206, 86, 0.6)', // Yellow
  ];

  // Define three distinct colors for Bar charts.
  const barColors = [
    'rgba(255, 159, 64, 0.6)', // Orange
    'rgba(153, 102, 255, 0.6)', // Purple
    'rgba(75, 192, 192, 0.6)', // Green
  ];

  // For line charts use a single default color.
  const defaultBgColor = 'rgba(75,192,192,0.4)';
  const defaultBorderColor = 'rgba(75,192,192,1)';

  // Create the dataset with conditional styling based on chart type.
  let dataset;
  if (graphConfig.type === 'pie') {
    dataset = {
      label: graphConfig.title,
      data: dataValues,
      backgroundColor: labels.map(
        (_, idx) => pieColors[idx % pieColors.length]
      ),
      borderColor: labels.map((_, idx) => pieColors[idx % pieColors.length]),
      borderWidth: 1,
    };
  } else if (graphConfig.type === 'bar') {
    dataset = {
      label: graphConfig.title,
      data: dataValues,
      backgroundColor: labels.map(
        (_, idx) => barColors[idx % barColors.length]
      ),
      borderColor: labels.map((_, idx) => barColors[idx % barColors.length]),
      borderWidth: 1,
    };
  } else {
    // For line charts, use default single colors.
    dataset = {
      label: graphConfig.title,
      data: dataValues,
      backgroundColor: defaultBgColor,
      borderColor: defaultBorderColor,
      borderWidth: 1,
    };
  }

  const chartData = {
    labels,
    datasets: [dataset],
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const chartOptions = options
    ? { ...defaultOptions, ...options }
    : defaultOptions;

  // Choose the chart component based on the graph type.
  let ChartComponent;
  switch (graphConfig.type) {
    case 'line':
      ChartComponent = Line;
      break;
    case 'pie':
      ChartComponent = Pie;
      break;
    default:
      ChartComponent = Bar;
      break;
  }

  return (
    <div className="mb-6">
      <h3 className="text-black text-xl font-bold mb-2">{graphConfig.title}</h3>
      {/* Set a fixed height so that the chart is rendered consistently */}
      <div style={{ height: '300px' }}>
        <ChartComponent data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default GraphRenderer;
