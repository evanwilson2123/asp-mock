'use client';
import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
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

  const chartData = {
    labels,
    datasets: [
      {
        label: graphConfig.title,
        data: dataValues,
        // Provide some default styling; adjust as needed.
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
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
