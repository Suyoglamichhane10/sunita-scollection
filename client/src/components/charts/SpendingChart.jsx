import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the chart.js pieces once, at module scope of this isolated chunk.
// If chart.js ever fails, only this small component is affected (it is
// lazy-loaded and guarded by an error boundary in the Dashboard).
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SpendingChart = ({ labels = [], data = [] }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Spending (Rs.)',
        data,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236,72,153,0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return <Line data={chartData} options={options} />;
};

export default SpendingChart;

